import re
import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter
from datetime import datetime, timedelta

router = APIRouter(prefix="/patches", tags=["patches"])

FEXTRALIFE_PATCH_URL = "https://eldenring.wiki.fextralife.com/Patch+Notes"

SCRAPE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

CACHE = {
    "data": None,
    "expires_at": None,
}


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def classify_change(text: str) -> str:
    t = text.lower()

    if any(w in t for w in ["increased", "improved", "extended", "raised", "enhanced", "buff"]):
        return "buff"

    if any(w in t for w in ["decreased", "reduced", "lowered", "shortened", "nerf"]):
        return "nerf"

    if any(w in t for w in ["fixed", "bug", "issue", "resolved", "correction"]):
        return "fix"

    return "adjustment"


def build_summary(changes: list[dict]) -> dict:
    return {
        "buffs": sum(1 for c in changes if c["type"] == "buff"),
        "nerfs": sum(1 for c in changes if c["type"] == "nerf"),
        "fixes": sum(1 for c in changes if c["type"] == "fix"),
        "adjustments": sum(1 for c in changes if c["type"] == "adjustment"),
    }


def extract_version(text: str) -> str:
    match = re.search(r"(?:Patch\s*)?(?:Version|Ver\.?)\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)", text, re.I)
    if match:
        return match.group(1)

    match = re.search(r"\b([0-9]+\.[0-9]+(?:\.[0-9]+)?)\b", text)
    return match.group(1) if match else "Latest"


def infer_item(text: str) -> str:
    patterns = [
        r"for the following weapon types:?\s*(.+)",
        r"for\s+(.+?)\s+has",
        r"of\s+(.+?)\s+has",
        r"the\s+(.+?)\s+skill",
        r"weapon\s+(.+?)\s+",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.I)
        if match:
            item = clean_text(match.group(1))
            if 2 <= len(item) <= 90:
                return item

    return "General"


async def fetch_html(url: str) -> str:
    async with httpx.AsyncClient(headers=SCRAPE_HEADERS, timeout=25.0, follow_redirects=True) as client:
        res = await client.get(url)
        res.raise_for_status()
        return res.text


async def fetch_fextralife_patches() -> list[dict]:
    html = await fetch_html(FEXTRALIFE_PATCH_URL)
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
        tag.decompose()

    images = []
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src")
        alt = clean_text(img.get("alt", ""))

        if not src:
            continue

        if src.startswith("//"):
            src = "https:" + src
        elif src.startswith("/"):
            src = "https://eldenring.wiki.fextralife.com" + src

        if "eldenring" in src.lower() or "wiki" in src.lower():
            images.append({"src": src, "alt": alt})

    text = soup.get_text("\n", strip=True)
    raw_lines = [clean_text(line) for line in text.split("\n")]
    lines = [line for line in raw_lines if len(line) > 8]

    sections = []
    current = None
    latest_changes = []  # Acumula cambios antes de la primera versión
    description_latest = ""

    for line in lines:
        lower = line.lower()

        is_version_title = (
            "patch notes" in lower
            and any(char.isdigit() for char in line)
        ) or re.search(r"\bversion\s+[0-9]+\.[0-9]+", lower)

        if is_version_title:
            if current and current["changes"]:
                sections.append(current)

            version = extract_version(line)
            current = {
                "version": version,
                "date": "Live",
                "source": "fextralife",
                "title": line,
                "url": FEXTRALIFE_PATCH_URL,
                "description": "",
                "changes": [],
                "images": images[:8],
            }
            continue

        # Antes del primer heading de versión, acumula para "Latest"
        if not current:
            relevant = any(w in lower for w in [
                "damage", "fixed", "increased", "decreased", "adjusted", "reduced",
                "improved", "changed", "scaling", "fp", "stamina", "poise", "bug",
                "weapon", "skill", "spell", "incantation", "ash of war", "pvp", "balance",
            ])

            if relevant and len(line) > 20:
                latest_changes.append({
                    "type": classify_change(line),
                    "item": infer_item(line),
                    "detail": line,
                })
            elif not description_latest and len(line) > 35:
                description_latest = line[:520]
            continue

        # Después del primer heading, acumula en versiones
        relevant = any(w in lower for w in [
            "damage", "fixed", "increased", "decreased", "adjusted", "reduced",
            "improved", "changed", "scaling", "fp", "stamina", "poise", "bug",
            "weapon", "skill", "spell", "incantation", "ash of war", "pvp", "balance",
        ])

        if relevant and len(line) > 20:
            current["changes"].append({
                "type": classify_change(line),
                "item": infer_item(line),
                "detail": line,
            })

        elif not current["description"] and len(line) > 35:
            current["description"] = line[:520]

    if current and current["changes"]:
        sections.append(current)

    # Agregar sección "Latest" al inicio si tiene cambios
    if latest_changes:
        latest_section = {
            "version": "Latest",
            "date": "Live",
            "source": "fextralife",
            "title": "Elden Ring Patch Notes - Latest Changes",
            "url": FEXTRALIFE_PATCH_URL,
            "description": description_latest or "Últimos cambios recopilados desde Fextralife.",
            "changes": latest_changes[:120],
            "images": images[:8],
        }
        latest_section["summary"] = build_summary(latest_section["changes"])
        sections.insert(0, latest_section)

    patches = []

    for section in sections[:12]:
        section["changes"] = section["changes"][:120]
        section["summary"] = build_summary(section["changes"])
        patches.append(section)

    return patches


@router.get("")
@router.get("/")
async def get_patches():
    now = datetime.utcnow()

    if CACHE["data"] and CACHE["expires_at"] and CACHE["expires_at"] > now:
        return {
            "source": "cache",
            "updated_at": now.isoformat(),
            "patches": CACHE["data"],
        }

    try:
        patches = await fetch_fextralife_patches()
    except Exception as e:
        print(f"[PATCHES] Fextralife error: {e}")
        patches = []

    CACHE["data"] = patches
    CACHE["expires_at"] = now + timedelta(hours=24)

    return {
        "source": "fextralife",
        "updated_at": now.isoformat(),
        "patches": patches,
    }