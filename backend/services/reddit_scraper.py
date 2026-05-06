import httpx
import re
import asyncio
from datetime import datetime
from services.supabase_client import get_supabase
from routers.builds import normalize, find_match, fetch_all

SUBREDDITS = [
    "EldenRingBuilds",
    "EldenRing",
    "onebros",
]

PLAYSTYLE_KEYWORDS = {
    "sangrado": ["bleed", "blood", "hemorrhage", "rivers of blood", "mohgwyn"],
    "fuerza":   ["strength", "colossal", "giant", "bonk", "hammer", "greatsword"],
    "destreza": ["dex", "dexterity", "katana", "keen", "swift", "blade"],
    "magia":    ["intelligence", "sorcery", "glintstone", "magic", "int build"],
    "fe":       ["faith", "incantation", "sacred", "holy", "flame"],
    "arcano":   ["arcane", "dragon", "rot", "poison", "dragon communion"],
    "mixto":    ["quality", "hybrid", "balanced", "str/dex"],
}

ITEM_PATTERNS = [
    r'\*\*(.+?)\*\*',
    r'(?:^|\n)\s*[-•]\s*(.+?)(?:\n|$)',
    r'(?:weapon|main hand|offhand|armor|helm|chest|gauntlet|greave|talisman|spell|incantation|ash of war|spirit|rune):\s*(.+?)(?:\n|,|\.|\|)',
    r'(?:using|recommend|tried|switched to|running)\s+(?:the\s+)?([A-Z][a-zA-Z\s\']+?)(?:\s+and|\s+with|\s+for|[,\.\n])',
]

DISCARD_TITLES = [
    "cake", "fan art", "screenshot", "meme",
    "my boyfriend", "my girlfriend", "cosplay",
]

def detect_playstyle(text: str) -> str:
    text_lower = text.lower()
    scores = {ps: 0 for ps in PLAYSTYLE_KEYWORDS}
    for ps, keywords in PLAYSTYLE_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                scores[ps] += 1
    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else "mixto"

def detect_dlc(text: str) -> bool:
    dlc_keywords = ["shadow of the erdtree", "dlc", "sote", "messmer", "promised consort"]
    return any(kw in text.lower() for kw in dlc_keywords)

def is_real_build_post(title: str, text: str) -> bool:
    if len(text) < 50:
        return False
    title_lower = title.lower()
    if any(kw in title_lower for kw in DISCARD_TITLES):
        return False
    build_indicators = [
        "vigor", "mind", "endurance", "strength", "dexterity", "intelligence", "faith", "arcane",
        "rl1", "rl ", "level ", "lvl ", "+25", "+10", "+9", "+8",
        "talisman", "ash of war", "incantation", "sorcery",
        "stats", "gear", "build guide",
        "str:", "dex:", "int:", "fai:", "arc:", "vig:",
        "bleed", "blood", "katana", "greatsword", "colossal",
        "weapon", "armor", "shield",
    ]
    combined = text.lower() + title_lower
    matches = sum(1 for ind in build_indicators if ind in combined)
    return matches >= 1

def extract_candidates(text: str) -> list[str]:
    candidates = []
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if len(line) > 60 or len(line) < 3:
            continue
        if any(c in line for c in ['?', 'http', 'www', '(', ')']):
            continue
        if any(w in line.lower() for w in [' is ', ' are ', ' was ', ' the ', ' and ', ' for ', ' with ', ' this ', ' that ']):
            continue
        candidates.append(line)
    for pattern in ITEM_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
        for m in matches:
            m = m.strip()
            if 3 < len(m) < 50:
                candidates.append(m)
    return list(set(candidates))

def resolve_items(candidates: list[str], pool: list[dict]) -> list[dict]:
    results = []
    seen = set()
    for candidate in candidates:
        match = find_match(candidate, pool)
        if match and match.get("image") and match["name"] not in seen:
            seen.add(match["name"])
            results.append(match)
    return results

