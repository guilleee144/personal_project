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

ELDEN_RING_ALIASES = {
    "radahn consort of miquella": [
        "Promised Consort Radahn",
        "Radahn Consort of Miquella",
        "Radahn, Consort of Miquella",
        "Consort Radahn",
        "Radahn DLC",
        "Miquella Radahn",
    ],
    "consort of miquella": [
        "Promised Consort Radahn",
        "Radahn, Consort of Miquella",
        "Consort Radahn",
    ],
    "radahn dlc": [
        "Promised Consort Radahn",
        "Radahn, Consort of Miquella",
        "Consort Radahn",
    ],
    "boss final dlc": [
        "Promised Consort Radahn",
        "Radahn, Consort of Miquella",
        "Miquella",
    ],
    "final boss dlc": [
        "Promised Consort Radahn",
        "Radahn, Consort of Miquella",
        "Miquella",
    ],
    "miquella boss": [
        "Promised Consort Radahn",
        "Radahn, Consort of Miquella",
        "Miquella",
    ],
    "messmer": [
        "Messmer the Impaler",
        "Messmer",
    ],
    "rellana": [
        "Rellana Twin Moon Knight",
        "Rellana",
    ],
    "bayle": [
        "Bayle the Dread",
        "Bayle",
    ],
    "midra": [
        "Midra Lord of Frenzied Flame",
        "Midra",
    ],
    "romina": [
        "Romina Saint of the Bud",
        "Romina",
    ],
    "putrescent knight": [
        "Putrescent Knight",
    ],
    "gaius": [
        "Commander Gaius",
    ],
    "metyr": [
        "Metyr Mother of Fingers",
    ],
    "scadutree avatar": [
        "Scadutree Avatar",
    ],
    "divine beast": [
        "Divine Beast Dancing Lion",
    ],
    "dancing lion": [
        "Divine Beast Dancing Lion",
    ],
    "malenia": [
        "Malenia Blade of Miquella",
        "Malenia",
    ],
    "mohg": [
        "Mohg Lord of Blood",
        "Mohg",
    ],
    "morgott": [
        "Morgott the Omen King",
        "Morgott",
    ],
    "godrick": [
        "Godrick the Grafted",
        "Godrick",
    ],
    "rennala": [
        "Rennala Queen of the Full Moon",
        "Rennala",
    ],
    "rykard": [
        "Rykard Lord of Blasphemy",
        "Rykard",
    ],
    "maliketh": [
        "Maliketh the Black Blade",
        "Maliketh",
    ],
    "radagon": [
        "Radagon of the Golden Order",
        "Elden Beast",
        "Radagon",
    ],
    "elden beast": [
        "Elden Beast",
        "Radagon of the Golden Order",
    ],
    "godfrey": [
        "Godfrey First Elden Lord",
        "Hoarah Loux",
        "Godfrey",
    ],
    "hoarah loux": [
        "Hoarah Loux",
        "Godfrey First Elden Lord",
    ],
    "placidusax": [
        "Dragonlord Placidusax",
        "Placidusax",
    ],
    "fortissax": [
        "Lichdragon Fortissax",
        "Fortissax",
    ],
    "ranni": [
        "Ranni the Witch",
        "Ranni",
    ],
    "blaidd": [
        "Blaidd",
    ],
    "millicent": [
        "Millicent",
    ],
    "alexander": [
        "Iron Fist Alexander",
        "Alexander",
    ],
    "varre": [
        "White Mask Varre",
        "Varre",
    ],
    "yura": [
        "Bloody Finger Hunter Yura",
        "Yura",
    ],
    "ansbach": [
        "Sir Ansbach",
        "Ansbach",
    ],
    "thiollier": [
        "Thiollier",
    ],
    "hornsent": [
        "Hornsent",
    ],
    "freyja": [
        "Redmane Freyja",
        "Freyja",
    ],
    "dryleaf dane": [
        "Dryleaf Dane",
    ],
    "leda": [
        "Needle Knight Leda",
        "Leda",
    ],
    "rivers of blood": [
        "Rivers of Blood",
    ],
    "moonveil": [
        "Moonveil",
    ],
    "blasphemous blade": [
        "Blasphemous Blade",
    ],
    "dark moon greatsword": [
        "Dark Moon Greatsword",
    ],
    "bloodhound fang": [
        "Bloodhound's Fang",
        "Bloodhound Fang",
    ],
    "mimic tear": [
        "Mimic Tear Ashes",
        "Mimic Tear",
    ],
    "black knife tiche": [
        "Black Knife Tiche",
    ],
    "sangrado": [
        "bleed",
        "blood loss",
        "Rivers of Blood",
        "Eleonora's Poleblade",
        "Mohgwyn's Sacred Spear",
        "Bloodfiend's Arm",
    ],
    "bleed": [
        "Rivers of Blood",
        "Eleonora's Poleblade",
        "Mohgwyn's Sacred Spear",
        "Bloodfiend's Arm",
    ],
    "fe": [
        "faith",
        "incantations",
        "Blasphemous Blade",
        "Erdtree Seal",
    ],
    "fuerza": [
        "strength",
        "Greatsword",
        "Giant-Crusher",
        "Bloodfiend's Arm",
    ],
    "destreza": [
        "dexterity",
        "Rivers of Blood",
        "Nagakiba",
        "Hand of Malenia",
    ],
    "inteligencia": [
        "intelligence",
        "sorceries",
        "Moonveil",
        "Dark Moon Greatsword",
    ],
    "arcano": [
        "arcane",
        "bleed",
        "Rivers of Blood",
        "Mohgwyn's Sacred Spear",
    ],
}

