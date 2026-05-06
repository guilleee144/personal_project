import os
import json
import re
import asyncio
import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from services.supabase_client import get_supabase
import random

load_dotenv()
router = APIRouter(prefix="/builds", tags=["Builds"])
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class BuildQuery(BaseModel):
    playstyle: str
    is_dlc: bool = False

# ─── Normalización ────────────────────────────────────────────────────────────

_norm_cache: dict[str, str] = {}

def normalize(text: str) -> str:
    if text in _norm_cache:
        return _norm_cache[text]
    if not text:
        return ""
    t = text.lower()
    t = t.replace("'", "").replace("'", "").replace("-", "")
    t = re.sub(r'\+\d+\s*variant', '', t)
    t = re.sub(r'variant', '', t)
    t = re.sub(r'\+\d+', '', t)
    result = "".join(re.findall(r'[a-z0-9]+', t)).strip()
    _norm_cache[text] = result
    return result

FORBIDDEN = {
    "none", "na", "head", "body", "hands", "legs", "feet",
    "chest", "helm", "gauntlets", "greaves", "mainhand", "offhand",
    "main", "off", "hand", "weapon", "armor", "talisman", "shield",
    "gloves", "boots", "leggings", "headpiece", "torso", "arms"
}

def is_forbidden(name: str) -> bool:
    return normalize(name) in FORBIDDEN or len(normalize(name)) < 3

# ─── Fuzzy match ──────────────────────────────────────────────────────────────

def find_match(
    ai_name: str,
    pool: list[dict],
    preferred_categories: list[str] | None = None
) -> dict | None:
    if not ai_name or is_forbidden(ai_name):
        return None
    norm_ai = normalize(ai_name)
    if not norm_ai:
        return None

    for item in pool:
        cat = item.get("category", "")
        if preferred_categories and cat not in preferred_categories:
            continue
        if normalize(item.get("name", "")) == norm_ai:
            return {"name": item["name"], "image": item.get("image")}

    for item in pool:
        cat = item.get("category", "")
        if preferred_categories and cat not in preferred_categories:
            continue
        norm_db = normalize(item.get("name", ""))
        if norm_ai in norm_db or norm_db in norm_ai:
            return {"name": item["name"], "image": item.get("image")}

    for item in pool:
        if normalize(item.get("name", "")) == norm_ai:
            return {"name": item["name"], "image": item.get("image")}

    for item in pool:
        norm_db = normalize(item.get("name", ""))
        if norm_ai in norm_db or norm_db in norm_ai:
            return {"name": item["name"], "image": item.get("image")}

    return {"name": ai_name, "image": None}

def safe_list(value) -> list:
    if isinstance(value, list):
        return [str(v) for v in value if v and not is_forbidden(str(v))]
    if isinstance(value, str) and len(value) > 3:
        return [value]
    return []

# ─── Fetch paginado ───────────────────────────────────────────────────────────

def fetch_all(table: str, columns: str, filters: dict | None = None) -> list[dict]:
    sb = get_supabase()
    all_data = []
    page = 0
    page_size = 1000
    while True:
        query = sb.table(table).select(columns).range(page * page_size, (page + 1) * page_size - 1)
        if filters:
            for k, v in filters.items():
                query = query.eq(k, v)
        data = query.execute().data or []
        all_data.extend(data)
        if len(data) < page_size:
            break
        page += 1
    return all_data

# ─── Pools con imágenes ───────────────────────────────────────────────────────

