import os
import json
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

def fetch_table(table: str, columns: str, limit: int = 60) -> list[dict]:
    sb = get_supabase()
    return sb.table(table).select(columns).limit(limit).execute().data or []

def detect_intent(message: str) -> dict:
    msg = message.lower()
    return {
        "weapons":      any(w in msg for w in ["arma", "weapon", "espada", "hacha", "lanza", "katana", "martillo", "daga", "escudo", "shield"]),
        "armors":       any(w in msg for w in ["armadura", "armor", "casco", "helm", "pecho", "guante", "grebas", "set", "ropa", "mask", "máscara", "mascara"]),
        "talismans":    any(w in msg for w in ["talismán", "talisman", "amuleto", "medallion"]),
        "sorceries":    any(w in msg for w in ["hechizo", "sorcery", "magia", "glintstone", "inteligencia"]),
        "incantations": any(w in msg for w in ["encantamiento", "incantation", "fe", "faith", "sagrado", "llama", "dragon"]),
        "skills":       any(w in msg for w in ["ceniza", "ash of war", "habilidad", "skill"]),
        "spirit_ashes": any(w in msg for w in ["espíritu", "spirit", "invocación", "summon", "fantasma"]),
        "bosses":       any(w in msg for w in ["jefe", "boss", "enemigo", "enemy", "dropeado", "drop"]),
        "locations":    any(w in msg for w in ["dónde", "donde", "ubicación", "location", "encontrar", "find", "zona", "area", "region"]),
        "remembrances": any(w in msg for w in ["remembrance", "recuerdo", "memoria"]),
        "creatures":    any(w in msg for w in ["criatura", "creature", "enemigo", "enemy", "npc"]),
        "builds":       any(w in msg for w in ["build", "equipamiento", "recomend", "estilo", "sangrado", "fuerza", "destreza"]),
    }

async def search_fextralife(query: str) -> str:
    """Busca en Fextralife si no hay info en la DB."""
    search_url = f"https://eldenring.wiki.fextralife.com/search?q={query.replace(' ', '+')}"
    print(f"[AGENT SEARCH] Buscando en Fextralife: '{query}'")
    try:
        async with httpx.AsyncClient(headers=SCRAPE_HEADERS, timeout=10.0, follow_redirects=True) as c:
            res = await c.get(search_url)
            if res.status_code != 200:
                return ""
            soup = BeautifulSoup(res.text, "html.parser")
            # Buscar el primer resultado relevante
            results = soup.select(".search-results a, .wiki-content a")
            for link in results[:3]:
                href = link.get("href", "")
                if href and "fextralife.com" in href or href.startswith("/"):
                    full_url = f"https://eldenring.wiki.fextralife.com{href}" if href.startswith("/") else href
                    page_res = await c.get(full_url)
                    if page_res.status_code == 200:
                        page_soup = BeautifulSoup(page_res.text, "html.parser")
                        # Quitar scripts y navegación
                        for tag in page_soup(["script", "style", "nav", "footer", "aside"]):
                            tag.decompose()
                        text = page_soup.get_text(separator="\n", strip=True)
                        print(f"[AGENT SEARCH] Encontrado en: {full_url}")
                        return text[:3000]
    except Exception as e:
        print(f"[AGENT SEARCH] Error: {e}")
    return ""

async def search_item_direct(item_name: str) -> str:
    """Busca directamente la página del item en Fextralife."""
    slug = item_name.replace(" ", "+")
    url = f"https://eldenring.wiki.fextralife.com/{slug}"
    print(f"[AGENT SEARCH] Fetch directo: {url}")
    try:
        async with httpx.AsyncClient(headers=SCRAPE_HEADERS, timeout=10.0, follow_redirects=True) as c:
            res = await c.get(url)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, "html.parser")
                for tag in soup(["script", "style", "nav", "footer", "aside", "header"]):
                    tag.decompose()
                text = soup.get_text(separator="\n", strip=True)
                return text[:3000]
    except Exception as e:
        print(f"[AGENT SEARCH] Error directo: {e}")
    return ""
def search_item_by_name(item_name: str) -> list[dict]:
    """Busca un item específico por nombre en todas las tablas relevantes."""
    sb = get_supabase()
    results = []
    name_query = item_name.lower()

    tables = [
        ("weapons",      "name, image, description, passive_effect, dlc"),
        ("armors",       "name, image, type, special_effect, how_to_acquire, description, dlc"),
        ("talismans",    "name, image, effect, description, dlc"),
        ("sorceries",    "name, image, effect, location, dlc"),
        ("incantations", "name, image, effect, location, dlc"),
        ("skills",       "name, image, effect, locations, dlc"),
        ("spirit_ashes", "name, image, effect, description, dlc"),
        ("shields",      "name, image, description, passive_effect, dlc"),
    ]

    for table, columns in tables:
        try:
            data = sb.table(table).select(columns).ilike("name", f"%{item_name}%").limit(5).execute().data or []
            for item in data:
                item["_table"] = table
                results.append(item)
        except Exception:
            pass

    return results

