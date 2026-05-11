from fastapi import APIRouter, HTTPException
from bs4 import BeautifulSoup
import httpx
import re
import os
from dotenv import load_dotenv
from supabase import create_client

# Cargar variables del .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL y SUPABASE_KEY deben estar definidas en .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(prefix="/npcs", tags=["npcs"])

async def scrape_npc_details(npc_name: str) -> dict:
    """
    Scrapea voiced_by, quote y drops de un NPC desde Fextralife
    """
    url_name = npc_name.replace(' ', '+')
    url = f"https://eldenring.wiki.fextralife.com/{url_name}"
    
    details = {
        'voiced_by': None,
        'quote': None,
        'drops': None,
    }
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url)
            response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Buscar en infobox
        infobox = soup.find('div', {'class': ['infobox', 'wiki-infobox']})
        if infobox:
            rows = infobox.find_all('tr')
            
            for row in rows:
                cells = row.find_all(['th', 'td'])
                if len(cells) >= 2:
                    key = cells[0].get_text(strip=True).lower()
                    val = cells[1].get_text(strip=True)
                    
                    if 'voiced' in key or 'voice' in key:
                        details['voiced_by'] = val
                    
                    elif 'drops' in key or 'drop' in key:
                        details['drops'] = val
        
        # Buscar quote/dialogue
        content_div = soup.find('div', {'class': 'mw-parser-output'})
        if content_div:
            all_p = content_div.find_all('p')
            
            for p in all_p:
                text = p.get_text(strip=True)
                
                # Buscar entre comillas
                if '"' in text and len(text) > 30:
                    start = text.find('"')
                    end = text.find('"', start + 1)
                    if start != -1 and end != -1:
                        quote = text[start+1:end]
                        if 10 < len(quote) < 500:
                            details['quote'] = quote
                            break
                
                # Buscar entre itálicas (*)
                elif '*' in text:
                    italic_match = re.search(r'\*(.*?)\*', text)
                    if italic_match:
                        quote = italic_match.group(1)
                        if 10 < len(quote) < 500:
                            details['quote'] = quote
                            break
        
        return details
        
    except Exception as e:
        print(f"Error scraping {npc_name}: {e}")
        return details

@router.get("/")
async def get_npcs():
    """
    GET /npcs → Retorna todos los NPCs de la BD
    """
    try:
        response = supabase.table("npcs").select("*").execute()
        npcs = response.data if response.data else []
        
        return {
            "npcs": npcs,
            "total": len(npcs),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{npc_id}")
async def get_npc_with_details(npc_id: int):
    """
    GET /npcs/{npc_id} → Retorna un NPC con detalles scrapeados
    """
    try:
        # Obtener NPC de la BD
        response = supabase.table("npcs").select("*").eq("id", npc_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="NPC no encontrado")
        
        npc = response.data[0]
        npc_dict = dict(npc) if hasattr(npc, '__dict__') else npc
        
        # Scrapear detalles adicionales
        details = await scrape_npc_details(npc_dict['name'])
        
        # Combinar datos (scrapeados sobreescriben si existen)
        if details['voiced_by']:
            npc_dict['voiced_by'] = details['voiced_by']
        if details['quote']:
            npc_dict['quote'] = details['quote']
        if details['drops']:
            npc_dict['drops'] = details['drops']
        
        return npc_dict
        
    except Exception as e:
        print(f"Error en get_npc_with_details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_npc(query: str):
    """
    GET /npcs/search?query=name → Busca un NPC por nombre
    """
    try:
        response = supabase.table("npcs").select("*").execute()
        npcs = response.data if response.data else []
        
        # Búsqueda local
        query_lower = query.lower()
        filtered = [n for n in npcs if query_lower in n['name'].lower()]
        
        return {"npcs": filtered}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))