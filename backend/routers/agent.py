import os
import json
import re
import unicodedata
import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter
from models.schemas import AgentQuery
from services.supabase_client import get_supabase
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/agent", tags=["agent"])
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SCRAPE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
}

# ─────────────────────────────────────────────
# CONOCIMIENTO HARDCODEADO — CRITICAL FACTS
# ─────────────────────────────────────────────
HARDCODED_KNOWLEDGE = """
CRITICAL KNOWLEDGE — ALWAYS PRIORITIZE THIS:

## ACCESSING THE DLC "Shadow of the Erdtree"
To access the DLC you must meet TWO mandatory in-game requirements:
1. Defeat Mohg, Lord of Blood (located in Mohgwyn Palace, reached via the portal in the Consecrated Snowfield or through White Mask Varre's questline invitation).
2. Interact with Miquella's arm (the Cocoon of Miquella) in Mohg's throne room, right after defeating him.
Touching the cocoon triggers a loading screen and transports you to the Realm of Shadow, the DLC's main area.
Talking to Leda is NOT required to enter — Leda appears inside the DLC once you're already in.
Recommended level to enter: approximately RL 120-150 with weapons at +20/+9.

## SCADUTREE FRAGMENTS — DLC Progression System
The DLC has its own progression system independent of character level: Scadutree Fragments.
- Found scattered throughout the Realm of Shadow.
- Used at a Site of Grace to increase the Scadutree Blessing (up to level 20).
- They increase your damage output AND reduce damage received in the DLC.
- Farming these fragments before fighting DLC bosses is ESSENTIAL.
- Revered Spirit Ashes also exist to upgrade spirit ashes inside the DLC.

## MAIN DLC BOSSES (approximate order)
1. Divine Beast Dancing Lion — Belurat, Tower Settlement
2. Rellana, Twin Moon Knight — Castle Ensis
3. Commander Gaius — Scadu Altus
4. Messmer the Impaler — Shadow Keep (iconic DLC boss)
5. Romina, Saint of the Bud — Ancient Ruins of Rauh
6. Putrescent Knight — Stone Coffin Fissure
7. Midra, Lord of Frenzied Flame — Abyssal Woods (secret area, very hard)
8. Bayle the Dread — Dragon's Pit (optional but one of the toughest)
9. Metyr, Mother of Fingers — Finger Ruins
10. Promised Consort Radahn — Enir-Ilim (DLC FINAL BOSS, considered hardest in the game)

## PROMISED CONSORT RADAHN
- Full name: Radahn, Consort of Miquella / Promised Consort Radahn
- Final boss of the Shadow of the Erdtree DLC
- 2 phases: first as Radahn alone, second with Miquella riding him
- Widely considered the hardest boss in the entire FromSoftware franchise
- Located in Enir-Ilim, at the end of the DLC
- Drops: Remembrance of a God and a Lord, 500,000 runes
- Weaknesses: No clear weaknesses — resists most damage types fairly well
- Strategy: Learn his combos, use high-damage spirit ashes (Black Knife Tiche), keep distance in phase 2

## MALENIA, BLADE OF MIQUELLA
- Optional boss in the base game, considered the hardest boss in the base game
- Location: Elphael, Brace of the Haligtree (secret area, requires both halves of the Haligtree Medallion)
- 2 phases, heals HP with every hit she lands (including blocked hits)
- Drops: Remembrance of the Rot Goddess, Malenia's Great Rune
- Weaknesses: Frost (slows her healing), burst damage builds

## MOHG, LORD OF BLOOD
- Location: Mohgwyn Palace
- How to reach: Portal in the Consecrated Snowfield (after White Mask Varre's quest) OR portal in the Altus Plateau mountains
- Drops: Remembrance of the Blood Lord (→ Mohgwyn's Sacred Spear or Bloodboon), Mohg's Great Rune, 420,000 runes
- Important: Use Purifying Crystal Tear in the Flask of Wondrous Physick to negate his Nihil in phase 2
- Use Mohg's Shackle during phase 1 to briefly stagger him
- REQUIRED to access the DLC

## BEST META BUILDS (updated)
### Bleed
- Weapons: Rivers of Blood (Arcane), Eleonora's Poleblade, Mohgwyn's Sacred Spear, Bloodfiend's Arm [DLC]
- Stats: 60 Arcane, minimum 25 Dex
- Talismans: Lord of Blood's Exultation, Millicent's Prosthesis, Rotten Winged Sword Insignia, Shard of Alexander
- Ash of War: Corpse Piler (Rivers of Blood), Bloodblade Dance (Eleonora's)
- Spirit: Mimic Tear or Black Knife Tiche

### Strength
- Weapons: Greatsword, Giant-Crusher, Bloodfiend's Arm [DLC], Anvil Hammer [DLC]
- Stats: 66 Strength (two-handing = 99 effective), 25 Endurance
- Talismans: Shard of Alexander, Bull-Goat's Talisman, Great-Jar's Arsenal, Erdtree's Favor
- Ash of War: Prelate's Charge, Giant Hunt, Barbaric Roar

### Intelligence
- Weapons: Moonveil, Dark Moon Greatsword, Staff of Loss, Carian Regal Scepter
- Stats: 60-80 Intelligence
- Talismans: Graven-Mass Talisman, Graven-School Talisman, Magic Scorpion Charm, Godfrey Icon
- Top spells: Comet Azur, Stars of Ruin, Rennala's Full Moon, Glintstone Icecrag

### Faith
- Weapons: Blasphemous Blade, Golden Order Greatsword, Erdtree Seal
- Stats: 60-80 Faith
- Top incantations: Elden Stars, Black Flame, Erdtree Heal, Ancient Dragons' Lightning Strike
- Talismans: Faithful's Canvas Talisman, Two Fingers Heirloom, Flock's Canvas Talisman

### Dexterity
- Weapons: Hand of Malenia, Nagakiba, Dragon King's Cragblade, Messmer's Spear [DLC]
- Stats: 80 Dexterity
- Talismans: Rotten Winged Sword Insignia, Millicent's Prosthesis, Shard of Alexander

### Arcane
- Weapons: Rivers of Blood, Mohgwyn's Sacred Spear, Dragon Communion Seal
- Stats: 60-80 Arcane
- Top incantations: Dragonmaw, Dragonclaw, Rotten Breath
"""