def load_pools() -> dict:
    print("\n[POOLS] Cargando pools con imágenes...")
    weapons   = fetch_all("weapons",      "name, image, requirements, category")
    shields   = fetch_all("shields",      "name, image, requirements, category")
    armors    = fetch_all("armors",       "name, image, type")
    talismans = fetch_all("talismans",    "name, image, effect")
    sorceries = fetch_all("sorceries",    "name, image")
    incants   = fetch_all("incantations", "name, image")
    skills    = fetch_all("skills",       "name, image")
    spirits   = fetch_all("spirit_ashes", "name, image")
    runes     = fetch_all("great_runes",  "name, image")

    all_weapons = [{"name": w["name"], "image": w["image"], "category": "weapon"} for w in weapons]
    all_weapons += [{"name": s["name"], "image": s["image"], "category": "shield"} for s in shields]
    all_spells  = [{"name": s["name"], "image": s["image"]} for s in sorceries]
    all_spells  += [{"name": i["name"], "image": i["image"]} for i in incants]

    print(f"  weapons+shields: {len(all_weapons)} | armors: {len(armors)}")
    print(f"  talismans: {len(talismans)} | spells: {len(all_spells)}")
    print(f"  skills: {len(skills)} | spirits: {len(spirits)} | runes: {len(runes)}")

    return {
        "weapons":   all_weapons,
        "armors":    [{"name": a["name"], "image": a["image"], "category": a.get("type")} for a in armors],
        "talismans": talismans,
        "spells":    all_spells,
        "skills":    skills,
        "spirits":   spirits,
        "runes":     runes,
    }

# ─── Búsqueda en internet ─────────────────────────────────────────────────────

PLAYSTYLE_EN = {
    "fuerza":   "strength build guide",
    "destreza": "dexterity build guide",
    "magia":    "intelligence sorcery build guide",
    "fe":       "faith incantation build guide",
    "arcano":   "arcane dragon build guide",
    "sangrado": "bleed hemorrhage build guide",
    "mixto":    "quality hybrid build guide",
}

SCRAPE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
}

