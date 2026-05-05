import os
import random
import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq # <--- Importamos Groq
from services.supabase_client import get_supabase

router = APIRouter(prefix="/builds", tags=["Builds"])

# Configura tu API Key de Groq (Sácala de https://console.groq.com/)
GROQ_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_KEY)

class BuildQuery(BaseModel):
    playstyle: str
    is_dlc: bool

async def agent_extract_build(playstyle: str):
    # Aquí simulamos el post de Reddit. 
    # En el futuro, aquí harás un SELECT a tu tabla de 'scraped_posts'
    mock_posts = {
        "sangrado": "For a god-tier bleed build in 2026, you must use Rivers of Blood. Wear the White Mask and the rest of the Rakshasa Set. Essential talismans: Lord of Blood's Exultation and Rotten Winged Sword Insignia. Ash of War: Seppuku on a Godskin Peeler.",
        "fuerza": "Strength is king. Use the Giant-Crusher with Lion's Claw ash of war. Bull-Goat set is mandatory for poise. Claw Talisman and Great-Jar's Arsenal are a must."
    }
    
    post_content = mock_posts.get(playstyle, "Build focused on " + playstyle)

    # El Prompt: Le pedimos a Llama 3 que nos devuelva SOLO JSON
    prompt = f"""
    Eres un experto en Elden Ring. Analiza este post de Reddit y extrae los elementos de la build.
    Post: "{post_content}"
    
    Responde ESTRICTAMENTE en formato JSON con esta estructura:
    {{
      "weapon": "nombre del arma principal",
      "armor_main": "nombre del set o pieza principal",
      "talismanes": ["talisman1", "talisman2"],
      "skill": "nombre de la habilidad o ceniza"
    }}
    """

    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama3-8b-8192", # El modelo más rápido de Groq
        response_format={"type": "json_object"}
    )
    
    import json
    return json.loads(chat_completion.choices[0].message.content)

@router.post("/search")
async def search_builds(query: BuildQuery):
    try:
        # 1. Llamamos al Agente de Groq para extraer la build del "post"
        extracted = await agent_extract_build(query.playstyle.lower())
        
        sb = get_supabase()
        all_items = sb.table("items").select("*").execute().data or []
        all_skills = sb.table("skills").select("*").execute().data or []

        # 2. El Mapper: Busca en tu BBDD lo que Groq ha extraído
        def find_in_db(name_query, category):
            if not name_query: return []
            return [
                i for i in all_items 
                if name_query.lower() in (i.get("name") or "").lower() 
                and category in (i.get("type") or "").lower()
            ]

        # 3. Construimos la respuesta final cruzando datos
        weapon = find_in_db(extracted["weapon"], "weapon")[:1]
        # Si dice "Rakshasa", buscamos todas las piezas de ese set
        armor = [i for i in all_items if extracted["armor_main"].lower() in (i.get("name") or "").lower() and "armor" in (i.get("type") or "").lower()][:4]
        talismans = []
        for t_name in extracted["talismanes"]:
            talismans.extend(find_in_db(t_name, "talisman"))

        return {
            "build_name": f"Recomendación de la Comunidad ({query.playstyle})",
            "weapon": weapon,
            "armor": armor,
            "talismans": talismans[:4],
            "skills": [s for s in all_skills if extracted["skill"].lower() in (s.get("name") or "").lower()][:1],
            "spirit_ashes": sb.table("spirit_ashes").select("*").limit(2).execute().data or []
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="El agente ha fallado analizando Reddit.")