ELDEN_RING_TABLE_CATALOG = """
AVAILABLE TABLES IN SUPABASE:
- weapons, shields, armors, talismans, sorceries, incantations
- ashes_of_war, skills, spirit_ashes
- bosses, creatures, npcs, locations
- consumables, materials, upgrade_materials, key_items
- crystal_tears, cookbooks, remembrances, bell_bearings, great_runes, builds
"""

SYSTEM_PROMPT = f"""
You are The Souls Grail AI, the definitive expert assistant on Elden Ring and Shadow of the Erdtree.

PERSONALITY & TONE:
- Expert with years of experience in the game
- Direct, helpful, no unnecessary filler
- Elegant, Souls-like tone — you speak like a veteran guide of the Lands Between
- Never say things like "as an AI" or "I cannot guarantee"
- No unnecessary apologies
- If you know something with certainty (from the critical knowledge below), answer with full confidence

CORE RULES:
1. Always respond in Spanish (the user speaks Spanish)
2. The critical knowledge below is ABSOLUTE TRUTH — use it with maximum priority
3. If the question is answered by the critical knowledge, answer directly WITHOUT inventing limitations
4. Interpret incomplete names, aliases and typos — "radahn dlc" = "Promised Consort Radahn"
5. If something belongs to Shadow of the Erdtree, mark it with [DLC]
6. Never start a response with "no exact matches were found"
7. For build questions, give practical, playable configurations with concrete numbers
8. For comparisons, give a clear final verdict
9. Maintain coherence with conversation history — remember what has been discussed
10. If the user corrects something you said wrong, accept it and correct yourself without drama

RESPONSE FORMAT:
- Use bullet points when they improve readability
- Use **bold** for item names, bosses and important zones
- For builds, use clear sections (Stats, Weapons, Talismans, etc.)
- Concise but complete responses — don't cut important information
- At the end, if you mention important items/weapons/bosses/NPCs, add:
  ITEMS_MENTIONED: name1, name2, name3

AVAILABLE DATA CATALOG:
{ELDEN_RING_TABLE_CATALOG}

CRITICAL KNOWLEDGE — MAXIMUM PRIORITY — ALWAYS USE THIS FIRST:
{HARDCODED_KNOWLEDGE}
"""