async def fetch_page_text(url: str, client: httpx.AsyncClient) -> str:
    try:
        res = await client.get(url, timeout=10.0, follow_redirects=True)
        if res.status_code != 200:
            return ""
        soup = BeautifulSoup(res.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        return soup.get_text(separator="\n", strip=True)[:5000]
    except Exception as e:
        print(f"[FETCH] Error en {url}: {e}")
        return ""

async def search_internet_builds(playstyle: str, is_dlc: bool) -> str:
    query_en = PLAYSTYLE_EN.get(playstyle.lower(), f"{playstyle} build guide")
    dlc_note = "shadow of the erdtree DLC" if is_dlc else ""
    search_query = f"elden ring {query_en} {dlc_note} 2024 site:fextralife.com OR site:reddit.com OR site:eldenring.wiki.fextralife.com"

    print(f"[SEARCH] Buscando: '{search_query}'")

    # URLs directas conocidas por playstyle — más fiables que Google scraping
    DIRECT_URLS = {
        "fuerza":   [
            "https://eldenring.wiki.fextralife.com/Strength+Builds",
            "https://old.reddit.com/r/EldenRingBuilds/search.json?q=strength+build+guide+stats&restrict_sr=1&sort=top&t=year&limit=5",
        ],
        "destreza": [
            "https://eldenring.wiki.fextralife.com/Dexterity+Builds",
            "https://old.reddit.com/r/EldenRingBuilds/search.json?q=dexterity+build+guide+stats&restrict_sr=1&sort=top&t=year&limit=5",
        ],
        "magia": [
            "https://eldenring.wiki.fextralife.com/Intelligence+Builds",
            "https://old.reddit.com/r/EldenRingBuilds/search.json?q=intelligence+sorcery+build+guide+stats&restrict_sr=1&sort=top&t=year&limit=5",
        ],
        "fe": [
            "https://eldenring.wiki.fextralife.com/Faith+Builds",
            "https://old.reddit.com/r/EldenRingBuilds/search.json?q=faith+incantation+build+guide+stats&restrict_sr=1&sort=top&t=year&limit=5",
        ],
        "arcano": [
            "https://eldenring.wiki.fextralife.com/Arcane+Builds",
            "https://old.reddit.com/r/EldenRingBuilds/search.json?q=arcane+dragon+build+guide+stats&restrict_sr=1&sort=top&t=year&limit=5",
        ],
        "sangrado": [
            "https://eldenring.wiki.fextralife.com/Bleed+Builds",
            "https://old.reddit.com/r/EldenRingBuilds/search.json?q=bleed+hemorrhage+build+guide+stats&restrict_sr=1&sort=top&t=year&limit=5",
        ],
        "mixto": [
            "https://eldenring.wiki.fextralife.com/Quality+Builds",
            "https://old.reddit.com/r/EldenRingBuilds/search.json?q=quality+hybrid+build+guide+stats&restrict_sr=1&sort=top&t=year&limit=5",
        ],
    }

    urls = DIRECT_URLS.get(playstyle.lower(), [])
    combined_text = ""

    async with httpx.AsyncClient(headers=SCRAPE_HEADERS, timeout=15.0) as c:
        for url in urls:
            # Reddit JSON
            if "reddit.com" in url and ".json" in url:
                try:
                    res = await c.get(url)
                    if res.status_code == 200:
                        posts = res.json().get("data", {}).get("children", [])
                        for post in posts[:3]:
                            p = post.get("data", {})
                            title    = p.get("title", "")
                            selftext = p.get("selftext", "")
                            if len(selftext) > 200:
                                combined_text += f"\n\n=== REDDIT: {title} ===\n{selftext[:2000]}"
                                print(f"[SEARCH] Reddit post: '{title[:50]}'")
                    await asyncio.sleep(0.5)
                except Exception as e:
                    print(f"[SEARCH] Reddit error: {e}")
            else:
                # Fextralife o web normal
                text = await fetch_page_text(url, c)
                if text:
                    combined_text += f"\n\n=== {url} ===\n{text[:2000]}"
                    print(f"[SEARCH] Página raspada: {url}")
                await asyncio.sleep(0.5)

    print(f"[SEARCH] Contexto total: {len(combined_text)} chars")
    return combined_text[:8000]

# ─── Contexto de la DB ────────────────────────────────────────────────────────

async def get_db_context() -> dict:
    print("\n[DB CONTEXT] Cargando nombres...")

    weapons   = fetch_all("weapons",      "name, requirements, category, dlc")
    shields   = fetch_all("shields",      "name, requirements, category, dlc")
    armors    = fetch_all("armors",       "name, type, special_effect, dlc")
    talismans = fetch_all("talismans",    "name, effect, dlc")
    spirits   = fetch_all("spirit_ashes", "name, dlc")
    sorceries = fetch_all("sorceries",    "name, int_req, dlc")
    incants   = fetch_all("incantations", "name, int_req, fai_req, arc_req, dlc")
    skills    = fetch_all("skills",       "name, equipment, dlc")
    runes     = fetch_all("great_runes",  "name")

    THRESHOLDS = {
        "fuerza":   ("str", 18),
        "destreza": ("dex", 16),
        "magia":    ("int", 14),
        "fe":       ("fai", 14),
        "arcano":   ("arc", 14),
    }

    ARMOR_EFFECT_KEYWORDS = {
        "sangrado": ["blood loss", "hemorrhage", "bleed", "arcane", "all damage"],
        "fuerza":   ["strength", "all damage", "maximum hp", "stamina", "equip load"],
        "destreza": ["dexterity", "all damage", "dancing", "keen", "swift"],
        "magia":    ["intelligence", "sorcery", "magic", "glintstone", "memory"],
        "fe":       ["faith", "sacred", "holy", "incantation", "flame", "fire"],
        "arcano":   ["arcane", "dragon", "rot", "poison", "blood", "all damage"],
        "mixto":    ["all damage", "stamina", "maximum hp", "equip load"],
    }

    def score_armor(armor: dict, ps: str) -> int:
        keywords = ARMOR_EFFECT_KEYWORDS.get(ps, [])
        effect = (armor.get("special_effect") or "").lower()
        if not effect:
            return 0
        return sum(1 for kw in keywords if kw in effect)

    meta_armor_by_playstyle = {}
    for ps in ARMOR_EFFECT_KEYWORDS.keys():
        scored = [(a, score_armor(a, ps)) for a in armors]
        scored.sort(key=lambda x: x[1], reverse=True)
        meta_pieces: dict = {"helm": [], "chest armor": [], "gauntlets": [], "leg armor": []}
        for armor, score in scored:
            if score > 0:
                slot = armor.get("type", "")
                if slot in meta_pieces and len(meta_pieces[slot]) < 4:
                    meta_pieces[slot].append(armor["name"])
        meta_armor_by_playstyle[ps] = meta_pieces

    def classify_weapon(req) -> str:
        if not req or not isinstance(req, dict):
            return "mixto"
        stats = {k.lower(): int(v) if str(v).strip().isdigit() else 0 for k, v in req.items()}
        best_ps, best_val = "mixto", 0
        for ps, (stat, threshold) in THRESHOLDS.items():
            val = stats.get(stat, 0)
            if val >= threshold and val > best_val:
                best_ps = ps
                best_val = val
        return best_ps

    weapons_by_playstyle: dict = {ps: [] for ps in ["fuerza", "destreza", "magia", "fe", "arcano", "sangrado", "mixto"]}

    BLEED_WEAPONS = [
        "rivers of blood", "mohgwyn", "reduvia", "bloodfiend", "nagakiba",
        "uchigatana", "serpentbone", "eleonora",
    ]
    FE_WEAPON_KEYWORDS = [
    "blasphemous", "sacred", "erdtree", "golden", "halo", "coded",
    "envoy", "treespear", "loretta", "marika", "gargoyle", "godslayer",
    "dragon king", "fire knight", "messmer", "spiritflame", "sunset",
    "grafted blade",
]

    for w in weapons + shields:
        name_lower = w["name"].lower()
        # Sangrado
        if any(bw in name_lower for bw in BLEED_WEAPONS):
            weapons_by_playstyle["sangrado"].append(w["name"])
        # Fe — añadir armas con keywords de Fe aunque su stat dominante sea otro
        if any(kw in name_lower for kw in FE_WEAPON_KEYWORDS):
            if w["name"] not in weapons_by_playstyle["fe"]:
                weapons_by_playstyle["fe"].append(w["name"])
        # Clasificación normal por stat dominante
        ps = classify_weapon(w.get("requirements"))
        weapons_by_playstyle[ps].append(w["name"])

    weapons_by_playstyle["sangrado"] += [
        w["name"] for w in weapons
        if "blood" in w["name"].lower() or "arc" in str(w.get("requirements", "")).lower()
    ]

    SKILL_KEYWORDS = {
        "fuerza":   ["colossal", "great", "hammer", "axe", "large", "greatsword", "swords, axes"],
        "destreza": ["curved", "katana", "dagger", "twinblade", "thrusting", "all melee"],
        "magia":    ["staff", "glintstone", "magic", "catalyst"],
        "fe":       ["seal", "sacred", "holy", "incantation"],
        "arcano":   ["dragon", "blood", "rot", "frenzy"],
        "sangrado": ["blood", "curved", "katana", "all melee", "twinblade", "claws"],
        "mixto":    ["all melee", "swords", "polearm", "spear"],
    }

    skills_by_playstyle: dict = {ps: [] for ps in SKILL_KEYWORDS.keys()}
    for sk in skills:
        equip = (sk.get("equipment") or "").lower()
        name_lower = sk["name"].lower()
        assigned = False
        for ps, kws in SKILL_KEYWORDS.items():
            if any(kw in equip or kw in name_lower for kw in kws):
                skills_by_playstyle[ps].append(sk["name"])
                assigned = True
        if not assigned:
            skills_by_playstyle["mixto"].append(sk["name"])

    TALISMAN_KEYWORDS = {
        "fuerza":   ["strength", "endure", "great shield", "colossal", "heavy", "stamina", "robustness"],
        "destreza": ["dexterity", "keen", "swift", "claw", "blood", "succession", "curved"],
        "magia":    ["sorcery", "glintstone", "magic", "memory", "intelligence", "cerulean"],
        "fe":       ["faith", "sacred", "holy", "incantation", "erdtree", "flame", "fire"],
        "arcano":   ["arcane", "dragon", "rot", "poison", "blood", "frenzy"],
        "sangrado": ["blood", "hemorrhage", "bleed", "arcane", "succession", "claw"],
        "mixto":    ["stamina", "hp", "equip", "load", "erdtree", "crimson"],
    }

    def talisman_score(talisman: dict, ps: str) -> int:
        keywords = TALISMAN_KEYWORDS.get(ps, [])
        text = (talisman.get("effect") or talisman.get("name") or "").lower()
        return sum(1 for kw in keywords if kw in text)

    talismans_by_playstyle = {}
    for ps in weapons_by_playstyle.keys():
        scored = [(t, talisman_score(t, ps)) for t in talismans]
        scored.sort(key=lambda x: x[1], reverse=True)
        talismans_by_playstyle[ps] = [t["name"] for t, _ in scored if t["name"]]

    helms     = [a["name"] for a in armors if a.get("type") == "helm"]
    chests    = [a["name"] for a in armors if a.get("type") == "chest armor"]
    gauntlets = [a["name"] for a in armors if a.get("type") == "gauntlets"]
    greaves   = [a["name"] for a in armors if a.get("type") == "leg armor"]

    pure_sorceries = [s["name"] for s in sorceries if s.get("int_req", 0) > 0]
    pure_incants   = [i["name"] for i in incants if i.get("fai_req", 0) > 0]
    arc_incants    = [i["name"] for i in incants if i.get("arc_req", 0) > 0]

    return {
        "weapons_by_playstyle":    weapons_by_playstyle,
        "skills_by_playstyle":     skills_by_playstyle,
        "talismans_by_playstyle":  talismans_by_playstyle,
        "meta_armor_by_playstyle": meta_armor_by_playstyle,
        "helms":            helms,
        "chests":           chests,
        "gauntlets":        gauntlets,
        "greaves":          greaves,
        "spirits":          [s["name"] for s in spirits],
        "sorceries":        pure_sorceries,
        "incantations":     pure_incants,
        "arc_incantations": arc_incants,
        "skills":           [s["name"] for s in skills],
        "runes":            [r["name"] for r in runes],
    }

# ─── IA con contexto de internet + DB ────────────────────────────────────────

async def get_ai_build(playstyle: str, is_dlc: bool, ctx: dict, internet_context: str) -> dict:
    dlc_note = "Focus on DLC Shadow of the Erdtree items when possible." if is_dlc else "Use base game items."

    def sample(lst, n=15):
        shuffled = lst.copy()
        random.shuffle(shuffled)
        return shuffled[:n]

    ps = playstyle.lower()
    playstyle_weapons  = ctx["weapons_by_playstyle"].get(ps, ctx["weapons_by_playstyle"]["mixto"])
    relevant_talismans = ctx["talismans_by_playstyle"].get(ps, [])
    relevant_skills    = ctx["skills_by_playstyle"].get(ps, ctx["skills"])
    meta_armor         = ctx["meta_armor_by_playstyle"].get(ps, {})

    if ps == "magia":
        spells = ctx.get("sorceries", [])
    elif ps == "fe":
        spells = ctx.get("incantations", [])
    elif ps == "arcano":
        spells = ctx.get("arc_incantations", [])
    else:
        spells = []

    prompt = f"""You are an Elden Ring expert. Generate a META and COHERENT build for playstyle: "{playstyle}".
{dlc_note}

REAL BUILD GUIDES FROM THE INTERNET (use this as reference for what items are meta):
{internet_context if internet_context else "No internet context available, use your knowledge."}

AVAILABLE ITEMS IN OUR DATABASE (you MUST use EXACT names from these lists):
WEAPONS for {playstyle}: {json.dumps(sample(playstyle_weapons, 25))}
META ARMOR PIECES for {playstyle}:
- Helms with effects: {json.dumps(meta_armor.get("helm", []) or sample(ctx["helms"], 8))}
- Chests with effects: {json.dumps(meta_armor.get("chest armor", []) or sample(ctx["chests"], 8))}
- Gauntlets with effects: {json.dumps(meta_armor.get("gauntlets", []) or sample(ctx["gauntlets"], 6))}
- Greaves with effects: {json.dumps(meta_armor.get("leg armor", []) or sample(ctx["greaves"], 6))}
TALISMANS for {playstyle}: {json.dumps(relevant_talismans[:20])}
SKILLS (Ashes of War): {json.dumps(sample(relevant_skills, 15))}
SPIRIT ASHES: {json.dumps(sample(ctx['spirits'], 10))}
SPELLS: {json.dumps(sample(spells, 20)) if spells else "[]"}
GREAT RUNES: {json.dumps(ctx['runes'])}

STRICT RULES:
1. Use the internet guides as reference for WHICH items are meta for {playstyle}.
2. weapon: 1-2 weapons that are META for {playstyle}.
   For FAITH builds: prioritize sacred/holy weapons like Blasphemous Blade, Erdtree Sword, 
   Golden Order Greatsword, or weapons with Faith scaling. Include a Sacred Seal for casting.
   Mix melee weapons with a seal (paladin style).
3. If an internet-recommended item appears in the database list, use it.
4. weapon: 1-2 weapons that are META for {playstyle}.
5. armor: BEST pieces per slot based on {playstyle} synergy — mix sets if effects are better.
6. talismans: exactly 4 that directly boost {playstyle}.
7. skills: 1-2 Ashes of War ONLY compatible with your weapon type.
8. spells: if {playstyle} is magia pick 4-6 sorceries, if fe pick 4-6 incantations, if arcano pick 2-4 arcane incantations, else [].
9. NEVER pick blood/arcane skills for strength/dex builds.
10. description: in Spanish, explain the synergy and why these items are meta.

JSON only:
{{"build_name":"","description":"","weapon":[],"armor":[],"talismans":[],"spirit_ashes":[],"spells":[],"skills":[],"great_rune":""}}"""

    print("\n[AI] Enviando prompt a Groq con contexto de internet...")
    completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        temperature=0.5,
    )
    parsed = json.loads(completion.choices[0].message.content)
    print(f"\n[AI RAW]\n{json.dumps(parsed, indent=2, ensure_ascii=False)}")
    return parsed

