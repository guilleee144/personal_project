from fastapi import APIRouter, HTTPException, Query
from supabase import create_client
import os
import json

router = APIRouter(prefix="/items", tags=["items"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "your_supabase_url")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your_supabase_key")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Mapeo de categorías a tablas con sus columnas relevantes
CATEGORIES = {
    "weapons": {
        "table": "weapons",
        "icon": "⚔",
        "display_fields": ["id", "name", "image", "weight", "requirements", "dlc"]
    },
    "armors": {
        "table": "armors",
        "icon": "🛡",
        "display_fields": ["id", "name", "image", "damage_negation", "resistance", "weight", "dlc"]
    },
    "shields": {
        "table": "shields",
        "icon": "🛡",
        "display_fields": ["id", "name", "image", "weight", "requirements", "dlc"]
    },
    "talismans": {
        "table": "talismans",
        "icon": "◆",
        "display_fields": ["id", "name", "image", "weight", "value", "dlc"]
    },
    "consumables": {
        "table": "consumables",
        "icon": "🧪",
        "display_fields": ["id", "name", "image", "dlc"]
    },
    "materials": {
        "table": "materials",
        "icon": "⚒",
        "display_fields": ["id", "name", "image", "dlc"]
    },
    "upgrade_materials": {
        "table": "upgrade_materials",
        "icon": "✨",
        "display_fields": ["id", "name", "image", "dlc"]
    },
    "tools": {
        "table": "tools",
        "icon": "🔧",
        "display_fields": ["id", "name", "image", "dlc"]
    },
    "key_items": {
        "table": "key_items",
        "icon": "🔑",
        "display_fields": ["id", "name", "image", "dlc"]
    },
    "cookbooks": {
        "table": "cookbooks",
        "icon": "📖",
        "display_fields": ["id", "name", "image", "required_for", "dlc"]
    },
    "crystal_tears": {
        "table": "crystal_tears",
        "icon": "💧",
        "display_fields": ["id", "name", "image", "dlc"]
    },
    "great_runes": {
        "table": "great_runes",
        "icon": "👑",
        "display_fields": ["id", "name", "image", "dlc"]
    },
    "remembrances": {
        "table": "remembrances",
        "icon": "📜",
        "display_fields": ["id", "name", "image", "dlc"]
    },
    "bell_bearings": {
        "table": "bell_bearings",
        "icon": "🔔",
        "display_fields": ["id", "name", "image", "dlc"]
    },
    "spirit_ashes": {
        "table": "spirit_ashes",
        "icon": "👻",
        "display_fields": ["id", "name", "image", "fp_cost", "hp_cost", "dlc"]
    },
    "ashes_of_war": {
        "table": "ashes_of_war",
        "icon": "🔥",
        "display_fields": ["id", "name", "image", "dlc"]
    },
    "skills": {
        "table": "skills",
        "icon": "⚡",
        "display_fields": ["id", "name", "image", "dlc"]
    },
    "whetblades": {
        "table": "whetblades",
        "icon": "🔪",
        "display_fields": ["id", "name", "image", "dlc"]
    },
    "ammos": {
        "table": "ammos",
        "icon": "🏹",
        "display_fields": ["id", "name", "image", "attack_power", "dlc"]
    },
    "multi_items": {
        "table": "multi_items",
        "icon": "📦",
        "display_fields": ["id", "name", "image", "dlc"]
    },
    "sorceries": {
        "table": "sorceries",
        "icon": "✦",
        "display_fields": ["id", "name", "image", "fp", "slot", "int_req", "dlc"]
    },
    "incantations": {
        "table": "incantations",
        "icon": "🙏",
        "display_fields": ["id", "name", "image", "fp", "slot", "fai_req", "dlc"]
    },
}


@router.get("")
async def get_all_categories():
    """Retorna todas las categorías de items con conteo"""
    categories_data = []
    
    for category_key, category_info in CATEGORIES.items():
        try:
            table = category_info["table"]
            
            # Contar total de items
            total_response = supabase.table(table).select("id", count="exact").execute()
            total_count = total_response.count if total_response.count else 0
            
            # Contar items DLC
            dlc_response = supabase.table(table).select("id", count="exact").eq("dlc", True).execute()
            dlc_count = dlc_response.count if dlc_response.count else 0
            
            categories_data.append({
                "id": category_key,
                "name": category_key.replace("_", " ").title(),
                "icon": category_info["icon"],
                "count": total_count,
                "dlc_count": dlc_count,
                "has_dlc": dlc_count > 0
            })
        except Exception as e:
            print(f"[ITEMS] Error fetching category {category_key}: {e}")
            categories_data.append({
                "id": category_key,
                "name": category_key.replace("_", " ").title(),
                "icon": category_info["icon"],
                "count": 0,
                "dlc_count": 0,
                "has_dlc": False
            })
    
    return {
        "categories": categories_data,
        "total_categories": len(categories_data)
    }


@router.get("/{category}")
async def get_category_items(
    category: str,
    search: str = Query(None),
    dlc: bool = Query(None),
    limit: int = Query(100, ge=1, le=500)
):
    """Retorna items de una categoría específica con filtros"""
    
    if category not in CATEGORIES:
        raise HTTPException(status_code=404, detail=f"Categoría '{category}' no existe")
    
    category_info = CATEGORIES[category]
    table = category_info["table"]
    
    try:
        # Build query
        query = supabase.table(table).select("*")
        
        # Filtro DLC
        if dlc is not None:
            query = query.eq("dlc", dlc)
        
        # Ejecutar query
        response = query.limit(limit).execute()
        items = response.data if response.data else []
        
        # Filtro por búsqueda (en cliente es más rápido que en servidor)
        if search:
            search_lower = search.lower()
            items = [
                item for item in items
                if search_lower in item.get("name", "").lower()
            ]
        
        # Retornar solo campos relevantes
        display_fields = category_info["display_fields"]
        filtered_items = []
        
        for item in items:
            filtered_item = {field: item.get(field) for field in display_fields if field in item}
            filtered_items.append(filtered_item)
        
        return {
            "category": category,
            "category_name": category.replace("_", " ").title(),
            "total": len(filtered_items),
            "items": filtered_items
        }
        
    except Exception as e:
        print(f"[ITEMS] Error fetching items from {table}: {e}")
        raise HTTPException(status_code=500, detail=f"Error al cargar items: {str(e)}")


@router.get("/{category}/{item_id}")
async def get_item_detail(category: str, item_id: int):
    """Retorna detalles completos de un item específico"""
    
    if category not in CATEGORIES:
        raise HTTPException(status_code=404, detail=f"Categoría '{category}' no existe")
    
    table = CATEGORIES[category]["table"]
    
    try:
        response = supabase.table(table).select("*").eq("id", item_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Item {item_id} no encontrado en {category}")
        
        item = response.data
        
        return {
            "category": category,
            "item": item
        }
        
    except Exception as e:
        print(f"[ITEMS] Error fetching item {item_id} from {table}: {e}")
        raise HTTPException(status_code=500, detail=f"Error al cargar item: {str(e)}")


@router.post("/search")
async def search_items(
    query: str = Query(..., min_length=1),
    limit: int = Query(50, ge=1, le=200)
):
    """Búsqueda global en todas las categorías"""
    
    results = {
        "query": query,
        "results_by_category": {},
        "total_results": 0
    }
    
    search_lower = query.lower()
    
    for category_key, category_info in CATEGORIES.items():
        try:
            table = category_info["table"]
            response = supabase.table(table).select("id, name, image, dlc").limit(limit).execute()
            items = response.data if response.data else []
            
            # Filtrar por búsqueda
            filtered = [
                item for item in items
                if search_lower in item.get("name", "").lower()
            ]
            
            if filtered:
                results["results_by_category"][category_key] = {
                    "count": len(filtered),
                    "items": filtered[:5]  # Top 5 per category
                }
                results["total_results"] += len(filtered)
                
        except Exception as e:
            print(f"[ITEMS] Error searching in {table}: {e}")
    
    return results