@router.post("/ask")
async def ask_agent(query: AgentQuery):
    intent = detect_intent(query.message)
    context_data = {}
    items_with_images = []
    internet_context = ""

    # ── Búsqueda específica por nombre si es pregunta de ubicación ────────
    if intent["locations"] or "dónde" in query.message.lower() or "donde" in query.message.lower():
        words_to_remove = ["dónde", "donde", "encuentro", "consigo", "está", "esta", "la", "el",
                           "cómo", "como", "conseguir", "encontrar", "obtener", "buenas", "hola", "?", "¿"]
        item_search = query.message
        for w in words_to_remove:
            item_search = item_search.replace(w, " ")
        item_search = " ".join(item_search.split()).strip()

        if len(item_search) > 3:
            specific_items = search_item_by_name(item_search)
            if specific_items:
                context_data["item_especifico_buscado"] = specific_items
                print(f"[AGENT] Item específico encontrado: {[i['name'] for i in specific_items]}")
                items_with_images += [
                    {"name": i["name"], "image": i.get("image"), "type": i.get("_table", "item"), "dlc": i.get("dlc")}
                    for i in specific_items if i.get("image")
                ]

    # ── Cargar tablas relevantes ──────────────────────────────────────────

    if intent["weapons"] or intent["builds"]:
        weapons = fetch_table("weapons", "name, image, description, requirements, category, dlc, passive_effect, skill", 50)
        context_data["weapons"] = [
            {"name": w["name"], "requirements": w.get("requirements"),
             "passive_effect": w.get("passive_effect", ""),
             "description": (w.get("description") or "")[:120]}
            for w in weapons
        ]
        items_with_images += [{"name": w["name"], "image": w.get("image"), "type": "weapon", "dlc": w.get("dlc")} for w in weapons if w.get("image")]

    if intent["armors"]:
        armors = fetch_table("armors", "name, image, type, special_effect, how_to_acquire, description, dlc", 60)
        context_data["armors"] = [
            {"name": a["name"], "type": a.get("type"),
             "special_effect": a.get("special_effect", ""),
             "how_to_acquire": a.get("how_to_acquire", ""),
             "description": (a.get("description") or "")[:100]}
            for a in armors
        ]
        items_with_images += [{"name": a["name"], "image": a.get("image"), "type": "armor", "dlc": a.get("dlc")} for a in armors if a.get("image")]

    if intent["talismans"] or intent["builds"]:
        talismans = fetch_table("talismans", "name, image, effect, description, dlc", 50)
        context_data["talismans"] = [
            {"name": t["name"], "effect": (t.get("effect") or "")[:120]}
            for t in talismans
        ]
        items_with_images += [{"name": t["name"], "image": t.get("image"), "type": "talisman", "dlc": t.get("dlc")} for t in talismans if t.get("image")]

    if intent["sorceries"]:
        sorceries = fetch_table("sorceries", "name, image, effect, int_req, location, dlc", 40)
        context_data["sorceries"] = [
            {"name": s["name"], "int_req": s.get("int_req"),
             "location": s.get("location", ""),
             "effect": (s.get("effect") or "")[:100]}
            for s in sorceries
        ]
        items_with_images += [{"name": s["name"], "image": s.get("image"), "type": "sorcery", "dlc": s.get("dlc")} for s in sorceries if s.get("image")]

    if intent["incantations"]:
        incants = fetch_table("incantations", "name, image, effect, fai_req, arc_req, location, dlc", 40)
        context_data["incantations"] = [
            {"name": i["name"], "fai_req": i.get("fai_req"),
             "location": i.get("location", ""),
             "effect": (i.get("effect") or "")[:100]}
            for i in incants
        ]
        items_with_images += [{"name": i["name"], "image": i.get("image"), "type": "incantation", "dlc": i.get("dlc")} for i in incants if i.get("image")]

    if intent["skills"]:
        skills = fetch_table("skills", "name, image, effect, equipment, locations, dlc", 40)
        context_data["skills"] = [
            {"name": s["name"], "equipment": s.get("equipment", ""),
             "locations": s.get("locations", ""),
             "effect": (s.get("effect") or "")[:100]}
            for s in skills
        ]
        items_with_images += [{"name": s["name"], "image": s.get("image"), "type": "skill", "dlc": s.get("dlc")} for s in skills if s.get("image")]

    if intent["spirit_ashes"]:
        spirits = fetch_table("spirit_ashes", "name, image, effect, fp_cost, hp_cost, description, dlc", 30)
        context_data["spirit_ashes"] = [
            {"name": s["name"], "fp_cost": s.get("fp_cost"),
             "effect": (s.get("effect") or "")[:120]}
            for s in spirits
        ]
        items_with_images += [{"name": s["name"], "image": s.get("image"), "type": "spirit", "dlc": s.get("dlc")} for s in spirits if s.get("image")]

    if intent["bosses"] or intent["locations"]:
        bosses = fetch_table("bosses", "name, image, hp, locations_and_drops, dlc", 40)
        context_data["bosses"] = [
            {"name": b["name"], "hp": b.get("hp"),
             "locations_and_drops": b.get("locations_and_drops")}
            for b in bosses
        ]
        items_with_images += [{"name": b["name"], "image": b.get("image"), "type": "boss", "dlc": b.get("dlc")} for b in bosses if b.get("image")]

    if intent["locations"]:
        locations = fetch_table("locations", "name, region, description, dlc", 40)
        context_data["locations"] = [
            {"name": l["name"], "region": l.get("region", ""),
             "description": (l.get("description") or "")[:150]}
            for l in locations
        ]

    if intent["remembrances"]:
        remembrances = fetch_table("remembrances", "name, image, description, option_1, option_2, boss, dlc", 20)
        context_data["remembrances"] = [
            {"name": r["name"], "boss": r.get("boss", ""),
             "option_1": r.get("option_1", ""), "option_2": r.get("option_2", "")}
            for r in remembrances
        ]
        items_with_images += [{"name": r["name"], "image": r.get("image"), "type": "remembrance", "dlc": r.get("dlc")} for r in remembrances if r.get("image")]

    if intent["creatures"]:
        creatures = fetch_table("creatures", "name, image, locations, drops, dlc", 30)
        context_data["creatures"] = [
            {"name": c["name"], "locations": c.get("locations"),
             "drops": c.get("drops")}
            for c in creatures
        ]

    if not any(intent.values()) and not context_data:
        context_data["weapons"]   = [{"name": w["name"], "requirements": w.get("requirements")} for w in fetch_table("weapons", "name, requirements", 20)]
        context_data["talismans"] = [{"name": t["name"], "effect": t.get("effect", "")} for t in fetch_table("talismans", "name, effect", 20)]

    # ── Buscar en internet si hace falta ──────────────────────────────────
    context_str = json.dumps(context_data, ensure_ascii=False)
    needs_internet = (
        intent["locations"] or
        len(context_str) < 500 or
        "dónde" in query.message.lower() or
        "donde" in query.message.lower() or
        "ubicación" in query.message.lower() or
        "cómo conseguir" in query.message.lower()
    )

    if needs_internet:
        clean_query = query.message.replace("?", "").replace("¿", "").strip()
        internet_context = await search_item_direct(clean_query)
        if len(internet_context) < 200:
            internet_context = await search_fextralife(clean_query)

    # ── Prompt ────────────────────────────────────────────────────────────
    prompt = f"""Eres un experto absoluto en Elden Ring y Shadow of the Erdtree.
Tienes conocimiento profundo de mecánicas, lore, builds, ubicaciones y todos los items.

DATOS DE LA BASE DE DATOS:
{context_str[:3000]}

{"INFORMACIÓN ADICIONAL DE INTERNET (Fextralife Wiki):" + internet_context[:2000] if internet_context else ""}

PREGUNTA:
{query.message}

INSTRUCCIONES:
- Responde en español, de forma clara y estructurada.
- Si la pregunta es sobre dónde encontrar un item, usa el campo "how_to_acquire" o "location" del contexto.
- Si el item está en "item_especifico_buscado", úsalo como fuente principal.
- NUNCA inventes ubicaciones. Si no sabes con certeza, dilo y usa la info de internet.
- Si mencionas items que están en la DB, escribe su nombre EXACTAMENTE como aparece.
- Al final añade: ITEMS_MENCIONADOS: nombre1, nombre2, ...
- Si el item es del DLC, indícalo con [DLC].
"""

    completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "Eres The Souls Grail AI, experto en Elden Ring. Respondes siempre en español con información precisa sobre items, builds, ubicaciones y lore."
            },
            {"role": "user", "content": prompt}
        ],
        model="llama-3.3-70b-versatile",
        temperature=0.5,
        max_tokens=1500,
    )

    response_text = completion.choices[0].message.content

    # ── Extraer items mencionados ─────────────────────────────────────────
    mentioned_items = []
    if "ITEMS_MENCIONADOS:" in response_text:
        parts = response_text.split("ITEMS_MENCIONADOS:")
        response_text = parts[0].strip()
        mentioned_names = [n.strip() for n in parts[1].split(",") if n.strip()]
        for name in mentioned_names:
            match = next((i for i in items_with_images if i["name"].lower() == name.lower()), None)
            if match:
                mentioned_items.append(match)

    return {
        "response":        response_text,
        "context_used":    True,
        "internet_used":   bool(internet_context),
        "mentioned_items": mentioned_items,
    }