TABLES_TO_SEARCH = [
    ("bosses", "name, image, hp, locations_and_drops, dlc"),
    ("npcs", "name, image, location, role, questline, dlc"),
    ("locations", "name, region, description, items, enemies, dlc"),
    ("weapons", "name, image, description, requirements, passive_effect, weight, dlc"),
    ("armors", "name, image, type, damage_negation, resistance, special_effect, how_to_acquire, weight, dlc"),
    ("talismans", "name, image, effect, description, weight, value, dlc"),
    ("sorceries", "name, image, effect, location, fp, slot, int_req, fai_req, arc_req, stamina_cost, dlc"),
    ("incantations", "name, image, effect, location, fp, slot, int_req, fai_req, arc_req, stamina_cost, dlc"),
    ("ashes_of_war", "name, image, effect, affinity, skill, location, dlc"),
    ("skills", "name, image, effect, equipment, locations, dlc"),
    ("spirit_ashes", "name, image, effect, description, fp_cost, hp_cost, dlc"),
    ("shields", "name, image, description, requirements, passive_effect, weight, dlc"),
    ("creatures", "name, image, locations, drops, dlc"),
    ("consumables", "name, image, effect, description, dlc"),
    ("materials", "name, image, description, location, dlc"),
    ("upgrade_materials", "name, image, description, location, dlc"),
    ("key_items", "name, image, description, location, dlc"),
    ("crystal_tears", "name, image, effect, location, dlc"),
    ("cookbooks", "name, image, required_for, location, dlc"),
    ("remembrances", "name, image, description, option_1, option_2, boss, dlc"),
    ("bell_bearings", "name, image, location, unlocks, dlc"),
    ("great_runes", "name, image, effect, boss, tower, dlc"),
    ("builds", "name, description, weapon, armor, talismans, spells, skills, spirit_ashes, upvotes, is_dlc"),
]

GENERIC_STOPWORDS = {
    "que", "qué", "cual", "cuál", "dime", "dame", "toda", "todo", "info",
    "informacion", "información", "posible", "sobre", "del", "de", "la",
    "el", "los", "las", "un", "una", "unos", "unas", "con", "para", "por",
    "me", "quiero", "saber", "explica", "explicame", "explícame", "mejor",
    "mejores", "bueno", "buena", "buenos", "buenas", "donde", "dónde",
    "como", "cómo", "cuando", "cuándo", "quien", "quién", "sirve", "hace",
    "hay", "esta", "este", "ese", "esa", "esto", "eso", "juego", "elden",
    "ring", "shadow", "erdtree",
}

