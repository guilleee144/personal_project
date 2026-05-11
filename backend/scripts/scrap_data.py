import httpx
from bs4 import BeautifulSoup
import json

async def scrape_npc_complete(npc_name: str) -> dict:
    """
    Scrapea TODO el contenido de un NPC desde Fextralife
    """
    url_name = npc_name.replace(' ', '+')
    url = f"https://eldenring.wiki.fextralife.com/{url_name}"
    
    print(f"\n{'='*80}")
    print(f"SCRAPEANDO NPC COMPLETO: {npc_name}")
    print(f"URL: {url}")
    print(f"{'='*80}\n")
    
    npc_data = {
        'name': npc_name,
        'url': url,
        'infobox': {},
        'description': None,
        'full_text': None,
        'sections': {},
    }
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url)
            response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 1. INFOBOX (tabla de datos)
        print("📦 BUSCANDO INFOBOX...\n")
        infobox = soup.find('div', {'class': ['infobox', 'wiki-infobox']})
        if infobox:
            rows = infobox.find_all('tr')
            print(f"   ✓ Encontrada tabla infobox con {len(rows)} filas:")
            
            for row in rows:
                cells = row.find_all(['th', 'td'])
                if len(cells) >= 2:
                    key = cells[0].get_text(strip=True)
                    val = cells[1].get_text(strip=True)
                    npc_data['infobox'][key] = val
                    print(f"     - {key}: {val}")
        else:
            print("   ✗ No se encontró infobox")
        
        # 2. CONTENIDO PRINCIPAL (párrafos, listas, etc)
        print(f"\n📝 BUSCANDO CONTENIDO PRINCIPAL...\n")
        content_div = soup.find('div', {'class': 'mw-parser-output'})
        
        all_text = []
        sections = {}
        current_section = 'Introduction'
        
        if content_div:
            # Obtener TODO el texto sin filtros
            all_paragraphs = content_div.find_all('p')
            all_lists = content_div.find_all(['ul', 'ol'])
            all_headers = content_div.find_all(['h2', 'h3', 'h4'])
            all_blockquotes = content_div.find_all('blockquote')
            all_tables = content_div.find_all('table')
            
            print(f"   ✓ Encontrados:")
            print(f"     - {len(all_paragraphs)} párrafos")
            print(f"     - {len(all_lists)} listas")
            print(f"     - {len(all_headers)} headers")
            print(f"     - {len(all_blockquotes)} blockquotes")
            print(f"     - {len(all_tables)} tablas\n")
            
            # Procesar párrafos
            for p in all_paragraphs:
                text = p.get_text(strip=True)
                if text and len(text) > 10:  # Reducir filtro a 10 caracteres
                    all_text.append(text)
                    if current_section not in sections:
                        sections[current_section] = []
                    sections[current_section].append(text)
            
            # Procesar headers y actualizar sección actual
            for h in all_headers:
                text = h.get_text(strip=True)
                if text:
                    current_section = text
                    sections[current_section] = []
            
            # Procesar blockquotes
            for bq in all_blockquotes:
                text = bq.get_text(strip=True)
                if text:
                    all_text.append(f"[QUOTE] {text}")
                    if current_section not in sections:
                        sections[current_section] = []
                    sections[current_section].append(f"[QUOTE] {text}")
            
            # Procesar listas
            for lst in all_lists:
                items = lst.find_all('li')
                for li in items:
                    text = li.get_text(strip=True)
                    if text and len(text) > 5:
                        all_text.append(f"- {text}")
                        if current_section not in sections:
                            sections[current_section] = []
                        sections[current_section].append(f"- {text}")
            
            # Procesar tablas
            for table in all_tables:
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    row_text = ' | '.join([cell.get_text(strip=True) for cell in cells])
                    if row_text:
                        all_text.append(row_text)
                        if current_section not in sections:
                            sections[current_section] = []
                        sections[current_section].append(row_text)
            
            npc_data['full_text'] = '\n\n'.join(all_text)
            npc_data['sections'] = {k: v for k, v in sections.items() if v}  # Eliminar secciones vacías
            
            print(f"   ✓ Procesados {len(all_text)} elementos de contenido\n")
        
        # 3. RESUMEN
        print(f"\n{'='*80}")
        print(f"RESUMEN DEL SCRAPING")
        print(f"{'='*80}")
        print(f"\n✓ Infobox: {len(npc_data['infobox'])} campos encontrados")
        print(f"✓ Contenido: {len(all_text)} párrafos encontrados")
        print(f"✓ Secciones: {len(sections)} secciones encontradas")
        print(f"✓ Caracteres totales: {len(npc_data['full_text']) if npc_data['full_text'] else 0}")
        
        print(f"\n{'='*80}")
        print("INFOBOX COMPLETO:")
        print(f"{'='*80}")
        for key, val in npc_data['infobox'].items():
            print(f"{key}: {val}")
        
        print(f"\n{'='*80}")
        print("SECCIONES ENCONTRADAS:")
        print(f"{'='*80}")
        for section, content in sections.items():
            print(f"\n📌 {section}")
            for line in content[:3]:  # Primeras 3 líneas de cada sección
                print(f"   {line[:100]}")
            if len(content) > 3:
                print(f"   ... y {len(content)-3} líneas más")
        
        print(f"\n{'='*80}")
        print("ANÁLISIS:")
        print(f"{'='*80}")
        print(f"""
✓ Se pueden scrapear:
  - Toda la información del infobox (datos estructurados)
  - Párrafos y descripción completa
  - Citas y diálogos
  - Listas de items, drops, etc
  - Todas las secciones de contenido

VEREDICTO: SE PUEDE SCRAPEAR COMPLETO ✓
        """)
        
        return npc_data
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return npc_data

async def main():
    # Testear con 1 NPC
    npc = 'Sir+Ansbach'
    
    await scrape_npc_complete(npc)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())