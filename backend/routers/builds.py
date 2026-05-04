from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

# Importación absoluta desde la carpeta services
from services.supabase_client import get_supabase

# 1. Definimos el router
router = APIRouter(prefix="/builds", tags=["Builds"])

# 2. Definimos el modelo de datos para la consulta
class BuildQuery(BaseModel):
    playstyle: str
    is_dlc: bool

@router.post("/search")
async def search_builds(query: BuildQuery):
    try:
        sb = get_supabase()
        playstyle = query.playstyle.lower()

        # --- DICCIONARIO META (Reddit Knowledge) ---
        build_templates = {
            "sangrado": {
                "weapon_keywords": ["rivers of blood", "uchigatana", "nagakiba", "reduvia", "eleonora"],
                "armor_keywords": ["white mask", "rakshasa", "okina"],
                "talisman_keywords": ["lord of blood", "winged sword", "alexander", "millicent"]
            },
            "fuerza": {
                "weapon_keywords": ["giant-crusher", "grafted blade", "starscourge", "guts", "nightrider"],
                "armor_keywords": ["bull-goat", "lionel", "night's cavalry"],
                "talisman_keywords": ["great-jar", "claw talisman", "erdtree", "dragoncrest"]
            },
            "magia": {
                "weapon_keywords": ["moonveil", "dark moon", "lusat", "azur", "carian knight"],
                "armor_keywords": ["queen's crescent", "spellblade", "alberich", "lusat"],
                "talisman_keywords": ["graven-mass", "magic scorpion", "radagon icon"]
            },
            "fe": {
                "weapon_keywords": ["blasphemous", "sacred relic", "coded sword", "vyke"],
                "armor_keywords": ["crucible", "haligtree knight", "goldmask"],
                "talisman_keywords": ["flock's canvas", "fire scorpion", "godfrey icon"]
            },
            "destreza": {
                "weapon_keywords": ["hand of malenia", "bolt of gransax", "godskin peeler"],
                "armor_keywords": ["malenia", "okina", "leda"],
                "talisman_keywords": ["millicent's prosthesis", "winged sword", "shard of alexander"]
            }
        }

        # Obtenemos el template o uno genérico
        template = build_templates.get(playstyle, {
            "weapon_keywords": [playstyle], 
            "armor_keywords": [], 
            "talisman_keywords": []
        })

        # --- CONSULTAS A SUPABASE ---
        items_res = sb.table("items").select("*").execute()
        all_items = items_res.data if items_res.data else []

        # FUNCIÓN DE BÚSQUEDA INTERNA MEJORADA
        def find_best_match(items_list, keywords, category_filter, limit=3):
            matches = []
            if not keywords: return []
            
            category_filter = category_filter.lower()

            for item in items_list:
                name = (item.get("name") or "").lower()
                raw_type = (item.get("type") or "").lower()
                
                # Buscamos coincidencia de palabra clave y que la categoría esté presente en el tipo
                has_keyword = any(kw in name for kw in keywords)
                category_match = category_filter in raw_type
                
                if has_keyword and category_match:
                    matches.append(item)
            
            return matches[:limit]

        # 3. Lógica de selección por categoría
        recommended_weapons = find_best_match(all_items, template["weapon_keywords"], "weapon") 
        recommended_talismans = find_best_match(all_items, template["talisman_keywords"], "talisman")
        recommended_armor = find_best_match(all_items, template["armor_keywords"], "armor", limit=4)
        
        # Backup si no encuentra armadura específica del meta (siempre filtrando por tipo armor)
        if not recommended_armor:
            recommended_armor = [
                i for i in all_items 
                if "armor" in (i.get("type") or "").lower() and 
                any(t in (i.get("name") or "").lower() for t in ["armor", "set", "mask", "helm", "robe"])
            ][:4]

        # Consultas para Spells, Skills y Ashes
        spells_res = sb.table("spells").select("*").execute()
        skills_res = sb.table("skills").select("*").execute()
        ashes_res = sb.table("spirit_ashes").select("*").limit(2).execute()
        
        recommended_spells = [s for s in (spells_res.data or []) if playstyle in (s.get("description") or "").lower()][:3]
        
        # Habilidades que peguen con el estilo o las armas
        weapon_names = [w.get("name", "").lower() for w in recommended_weapons]
        recommended_skills = [
            s for s in (skills_res.data or []) 
            if any(kw in (s.get("name") or "").lower() for kw in template["weapon_keywords"]) or
               any(wn in (s.get("description") or "").lower() for wn in weapon_names)
        ][:2]

        return {
            "playstyle": query.playstyle,
            "is_dlc": query.is_dlc,
            "weapon": recommended_weapons,
            "armor": recommended_armor,
            "talismans": recommended_talismans,
            "spells": recommended_spells,
            "skills": recommended_skills,
            "spirit_ashes": ashes_res.data or []
        }

    except Exception as e:
        # Esto te ayudará a ver el error real en la terminal
        print(f"--- DEBUG ERROR ---")
        import traceback
        traceback.print_exc()
        print(f"-------------------")
        raise HTTPException(status_code=500, detail=str(e))