INTENT_KEYWORDS = {
    "dlc_access": ["como entrar", "como acceder", "acceder al dlc", "entrar al dlc", "requisitos dlc", "como ir al dlc"],
    "boss": ["boss", "jefe", "jefes", "final boss", "boss final", "enemigo principal"],
    "item": ["item", "objeto", "objetos", "material", "llave", "key item", "consumible"],
    "weapon": ["arma", "armas", "weapon", "sword", "katana", "greatsword", "colosal"],
    "armor": ["armadura", "armor", "set", "casco", "pechera"],
    "talisman": ["talisman", "talismán", "talismanes"],
    "spell": ["hechizo", "hechizos", "sorcery", "sorceries", "spell", "magia"],
    "incantation": ["encantamiento", "encantamientos", "incantation", "milagro"],
    "ash": ["ceniza", "cenizas", "ash", "ashes", "ashes of war", "spirit ash"],
    "npc": ["npc", "personaje", "quest", "mision", "misión", "questline"],
    "location": ["ubicacion", "ubicación", "zona", "region", "mapa", "donde esta", "dónde está"],
    "lore": ["lore", "historia", "teoria", "teoría", "quien es", "qué es"],
    "build": ["build", "builds", "stats", "atributos", "nivel", "configuracion"],
    "dlc": ["dlc", "shadow of the erdtree", "sote", "reino de las sombras"],
    "scadutree": ["scadutree", "fragmento", "fragmentos", "bendición", "bendicion"],
}