async def scrape_subreddit(subreddit: str, client: httpx.AsyncClient, limit: int = 50) -> list[dict]:
    posts = []
    url = f"https://old.reddit.com/r/{subreddit}/top/.json?limit={limit}&t=month"
    headers = {"User-Agent": "TheSoulsGrail/1.0 (Elden Ring Build Scraper)"}

    try:
        print(f"[SCRAPER] Raspando r/{subreddit}...")
        res = await client.get(url, headers=headers, timeout=15.0)
        if res.status_code != 200:
            print(f"[SCRAPER] Error {res.status_code} en r/{subreddit}")
            return []

        data = res.json()
        children = data.get("data", {}).get("children", [])

        for child in children:
            post = child.get("data", {})
            title = post.get("title", "")
            selftext = post.get("selftext", "")
            flair = post.get("link_flair_text", "") or ""
            full_text = f"{title}\n{selftext}"

            is_build = (
                "build" in title.lower() or
                "build" in flair.lower() or
                any(kw in title.lower() for kws in PLAYSTYLE_KEYWORDS.values() for kw in kws)
            )
            if not is_build or not selftext:
                continue
            if not is_real_build_post(title, selftext):
                print(f"[SCRAPER] Descartado: '{title[:50]}'")
                continue

            posts.append({
                "title":      title,
                "author":     post.get("author", "unknown"),
                "reddit_url": f"https://reddit.com{post.get('permalink', '')}",
                "upvotes":    post.get("ups", 0),
                "raw_text":   full_text[:5000],
                "playstyle":  detect_playstyle(full_text),
                "is_dlc":     detect_dlc(full_text),
            })

        print(f"[SCRAPER] r/{subreddit}: {len(posts)} builds encontradas")
        return posts

    except Exception as e:
        print(f"[SCRAPER ERROR] r/{subreddit}: {e}")
        return []

async def process_and_save(posts: list[dict], pools: dict) -> int:
    sb = get_supabase()
    saved = 0

    for post in posts:
        try:
            existing = sb.table("builds").select("id").eq("reddit_url", post["reddit_url"]).execute().data
            if existing:
                continue

            candidates = extract_candidates(post["raw_text"])

            build_data = {
                "title":        post["title"],
                "playstyle":    post["playstyle"],
                "author":       post["author"],
                "reddit_url":   post["reddit_url"],
                "upvotes":      post["upvotes"],
                "raw_text":     post["raw_text"],
                "is_dlc":       post["is_dlc"],
                "scraped_at":   datetime.utcnow().isoformat(),
                "weapon":       resolve_items(candidates, pools["weapons"]),
                "armor":        resolve_items(candidates, pools["armors"]),
                "talismans":    resolve_items(candidates, pools["talismans"]),
                "spells":       resolve_items(candidates, pools["spells"]),
                "skills":       resolve_items(candidates, pools["skills"]),
                "spirit_ashes": resolve_items(candidates, pools["spirits"]),
                "great_rune":   None,
            }

            sb.table("builds").insert(build_data).execute()
            saved += 1
            print(f"[SCRAPER] Guardada: '{post['title'][:50]}'")

        except Exception as e:
            print(f"[SCRAPER] Error guardando post: {e}")

    return saved

async def run_scraper():
    print(f"\n[SCRAPER] ========= Iniciando scraping {datetime.utcnow()} =========")
    try:
        print("[SCRAPER] Cargando pools de Supabase...")
        pools = {
            "weapons":   fetch_all("weapons",      "name, image") + fetch_all("shields", "name, image"),
            "armors":    fetch_all("armors",        "name, image, type"),
            "talismans": fetch_all("talismans",     "name, image"),
            "skills":    fetch_all("skills",        "name, image"),
            "spirits":   fetch_all("spirit_ashes",  "name, image"),
            "spells":    fetch_all("sorceries",     "name, image") + fetch_all("incantations", "name, image"),
        }

        async with httpx.AsyncClient() as client:
            all_posts = []
            for subreddit in SUBREDDITS:
                posts = await scrape_subreddit(subreddit, client)
                all_posts.extend(posts)
                await asyncio.sleep(2)

        saved = await process_and_save(all_posts, pools)
        print(f"[SCRAPER] ========= Finalizado: {saved} builds nuevas guardadas =========\n")
        return saved

    except Exception as e:
        print(f"[SCRAPER ERROR GENERAL] {e}")
        import traceback
        traceback.print_exc()
        return 0