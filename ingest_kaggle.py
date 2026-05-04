import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def ingest_from_csv(file_path):
    # 1. Obtener ID de Elden Ring
    game_res = supabase.table("games").select("id").eq("slug", "elden-ring").execute()
    game_id = game_res.data[0]['id']

    # 2. Leer el CSV
    # Nota: Asegúrate de que el nombre del archivo coincida con el que descargaste
    df = pd.read_csv(file_path)
    print(f"📄 CSV cargado: {len(df)} filas encontradas.")

    for _, row in df.iterrows():
        name = str(row['Name']) # Ajusta 'Name' al nombre real de la columna en tu CSV
        
        # --- PASO A: Insertar en ITEMS (La tabla maestra) ---
        item_payload = {
            "game_id": game_id,
            "name": name,
            "description": row.get('Description', 'No description'),
            "image_url": row.get('Image_URL', None), # Ajusta según el CSV
            "metadata": {"source": "kaggle_dataset"}
        }

        try:
            # Upsert en Items para obtener el ID
            res = supabase.table("items").upsert(item_payload, on_conflict="game_id,name").execute()
            item_id = res.data[0]['id']

            # --- PASO B: Lógica de "Reparto" según el tipo ---
            # Supongamos que el CSV tiene una columna llamada 'Type'
            item_type = str(row.get('Type', '')).lower()

            if 'weapon' in item_type or 'shield' in item_type:
                # Datos para weapon_details
                weapon_payload = {
                    "item_id": item_id,
                    "attack": {"physical": row.get('Physical_Atk', 0)}, # Ejemplo
                    "scaling": {"str": row.get('Str_Scale', '-')},
                    "category": item_type
                }
                supabase.table("weapon_details").upsert(weapon_payload).execute()
                print(f"⚔️ Arma/Escudo: {name}")

            elif 'armor' in item_type or 'helm' in item_type:
                # Datos para armor_details
                armor_payload = {
                    "item_id": item_id,
                    "defense": {"physical": row.get('Physical_Def', 0)},
                    "weight": row.get('Weight', 0),
                    "category": item_type
                }
                supabase.table("armor_details").upsert(armor_payload).execute()
                print(f"🛡️ Armadura: {name}")

        except Exception as e:
            print(f"⚠️ Error procesando {name}: {e}")

if __name__ == "__main__":
    # Cambia 'tu_archivo.csv' por el nombre real del archivo de Kaggle
    ingest_from_csv("elden_ring_items.csv")