ELDEN_RING_TABLE_CATALOG = """
TABLAS DISPONIBLES EN SUPABASE:

- weapons: armas. Campos: name, image, description, requirements, passive_effect, weight, dlc.
- weapons_upgrades: mejoras de armas. Campos: attack_power, stat_scaling, passive_effects, damage_reduction.
- shields: escudos. Campos: name, image, description, requirements, passive_effect, weight, dlc.
- shields_upgrades: mejoras de escudos. Campos: attack_power, stat_scaling, passive_effects, damage_reduction.
- armors: armaduras. Campos: name, image, type, damage_negation, resistance, special_effect, how_to_acquire, weight, dlc.
- talismans: talismanes. Campos: name, image, effect, description, weight, value, dlc.
- sorceries: hechicerías. Campos: name, image, effect, location, fp, slot, int_req, fai_req, arc_req, stamina_cost, dlc.
- incantations: encantamientos. Campos: name, image, effect, location, fp, slot, int_req, fai_req, arc_req, stamina_cost, dlc.
- ashes_of_war: cenizas de guerra. Campos: name, image, effect, affinity, skill, location, dlc.
- skills: habilidades. Campos: name, image, effect, equipment, locations, dlc.
- spirit_ashes: cenizas espirituales. Campos: name, image, effect, description, fp_cost, hp_cost, dlc.
- bosses: jefes. Campos: name, image, hp, locations_and_drops, dlc.
- creatures: criaturas/enemigos. Campos: name, image, locations, drops, dlc.
- npcs: NPCs. Campos: name, image, location, role, questline, dlc.
- locations: localizaciones. Campos: name, region, description, items, enemies, dlc.
- consumables: consumibles. Campos: name, image, effect, description, dlc.
- materials: materiales. Campos: name, image, description, location, dlc.
- upgrade_materials: materiales de mejora. Campos: name, image, description, location, dlc.
- key_items: objetos clave. Campos: name, image, description, location, dlc.
- crystal_tears: lágrimas de cristal. Campos: name, image, effect, location, dlc.
- cookbooks: recetarios. Campos: name, image, required_for, location, dlc.
- remembrances: recuerdos. Campos: name, image, description, boss, option_1, option_2, dlc.
- bell_bearings: esferas de mercader. Campos: name, image, location, unlocks, dlc.
- great_runes: grandes runas. Campos: name, image, effect, boss, tower, dlc.
- builds: builds. Campos: name, description, weapon, armor, talismans, spells, skills, spirit_ashes, upvotes, is_dlc.
"""

