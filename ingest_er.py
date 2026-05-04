import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def ingest_from_local_json():
    # 1. Obtener ID de Elden Ring
    game_res = supabase.table("games").select("id").eq("slug", "elden-ring").execute()
    if not game_res.data:
        print("❌ No se encontró Elden Ring en Supabase.")
        return
    game_id = game_res.data[0]['id']

    # 2. Cargar el JSON que acabamos de descargar
    file_path = "weapons.json"
    if not os.path.exists(file_path):
        print(f"❌ Error: No existe el archivo {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        weapons = json.load(f)

    print(f"📖 Archivo cargado. Procesando {len(weapons)} armas...")

    # 3. Insertar en Supabase
    count = 0
    for w in weapons:
        # Adaptamos los campos al formato del JSON de 'deliton'
        item_payload = {
            "game_id": game_id,
            "name": w.get('name'),
            "description": w.get('description', 'Sin descripción'),
            "image_url": w.get('image'),
            "stats": {
                "attack": w.get('attack', []),
                "scaling": w.get('scalesWith', []),
                "required": w.get('requiredAttributes', [])
            },
            "metadata": {
                "category": "weapon",
                "weight": w.get('weight')
            }
        }

        try:
            supabase.table("items").upsert(item_payload, on_conflict="game_id,name").execute()
            count += 1
            if count % 50 == 0:
                print(f"⚔️ {count} armas sincronizadas...")
        except Exception as e:
            print(f"⚠️ Error insertando {w.get('name')}: {e}")

    print(f"\n✅ ¡CONSEGUIDO! Se han procesado {count} armas.")
    print("Ahora ve a Supabase y el count(*) debería ser > 300.")

if __name__ == "__main__":
    ingest_from_local_json()