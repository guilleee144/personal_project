from fastapi import APIRouter
from models.schemas import AgentQuery
from services.supabase_client import get_supabase
import httpx
import json

router = APIRouter(prefix="/agent", tags=["agent"])

def query_ollama(prompt: str) -> str:
    response = httpx.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2",
            "prompt": prompt,
            "stream": False
        },
        timeout=60.0
    )
    return response.json()["response"]

@router.post("/ask")
def ask_agent(query: AgentQuery):
    sb = get_supabase()

    # Context Injection: traemos datos reales de Supabase
    items = sb.table("items").select("*").limit(50).execute().data
    spells = sb.table("spells").select("*").limit(30).execute().data
    skills = sb.table("skills").select("*").limit(30).execute().data
    spirits = sb.table("spirit_ashes").select("*").limit(20).execute().data

    context_data = {
        "items": items,
        "spells": spells,
        "skills": skills,
        "spirit_ashes": spirits
    }

    prompt = f"""Eres un experto en Elden Ring. Usa SOLO los datos reales de la base de datos que te proporciono.
No inventes armas ni stats. Si no encuentras algo en los datos, dilo claramente.

DATOS DE LA BASE DE DATOS:
{json.dumps(context_data, ensure_ascii=False, indent=2)}

PREGUNTA DEL USUARIO:
{query.message}

Responde en español, de forma estructurada y concisa. Si recomiendas items, menciona sus stats reales.
"""

    response = query_ollama(prompt)
    return {"response": response, "context_used": True}