def normalize_text(text: str) -> str:
    text = text or ""
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[¿?¡!.,:;()\[\]{}\"'`´]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def clean_query(text: str) -> str:
    text = text or ""
    text = re.sub(r"[¿?¡!.,:;()\[\]{}\"'`´]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def safe_json(value):
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    return str(value) if value is not None else ""


def detect_intents(text: str) -> list[str]:
    normalized = normalize_text(text)
    intents = []
    for intent, words in INTENT_KEYWORDS.items():
        for word in words:
            if normalize_text(word) in normalized:
                intents.append(intent)
                break
    return list(dict.fromkeys(intents))


def expand_aliases(text: str) -> list[str]:
    normalized = normalize_text(text)
    aliases = []
    for alias_key, values in ELDEN_RING_ALIASES.items():
        if normalize_text(alias_key) in normalized:
            aliases.extend(values)
    return aliases


def extract_keywords(text: str) -> list[str]:
    original_clean = clean_query(text)
    normalized = normalize_text(text)
    terms = []

    terms.extend(expand_aliases(text))

    if original_clean:
        terms.append(original_clean)

    words = [w for w in normalized.split() if len(w) > 2 and w not in GENERIC_STOPWORDS]
    terms.extend(words)

    if len(words) >= 2:
        for i in range(len(words) - 1):
            terms.append(f"{words[i]} {words[i + 1]}")

    if len(words) >= 3:
        for i in range(len(words) - 2):
            terms.append(f"{words[i]} {words[i + 1]} {words[i + 2]}")

    intents = detect_intents(text)
    if "dlc" in intents or "dlc" in normalized or "miquella" in normalized:
        terms.extend(["Shadow of the Erdtree", "DLC", "Scadutree Fragment"])

    return list(dict.fromkeys([t for t in terms if t and len(t) > 2]))[:18]


def get_priority_tables(query: str) -> list[tuple[str, str]]:
    intents = detect_intents(query)
    normalized = normalize_text(query)
    priority_names = []

    if "dlc_access" in intents or "scadutree" in intents:
        priority_names += ["bosses", "key_items", "locations"]
    if "boss" in intents:
        priority_names += ["bosses", "remembrances", "locations", "npcs"]
    if "weapon" in intents:
        priority_names += ["weapons", "ashes_of_war", "skills", "talismans", "builds"]
    if "armor" in intents:
        priority_names += ["armors", "talismans", "builds"]
    if "talisman" in intents:
        priority_names += ["talismans", "builds"]
    if "spell" in intents:
        priority_names += ["sorceries", "builds"]
    if "incantation" in intents:
        priority_names += ["incantations", "builds"]
    if "ash" in intents:
        priority_names += ["ashes_of_war", "spirit_ashes", "skills", "builds"]
    if "npc" in intents:
        priority_names += ["npcs", "locations", "key_items"]
    if "location" in intents:
        priority_names += ["locations", "bosses", "npcs", "creatures"]
    if "build" in intents:
        priority_names += ["builds", "weapons", "talismans", "armors", "sorceries", "incantations", "ashes_of_war", "spirit_ashes"]

    if "radahn" in normalized or "miquella" in normalized or "consort" in normalized:
        priority_names = ["bosses", "remembrances", "npcs", "locations"] + priority_names

    if not priority_names:
        return TABLES_TO_SEARCH

    priority_names = list(dict.fromkeys(priority_names))
    priority = [t for t in TABLES_TO_SEARCH if t[0] in priority_names]
    rest = [t for t in TABLES_TO_SEARCH if t[0] not in priority_names]
    return priority + rest


def score_result(item: dict, query: str) -> int:
    score = 0
    normalized_query = normalize_text(query)
    name = normalize_text(item.get("name", ""))
    table = item.get("_table", "")

    if not name:
        return score

    if name == normalized_query:
        score += 100
    if name in normalized_query or normalized_query in name:
        score += 70

    for term in extract_keywords(query):
        nt = normalize_text(term)
        if nt and nt == name:
            score += 80
        elif nt and nt in name:
            score += 45
        elif nt and nt in normalize_text(safe_json(item)):
            score += 12

    if item.get("dlc") or item.get("is_dlc"):
        if "dlc" in normalized_query or "miquella" in normalized_query or "shadow" in normalized_query:
            score += 20

    if "radahn" in normalized_query and "radahn" in name:
        score += 60
    if "consort" in normalized_query and ("consort" in name or "promised" in name):
        score += 60

    return score


def fetch_table(table: str, columns: str, limit: int = 60) -> list[dict]:
    sb = get_supabase()
    return sb.table(table).select(columns).limit(limit).execute().data or []


def search_all_tables(query: str) -> list[dict]:
    sb = get_supabase()
    results = []
    seen = set()
    keywords = extract_keywords(query)
    tables = get_priority_tables(query)

    print(f"[KEYWORDS] {keywords}")
    print(f"[INTENTS] {detect_intents(query)}")

    for table, columns in tables:
        for keyword in keywords:
            try:
                data = (
                    sb.table(table)
                    .select(columns)
                    .ilike("name", f"%{keyword}%")
                    .limit(10)
                    .execute()
                    .data or []
                )
                for item in data:
                    item_name = item.get("name", "")
                    key = f"{table}:{item_name}".lower()
                    if key in seen:
                        continue
                    seen.add(key)
                    item["_table"] = table
                    item["_matched_keyword"] = keyword
                    item["_score"] = score_result(item, query)
                    results.append(item)
                    print(f"[DB] Encontrado: {item_name} ({table})")
            except Exception as e:
                print(f"[DB] Error en {table} con keyword '{keyword}': {e}")

    results.sort(key=lambda x: x.get("_score", 0), reverse=True)
    return results[:45]


def build_db_context(db_results: list[dict]) -> str:
    if not db_results:
        return ""

    lines = ["INFORMACIÓN DE BASE DE DATOS:"]
    for item in db_results[:14]:
        table = item.get("_table", "unknown")
        name = item.get("name", "Sin nombre")
        score = item.get("_score", 0)
        lines.append(f"\n• {name} ({table}) [score: {score}]")

        dlc = item.get("dlc", item.get("is_dlc"))
        if dlc:
            lines.append("  - DLC: Sí")

        important_fields = [
            "hp", "description", "effect", "location", "locations", "region",
            "role", "questline", "requirements", "passive_effect", "weight",
            "type", "special_effect", "how_to_acquire", "damage_negation",
            "resistance", "items", "enemies", "drops", "locations_and_drops",
            "option_1", "option_2", "boss", "fp", "slot", "int_req", "fai_req",
            "arc_req", "stamina_cost", "fp_cost", "hp_cost", "weapon", "armor",
            "talismans", "spells", "skills", "spirit_ashes", "upvotes",
            "required_for", "unlocks", "tower",
        ]

        for field in important_fields:
            value = item.get(field)
            if value is None or value == "" or value == [] or value == {}:
                continue
            text = safe_json(value)
            if len(text) > 900:
                text = text[:900] + "..."
            lines.append(f"  - {field}: {text}")

    return "\n".join(lines)


async def search_item_direct(item_name: str) -> str:
    item_name = item_name.replace(",", "").strip()
    variations = [
        item_name.replace(" ", "+"),
        item_name.replace(" ", "_"),
        item_name.replace(" ", "-"),
        item_name,
    ]
    async with httpx.AsyncClient(headers=SCRAPE_HEADERS, timeout=15.0, follow_redirects=True) as c:
        for slug in variations:
            if not slug:
                continue
            url = f"https://eldenring.wiki.fextralife.com/{slug}"
            try:
                res = await c.get(url)
                if res.status_code == 200:
                    soup = BeautifulSoup(res.text, "html.parser")
                    for tag in soup(["script", "style", "nav", "footer", "aside", "header", "noscript"]):
                        tag.decompose()
                    text = soup.get_text(separator="\n", strip=True)
                    text = re.sub(r"\n{3,}", "\n\n", text)
                    if len(text) > 350:
                        print(f"[SEARCH] ✓ Directo: {url}")
                        return text[:8000]
            except Exception:
                continue
    return ""


async def search_fextralife(query: str) -> str:
    search_url = f"https://eldenring.wiki.fextralife.com/search?q={query.replace(' ', '+')}"
    print(f"[SEARCH] Fextralife: {query}")
    try:
        async with httpx.AsyncClient(headers=SCRAPE_HEADERS, timeout=20.0, follow_redirects=True) as c:
            res = await c.get(search_url)
            if res.status_code != 200:
                return ""
            soup = BeautifulSoup(res.text, "html.parser")
            all_links = soup.find_all("a", href=True)
            for link in all_links[:30]:
                href = link.get("href", "")
                if not href or "/search" in href or href.endswith("wiki.fextralife.com/"):
                    continue
                if href.startswith("/"):
                    full_url = f"https://eldenring.wiki.fextralife.com{href}"
                elif "fextralife.com" in href:
                    full_url = href
                else:
                    continue
                try:
                    page_res = await c.get(full_url, timeout=15.0)
                    if page_res.status_code == 200:
                        page_soup = BeautifulSoup(page_res.text, "html.parser")
                        for tag in page_soup(["script", "style", "nav", "footer", "aside", "header", "noscript"]):
                            tag.decompose()
                        text = page_soup.get_text(separator="\n", strip=True)
                        text = re.sub(r"\n{3,}", "\n\n", text)
                        if len(text) > 450:
                            print(f"[SEARCH] ✓ Encontrado: {full_url}")
                            return text[:8000]
                except Exception:
                    continue
    except Exception as e:
        print(f"[SEARCH] Error: {e}")
    return ""


async def build_internet_context(user_query: str, db_results: list[dict]) -> str:
    # Si la pregunta tiene respuesta en el conocimiento hardcodeado, skip scraping
    normalized = normalize_text(user_query)
    hardcoded_triggers = [
        "como entrar", "acceder al dlc", "entrar al dlc", "requisitos dlc",
        "scadutree", "fragmento", "build", "stats", "mejor build",
    ]
    if any(trigger in normalized for trigger in hardcoded_triggers):
        print("[SEARCH] Skipping — respuesta en conocimiento hardcodeado")
        return ""

    search_terms = extract_keywords(user_query)
    if db_results:
        top_names = [item.get("name") for item in db_results[:5] if item.get("name")]
        search_terms = list(dict.fromkeys(top_names + search_terms))

    for term in search_terms[:10]:
        internet_context = await search_item_direct(term)
        if len(internet_context) >= 500:
            return internet_context
        internet_context = await search_fextralife(term)
        if len(internet_context) >= 500:
            return internet_context

    return ""


def extract_mentioned_items(response_text: str, items_with_images: list[dict]) -> tuple[str, list[dict]]:
    mentioned_items = []
    if "ITEMs_MENTIONED:" not in response_text:
        return response_text.strip(), mentioned_items

    parts = response_text.split("ITEMS_MENTIONED:")
    clean_response = parts[0].strip()
    mentioned_names = []
    if len(parts) > 1:
        mentioned_names = [n.strip() for n in parts[1].split(",") if n.strip()]

    for name in mentioned_names:
        normalized_name = normalize_text(name)
        match = next(
            (item for item in items_with_images
             if normalize_text(item["name"]) in normalized_name
             or normalized_name in normalize_text(item["name"])),
            None,
        )
        if match and match not in mentioned_items:
            mentioned_items.append(match)

    return clean_response, mentioned_items


def build_user_prompt(
    user_query: str,
    db_context: str,
    internet_context: str,
    intents: list[str],
    conversation_history: list[dict],
) -> str:
    history_text = ""
    if conversation_history:
        history_lines = []
        for msg in conversation_history[-6:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_lines.append(f"{role}: {msg['content'][:400]}")
        history_text = "\n".join(history_lines)

    return f"""
CONVERSATION HISTORY (for context):
{history_text if history_text else "First query of the session."}

CURRENT QUERY:
{user_query}

DETECTED INTENT: {", ".join(intents) if intents else "general"}

DATABASE DATA:
{db_context if db_context else "No matches in DB. Use the critical knowledge from the system prompt."}

EXTERNAL DATA (Fextralife):
{internet_context[:6000] if internet_context else "No external search performed — use hardcoded knowledge."}

INSTRUCTIONS:
- Answer the current query taking the conversation history into account
- If the user is correcting something from a previous response, accept it and fix it
- Use the critical knowledge from the system prompt with maximum priority
- Do not repeat information already given in the history unless necessary
- Respond in Spanish, directly and helpfully
- Close with ITEMS_MENTIONED: if you mention important entities
"""


@router.post("/ask")
async def ask_agent(query: AgentQuery):
    print(f"\n[QUERY] {query.message}")

    intents = detect_intents(query.message)
    db_results = search_all_tables(query.message)
    db_context = build_db_context(db_results)

    items_with_images = [
        {
            "name": item.get("name"),
            "image": item.get("image"),
            "type": item.get("_table", "item"),
            "dlc": item.get("dlc", item.get("is_dlc", False)),
        }
        for item in db_results
        if item.get("name") and item.get("image")
    ]

    internet_context = await build_internet_context(query.message, db_results)

    # Historial de conversación desde el frontend
    conversation_history = getattr(query, "history", []) or []

    prompt = build_user_prompt(
        user_query=query.message,
        db_context=db_context,
        internet_context=internet_context,
        intents=intents,
        conversation_history=conversation_history,
    )

    # Construir mensajes con historial real para el LLM
    llm_messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Añadir historial previo al contexto del LLM (últimos 8 mensajes)
    for msg in conversation_history[-8:]:
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            llm_messages.append({
                "role": msg["role"],
                "content": msg["content"][:600],
            })

    llm_messages.append({"role": "user", "content": prompt})

    completion = client.chat.completions.create(
    messages=llm_messages,
    model="mixtral-8x7b-32768",  # ← aquí
    temperature=0.05,
    max_tokens=2400,
)

    response_text = completion.choices[0].message.content or ""
    response_text, mentioned_items = extract_mentioned_items(response_text, items_with_images)

    return {
        "response": response_text,
        "context_used": bool(db_context),
        "internet_used": bool(internet_context),
        "mentioned_items": mentioned_items,
        "db_results": len(db_results),
        "intents": intents,
    }