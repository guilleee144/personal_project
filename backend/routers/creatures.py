from fastapi import APIRouter, HTTPException, Query
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/creatures", tags=["creatures"])

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


@router.get("/")
def get_creatures(
    search: str = Query(None, description="Filter by name"),
    dlc: bool = Query(None, description="Filter by DLC (true/false)"),
    limit: int = Query(5000, description="Max results"),
    offset: int = Query(0, description="Pagination offset"),
):
    try:
        query = supabase.table("creatures").select("*")

        if search:
            query = query.ilike("name", f"%{search}%")

        if dlc is not None:
            query = query.eq("dlc", dlc)

        query = query.order("name").range(offset, offset + limit - 1)

        result = query.execute()
        return {"data": result.data, "count": len(result.data)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{creature_id}")
def get_creature(creature_id: int):
    try:
        result = supabase.table("creatures").select("*").eq("id", creature_id).single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Creature not found")

        return result.data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))