SYSTEM_PROMPT = f"""
Eres The Souls Grail AI, un asistente experto en Elden Ring y Shadow of the Erdtree.

Tu trabajo es interpretar preguntas escuetas, incompletas, con alias, con errores de escritura,
en español o inglés, y responder como una guía experta del juego.

REGLAS PRINCIPALES:
1. Responde siempre en español.
2. Interpreta nombres incompletos, alias y traducciones aproximadas.
3. Usa primero el contexto interno disponible.
4. Si el contexto interno no basta, usa el contexto externo.
5. No inventes números exactos, drops, ubicaciones, requisitos o recompensas si no aparecen en el contexto.
6. Si falta un dato concreto, dilo de forma breve y útil, sin sonar inseguro.
7. No menciones Supabase, Fextralife, scraping, base de datos, contexto interno ni fuentes.
8. Si algo pertenece a Shadow of the Erdtree, márcalo con [DLC].
9. Nunca empieces diciendo “no se encontraron coincidencias exactas”.
10. Si el usuario dice algo como “Radahn Consort of Miquella”, interprétalo como “Promised Consort Radahn / Radahn, Consort of Miquella” [DLC].
11. Si la pregunta es ambigua, responde la interpretación más probable.
12. No pidas aclaración salvo que sea imposible responder.
13. Si la pregunta es de lore, separa hechos confirmados de interpretación.
14. Si la pregunta es de build, da una configuración práctica y jugable.
15. Si compara cosas, da veredicto final.
16. Al final, si mencionas objetos, armas, jefes, NPCs o lugares importantes, añade:
ITEMS_MENCIONADOS: nombre1, nombre2, nombre3

ESTILO:
- Tono experto, elegante y Souls-like.
- Directo, útil y sin relleno.
- Nada de “como IA”.
- Nada de disculpas innecesarias.
- Usa bullets cuando mejoren la lectura.
- Usa nombres exactos cuando estén disponibles.

CATÁLOGO DE DATOS:
{ELDEN_RING_TABLE_CATALOG}
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
    "boss": ["boss", "jefe", "jefes", "final boss", "boss final", "enemigo", "enemigos"],
    "item": ["item", "objeto", "objetos", "material", "llave", "key item", "consumible"],
    "weapon": ["arma", "armas", "weapon", "sword", "katana", "greatsword", "colosal"],
    "armor": ["armadura", "armor", "set", "casco", "pechera", "guanteletes", "grebas"],
    "talisman": ["talisman", "talismán", "talismanes"],
    "spell": ["hechizo", "hechizos", "sorcery", "sorceries", "spell", "magia"],
    "incantation": ["encantamiento", "encantamientos", "incantation", "incantations", "milagro"],
    "ash": ["ceniza", "cenizas", "ash", "ashes", "ashes of war", "spirit ash"],
    "npc": ["npc", "personaje", "quest", "mision", "misión", "questline"],
    "location": ["ubicacion", "ubicación", "localizacion", "localización", "zona", "region", "región", "mapa"],
    "lore": ["lore", "historia", "teoria", "teoría", "quien es", "qué es", "explicame"],
    "build": ["build", "builds", "stats", "atributos", "nivel", "talismans", "talismán"],
    "dlc": ["dlc", "shadow of the erdtree", "sote", "reino de las sombras", "realm of shadow"],
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

    words = [
        w for w in normalized.split()
        if len(w) > 2 and w not in GENERIC_STOPWORDS
    ]

    terms.extend(words)

    if len(words) >= 2:
        for i in range(len(words) - 1):
            terms.append(f"{words[i]} {words[i + 1]}")

    if len(words) >= 3:
        for i in range(len(words) - 2):
            terms.append(f"{words[i]} {words[i + 1]} {words[i + 2]}")

    intents = detect_intents(text)

    if "dlc" in intents or "dlc" in normalized or "miquella" in normalized:
        terms.extend([
            "Shadow of the Erdtree",
            "DLC",
            "Realm of Shadow",
        ])

    return list(dict.fromkeys([t for t in terms if t and len(t) > 2]))[:18]


def get_priority_tables(query: str) -> list[tuple[str, str]]:
    intents = detect_intents(query)
    normalized = normalize_text(query)

    priority_names = []

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
        priority_names += ["locations", "bosses", "npcs", "creatures", "key_items"]
    if "item" in intents:
        priority_names += [
            "key_items", "consumables", "materials", "upgrade_materials",
            "crystal_tears", "cookbooks", "bell_bearings", "great_runes",
            "remembrances", "talismans"
        ]
    if "build" in intents:
        priority_names += [
            "builds", "weapons", "talismans", "armors", "sorceries",
            "incantations", "ashes_of_war", "spirit_ashes"
        ]

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
    if "miquella" in normalized_query and ("miquella" in name or table in ["bosses", "remembrances", "npcs"]):
        score += 20

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
                    .data
                    or []
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

    lines = ["INFORMACIÓN INTERNA DISPONIBLE:"]

    for item in db_results[:14]:
        table = item.get("_table", "unknown")
        name = item.get("name", "Sin nombre")
        score = item.get("_score", 0)

        lines.append(f"\n• {name} ({table}) [relevancia: {score}]")

        dlc = item.get("dlc", item.get("is_dlc"))
        if dlc:
            lines.append("  - DLC: Sí")

        important_fields = [
            "hp",
            "description",
            "effect",
            "location",
            "locations",
            "region",
            "role",
            "questline",
            "requirements",
            "passive_effect",
            "weight",
            "type",
            "special_effect",
            "how_to_acquire",
            "damage_negation",
            "resistance",
            "items",
            "enemies",
            "drops",
            "locations_and_drops",
            "option_1",
            "option_2",
            "boss",
            "fp",
            "slot",
            "int_req",
            "fai_req",
            "arc_req",
            "stamina_cost",
            "fp_cost",
            "hp_cost",
            "weapon",
            "armor",
            "talismans",
            "spells",
            "skills",
            "spirit_ashes",
            "upvotes",
            "required_for",
            "unlocks",
            "tower",
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
                        print(f"[SEARCH] ✓ Directo encontrado: {url}")
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

    if "ITEMS_MENCIONADOS:" not in response_text:
        return response_text.strip(), mentioned_items

    parts = response_text.split("ITEMS_MENCIONADOS:")
    clean_response = parts[0].strip()

    mentioned_names = []
    if len(parts) > 1:
        mentioned_names = [n.strip() for n in parts[1].split(",") if n.strip()]

    for name in mentioned_names:
        normalized_name = normalize_text(name)

        match = next(
            (
                item
                for item in items_with_images
                if normalize_text(item["name"]) in normalized_name
                or normalized_name in normalize_text(item["name"])
            ),
            None,
        )

        if match and match not in mentioned_items:
            mentioned_items.append(match)

    return clean_response, mentioned_items


def build_user_prompt(user_query: str, db_context: str, internet_context: str, intents: list[str]) -> str:
    return f"""