# ─── Endpoint principal ───────────────────────────────────────────────────────

@router.post("/search")
async def search_builds(query: BuildQuery):
    print(f"\n{'='*60}")
    print(f"[BUILD REQUEST] playstyle='{query.playstyle}' is_dlc={query.is_dlc}")
    print(f"{'='*60}")

    try:
        # Cargar pools e internet en paralelo
        pools_task    = asyncio.get_event_loop().run_in_executor(None, load_pools)
        internet_task = search_internet_builds(query.playstyle, query.is_dlc)
        ctx_task      = get_db_context()

        pools, internet_context, ctx = await asyncio.gather(
            asyncio.wrap_future(pools_task),
            internet_task,
            ctx_task,
        )

        raw = await get_ai_build(query.playstyle, query.is_dlc, ctx, internet_context)

        def resolve(names, pool, cats=None):
            res = []
            seen = set()
            for name in safe_list(names):
                match = find_match(name, pool, cats)
                if match and match["name"] not in seen:
                    seen.add(match["name"])
                    res.append(match)
            return res

        return {
            "build_name":   raw.get("build_name", f"Build de {query.playstyle}"),
            "description":  raw.get("description", ""),
            "source":       "ai",
            "weapon":       resolve(raw.get("weapon", []),        pools["weapons"],  ["weapon", "shield"]),
            "armor":        resolve(raw.get("armor", []),          pools["armors"],   ["helm", "chest armor", "gauntlets", "leg armor"]),
            "talismans":    resolve(raw.get("talismans", []),      pools["talismans"]),
            "spirit_ashes": resolve(raw.get("spirit_ashes", []),  pools["spirits"]),
            "spells":       resolve(raw.get("spells", []),         pools["spells"]),
            "skills":       resolve(raw.get("skills", []),         pools["skills"]),
            "great_rune":   find_match(raw.get("great_rune", ""), pools["runes"]),
        }

    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ─── Debug endpoints ──────────────────────────────────────────────────────────

@router.get("/debug-pool-size")
def debug_pool_size():
    return {
        "weapons":      len(fetch_all("weapons",      "name")),
        "shields":      len(fetch_all("shields",      "name")),
        "armors":       len(fetch_all("armors",       "name")),
        "talismans":    len(fetch_all("talismans",    "name")),
        "sorceries":    len(fetch_all("sorceries",    "name")),
        "incantations": len(fetch_all("incantations", "name")),
        "skills":       len(fetch_all("skills",       "name")),
        "spirit_ashes": len(fetch_all("spirit_ashes", "name")),
    }

@router.get("/list")
def list_builds():
    sb = get_supabase()
    builds = sb.table("builds").select("id, title, playstyle, upvotes, is_dlc, scraped_at").order("upvotes", desc=True).execute().data or []
    return {"total": len(builds), "builds": builds}