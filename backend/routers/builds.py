import os
import json
import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from services.supabase_client import get_supabase

load_dotenv()
GROQ_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_KEY)

router = APIRouter(prefix="/builds", tags=["Builds"])

class BuildQuery(BaseModel):
    playstyle: str
    is_dlc: bool

async def agent_get_reddit_build(playstyle: str):
    # Prompt agresivo para evitar mocks y forzar piezas individuales
    prompt = f"""
    Eres un analista de meta-juego de Elden Ring que lee Reddit y YouTube.
    Genera una build REAL de '{playstyle}'.
    
    REGLAS ESTRICTAS:
    1. No uses nombres de sets generales (ej: No digas 'Malenia Set').
    2. Desglosa la armadura en piezas: Helm, Chest Armor, Gauntlets, Leggings.
    3. Usa los nombres técnicos exactos del juego en inglés.
    
    Responde en JSON:
    {{
      "build_name": "Nombre del meta actual",
      "weapon": ["Nombre del Arma"],
      "armor": ["Pieza Cabeza", "Pieza Pecho", "Pieza Manos", "Pieza Piernas"],
      "talismans": ["Talisman 1", "Talisman 2", "Talisman 3", "Talisman 4"],
      "skills": ["Ceniza de Guerra"],
      "spirit_ashes": ["Espíritu"]
    }}
    """
    completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"}
    )
    return json.loads(completion.choices[0].message.content)

@router.post("/search")
async def search_builds(query: BuildQuery):
    try:
        reddit_build = await agent_get_reddit_build(query.playstyle.lower())
        sb = get_supabase()

        # Descargamos todo para comparar en memoria (más rápido y evita errores de query)
        db_items = sb.table("items").select("name, image").execute().data or []
        db_skills = sb.table("skills").select("name, image").execute().data or []
        db_spirits = sb.table("spirit_ashes").select("name, image").execute().data or []

        def match_item(name_from_ai, pool):
            if not name_from_ai: return {"name": name_from_ai, "image": None}
            
            n_ai = name_from_ai.lower().strip()
            
            # 1. Intento: ¿El nombre de la IA está contenido en la DB o viceversa?
            # Esto pilla "Seppuku" -> "Ash of War: Seppuku"
            for item in pool:
                n_db = item["name"].lower()
                if n_ai in n_db or n_db in n_ai:
                    return {"name": item["name"], "image": item["image"]}
            
            # 2. Intento: Si es un nombre largo (Talismanes), probamos con las palabras clave
            # Esto pilla "Lord of Blood" -> "Lord of Blood's Exultation"
            words = n_ai.split()
            if len(words) > 1:
                keywords = " ".join(words[:2]) # Probamos con las primeras 2 palabras
                for item in pool:
                    if keywords in item["name"].lower():
                        return {"name": item["name"], "image": item["image"]}

            return {"name": name_from_ai, "image": None}

        # Procesamos con la nueva lógica de búsqueda inteligente
        return {
            "build_name": reddit_build.get("build_name", "Meta Build"),
            "weapon": [match_item(w, db_items) for w in reddit_build.get("weapon", [])],
            "armor": [match_item(a, db_items) for a in reddit_build.get("armor", [])],
            "talismans": [match_item(t, db_items) for t in reddit_build.get("talismans", [])],
            "skills": [match_item(s, db_skills) for s in reddit_build.get("skills", [])],
            "spirit_ashes": [match_item(sp, db_spirits) for sp in reddit_build.get("spirit_ashes", [])]
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))