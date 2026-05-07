import re
import asyncio
import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta

router = APIRouter(prefix="/patches", tags=["patches"])

SCRAPE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 Chrome/120.0 Safari/537.36"
    )
}

CACHE = {
    "data": None,
    "expires_at": None,
}

FEXTRALIFE_PATCH_URL = "https://eldenring.wiki.fextralife.com/Patch+Notes"


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def classify_change(text: str) -> str:
    t = text.lower()

    buff_keywords = [
        "increased", "improved", "extended", "raised", "enhanced", "boosted",
        "buff", "more damage", "stronger", "faster", "wider", "longer range",
    ]
    nerf_keywords = [
        "decreased", "reduced", "lowered", "shortened", "nerf", "less damage",
        "weaker", "slower", "narrower",
    ]
    fix_keywords = [
        "fixed", "bug", "issue", "resolved", "correction", "addressed",
    ]

    if any(w in t for w in buff_keywords):
        return "buff"
    if any(w in t for w in nerf_keywords):
        return "nerf"
    if any(w in t for w in fix_keywords):
        return "fix"

    return "adjustment"


def extract_version(text: str) -> str:
    match = re.search(r"([0-9]+\.[0-9]+(?:\.[0-9]+)?(?:\.[0-9]+)?)", text, re.I)
    return match.group(1) if match else "Unknown"


def infer_item(text: str) -> str:
    text = clean_text(text)
    patterns = [
        r"(?:for|of|the)\s+([^,]+?)\s+(?:has|skill|attack|damage|effect)",
        r"\"([^\"]+?)\"",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.I)
        if match:
            item = clean_text(match.group(1))
            if 2 <= len(item) <= 60:
                return item
    return "General"


def build_summary(changes: list[dict]) -> dict:
    return {
        "buffs": sum(1 for c in changes if c["type"] == "buff"),
        "nerfs": sum(1 for c in changes if c["type"] == "nerf"),
        "fixes": sum(1 for c in changes if c["type"] == "fix"),
        "adjustments": sum(1 for c in changes if c["type"] == "adjustment"),
    }


async def fetch_html(url: str) -> str:
    async with httpx.AsyncClient(
        headers=SCRAPE_HEADERS,
        timeout=30.0,
        follow_redirects=True,
    ) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.text


async def fetch_patch_links() -> list[dict]:
    """Extrae todos los links de versiones de la página principal"""
    html = await fetch_html(FEXTRALIFE_PATCH_URL)
    soup = BeautifulSoup(html, "html.parser")

    links = []
    
    for a in soup.find_all("a", href=True):
        href = a["href"]
        title = clean_text(a.get_text(" ", strip=True))

        # No procesa anclas
        if href.startswith("#"):
            continue

        # Debe tener "patch" en la URL
        if "patch" not in href.lower():
            continue

        # Construye URL completa
        if href.startswith("/"):
            href = "https://eldenring.wiki.fextralife.com" + href

        # Evita la página principal
        if href == FEXTRALIFE_PATCH_URL:
            continue

        links.append({"title": title, "url": href})

    # Deduplicación
    unique = []
    seen = set()
    for link in links:
        if link["url"] not in seen:
            seen.add(link["url"])
            unique.append(link)

    print(f"[PATCHES] Found {len(unique)} patch links")
    return unique


