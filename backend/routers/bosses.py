import os
from fastapi import APIRouter, HTTPException
from supabase import create_client, Client

router = APIRouter(prefix="/bosses", tags=["bosses"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print(f"[BOSSES] Initializing with URL: {SUPABASE_URL[:50] if SUPABASE_URL else 'None'}...")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print("[BOSSES] Supabase client initialized")


@router.get("")
@router.get("/")
async def get_bosses(dlc: bool | None = None, search: str | None = None):
    """Obtiene todos los bosses con filtros opcionales"""
    try:
        print(f"[BOSSES] Fetching bosses with dlc={dlc}, search='{search}'")
        
        # Obtén todos los bosses primero
        query = supabase.table("bosses").select("*")
        
        # Filtro por DLC si está especificado
        if dlc is not None:
            print(f"[BOSSES] Applying DLC filter: {dlc}")
            query = query.eq("dlc", dlc)

        response = query.execute()
        bosses = response.data if response.data else []
        
        print(f"[BOSSES] Got {len(bosses)} bosses from database")

        # Filtrar por búsqueda EN PYTHON (evita problemas con Supabase)
        if search and len(search.strip()) > 0:
            search_lower = search.lower().strip()
            bosses = [b for b in bosses if search_lower in b.get("name", "").lower()]
            print(f"[BOSSES] After search filter: {len(bosses)} bosses")

        # Mapear datos
        bosses_formatted = []
        for boss in bosses:
            bosses_formatted.append({
                "id": boss.get("id"),
                "name": boss.get("name", "Unknown"),
                "image": boss.get("image"),
                "hp": boss.get("hp"),
                "locations_and_drops": boss.get("locations_and_drops"),
                "blockquote": boss.get("blockquote"),
                "dlc": boss.get("dlc", False),
            })

        print(f"[BOSSES] Returning {len(bosses_formatted)} formatted bosses")
        return {
            "source": "supabase",
            "count": len(bosses_formatted),
            "bosses": bosses_formatted,
        }

    except Exception as e:
        print(f"[BOSSES] Error fetching bosses: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"No se pudieron cargar los bosses: {str(e)}",
        )


@router.get("/{boss_id}")
async def get_boss(boss_id: int):
    """Obtiene un boss específico por ID"""
    try:
        print(f"[BOSSES] Fetching boss with id: {boss_id}")
        
        response = supabase.table("bosses").select("*").eq("id", boss_id).single().execute()
        boss = response.data

        if not boss:
            raise HTTPException(status_code=404, detail="Boss not found")

        return {
            "source": "supabase",
            "boss": {
                "id": boss.get("id"),
                "name": boss.get("name", "Unknown"),
                "image": boss.get("image"),
                "hp": boss.get("hp"),
                "locations_and_drops": boss.get("locations_and_drops"),
                "blockquote": boss.get("blockquote"),
                "dlc": boss.get("dlc", False),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[BOSSES] Error fetching boss: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"No se pudo cargar el boss: {str(e)}",
        )