CONSULTA DEL USUARIO:
{user_query}

INTENCIÓN DETECTADA:
{", ".join(intents) if intents else "general"}

CONTEXTO INTERNO:
{db_context if db_context else "No hay coincidencia exacta interna. Interpreta la consulta usando alias, variantes de nombre, nombres incompletos y contexto externo si existe."}

CONTEXTO EXTERNO:
{internet_context[:6000] if internet_context else "No se encontró información externa adicional."}

INSTRUCCIONES DE RESPUESTA:

Analiza la consulta como si el usuario fuera escueto. Interpreta la entidad más probable.

Si es un BOSS:
- Nombre correcto
- Si es [DLC]
- Ubicación
- Rol en el juego
- Recompensas/drops si aparecen
- Fases principales si aparecen
- Estrategia práctica
- Lore resumido si procede

Si es un OBJETO:
- Qué es
- Efecto
- Dónde conseguirlo
- Uso recomendado
- Si es [DLC], indícalo

Si es un ARMA:
- Tipo
- Requisitos si aparecen
- Efecto pasivo
- Mejor build
- Dónde conseguirla
- Veredicto

Si es una BUILD:
- Stats prioritarios
- Armas
- Armadura
- Talismans
- Hechizos/encantamientos
- Cenizas de guerra
- Lágrimas de cristal
- Estilo de juego
- Alternativas

Si es NPC:
- Quién es
- Ubicación
- Qué ofrece
- Questline
- Advertencias

Si es LORE:
- Hechos confirmados
- Interpretación razonable
- Conexiones importantes

REGLAS:
- No digas “no se encontraron coincidencias exactas”.
- No menciones fuentes internas ni externas.
- No inventes datos exactos si no están en el contexto.
- Si falta un dato, di “No aparece especificado en los datos disponibles” y continúa con ayuda práctica.
- Responde en español.
- Cierra con ITEMS_MENCIONADOS si mencionas entidades importantes.

RESPUESTA FINAL:
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

    prompt = build_user_prompt(
        user_query=query.message,
        db_context=db_context,
        internet_context=internet_context,
        intents=intents,
    )

    completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        model="llama-3.3-70b-versatile",
        temperature=0.22,
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