async def parse_patch_page(url: str, fallback_title: str) -> dict | None:
    """Parsea una página de patch individual"""
    try:
        html = await fetch_html(url)
    except Exception as e:
        print(f"[PATCHES] Failed to fetch {url}: {e}")
        return None

    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
        tag.decompose()

    title_element = soup.find(["h1", "h2"])
    title = (
        clean_text(title_element.get_text(" ", strip=True))
        if title_element
        else fallback_title
    )

    text = soup.get_text("\n", strip=True)
    version = extract_version(title + " " + text)

    lines = [
        clean_text(line)
        for line in text.split("\n")
        if len(clean_text(line)) > 4
    ]

    changes = []

    # Busca en listas
    for li in soup.find_all("li"):
        detail = clean_text(li.get_text(" ", strip=True))

        if len(detail) < 15 or len(detail) > 800:
            continue

        if not any(keyword in detail.lower() for keyword in [
            "damage", "fixed", "reduced", "increased", "adjusted", "improved",
            "issue", "bug", "attack", "skill", "weapon", "sorcery", "incantation",
            "ash", "fp", "stamina", "effect", "range", "speed", "poise",
        ]):
            continue

        changes.append({
            "type": classify_change(detail),
            "item": infer_item(detail),
            "detail": detail,
            "images": [],
        })

    # Busca en párrafos también
    for p in soup.find_all("p"):
        text_p = clean_text(p.get_text(" ", strip=True))

        if len(text_p) < 20 or len(text_p) > 800:
            continue

        sentences = re.split(r'[.!?]+', text_p)

        for sentence in sentences:
            sentence = clean_text(sentence)

            if len(sentence) < 15 or len(sentence) > 800:
                continue

            if not any(keyword in sentence.lower() for keyword in [
                "damage", "fixed", "reduced", "increased", "adjusted", "improved",
                "issue", "bug", "attack", "skill", "weapon", "spell",
                "ash", "fp", "stamina", "effect", "range", "speed",
            ]):
                continue

            if any(sentence == c["detail"] for c in changes):
                continue

            changes.append({
                "type": classify_change(sentence),
                "item": infer_item(sentence),
                "detail": sentence,
                "images": [],
            })

    # Deduplicación
    seen = set()
    unique_changes = []

    for change in changes:
        key = (change["type"], change["item"], change["detail"])
        if key not in seen:
            seen.add(key)
            unique_changes.append(change)

    description = " ".join(lines[:5])[:500]

    return {
        "version": version,
        "date": "Live",
        "source": "fextralife",
        "title": title,
        "url": url,
        "description": description,
        "changes": unique_changes[:100],
        "images": [],
        "summary": build_summary(unique_changes),
    }


async def fetch_live_patches() -> list[dict]:
    """Obtiene todos los parches con concurrencia"""
    links = await fetch_patch_links()

    if not links:
        print("[PATCHES] No patch links found")
        return []

    # Procesa máximo 5 en paralelo
    semaphore = asyncio.Semaphore(5)

    async def parse_with_semaphore(link: dict) -> dict | None:
        async with semaphore:
            try:
                print(f"[PATCHES] Parsing {link['url']}")
                patch = await parse_patch_page(link["url"], link["title"])

                if patch and patch["changes"]:
                    print(f"[PATCHES] ✓ {patch['version']} - {len(patch['changes'])} changes")
                    return patch
                else:
                    print(f"[PATCHES] ⚠ No changes in {link['title']}")
                    return None

            except Exception as e:
                print(f"[PATCHES] Error parsing {link['url']}: {e}")
                return None

    tasks = [parse_with_semaphore(link) for link in links]
    results = await asyncio.gather(*tasks)

    patches = [p for p in results if p is not None]

    print(f"[PATCHES] Successfully processed {len(patches)} patches")
    return patches


@router.get("")
@router.get("/")
async def get_patches():
    now = datetime.utcnow()

    if (
        CACHE["data"]
        and CACHE["expires_at"]
        and CACHE["expires_at"] > now
    ):
        print(f"[PATCHES] Returning cached data (expires at {CACHE['expires_at']})")
        return {
            "source": "cache",
            "updated_at": now.isoformat(),
            "patches": CACHE["data"],
        }

    try:
        print("[PATCHES] Fetching live patches...")
        patches = await fetch_live_patches()

        CACHE["data"] = patches
        CACHE["expires_at"] = now + timedelta(hours=24)

        return {
            "source": "live",
            "updated_at": now.isoformat(),
            "patches": patches,
        }

    except Exception as e:
        print(f"[PATCHES] Error: {e}")

        raise HTTPException(
            status_code=500,
            detail="No se pudieron cargar los patch notes.",
        )


@router.post("/clear-cache")
async def clear_cache():
    """Limpia el cache manualmente"""
    CACHE["data"] = None
    CACHE["expires_at"] = None
    print("[PATCHES] Cache cleared")
    return {"status": "cache cleared"}