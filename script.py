import os
import pandas as pd
from supabase import create_client, Client

# 1. CONFIGURACIÓN DE SUPABASE
# Sustituye con tus credenciales de los settings de Supabase (Project API keys)
URL = "TU_SUPABASE_URL"
KEY = "TU_SUPABASE_ANON_KEY"
supabase: Client = create_client(URL, KEY)

# 2. DICCIONARIO DE MAPEADO (Basado en tu imagen)
# Nombre del archivo -> Nombre de la tabla en Supabase
csv_mapping = {
    # Categoría: Personajes y Mundo
    'bosses.csv': 'Bosses',
    'npcs.csv': 'NPCs',
    'locations.csv': 'Locations',
    'creatures.csv': 'Creatures',

    # Categoría: Equipamiento e Items (Muchos pueden ir a 'Items' con un campo 'category')
    'weapons.csv': 'Items',
    'armors.csv': 'Items',
    'talismans.csv': 'Items',
    'shields.csv': 'Items',
    'ammos.csv': 'Items',
    'consumables.csv': 'Items',
    'keyItems.csv': 'Items',
    'materials.csv': 'Items',
    'upgradeMaterials.csv': 'Items',
    'tools.csv': 'Items',
    
    # Categoría: Magia y Habilidades
    'sorceries.csv': 'Spells',
    'incantations.csv': 'Spells',
    'ashesOfWar.csv': 'Skills',
    'skills.csv': 'Skills',
    
    # Otros
    'spiritAshes.csv': 'Spirit_Ashes',
    'greatRunes.csv': 'Great_Runes',
    'crystalTears.csv': 'Crystal_Tears',
    'cookbooks.csv': 'Cookbooks',
    'bells.csv': 'Bell_Bearings',
    'remembrances.csv': 'Remembrances',
    'whetblades.csv': 'Whetblades'
}

def upload_to_supabase():
    print("--- Iniciando migración a Supabase ---")
    
    for file_name, table_name in csv_mapping.items():
        if os.path.exists(file_name):
            try:
                # Cargar CSV
                df = pd.read_csv(file_name)
                
                # Limpieza rápida: Convertir NaN a None para que Supabase lo acepte como NULL
                df = df.where(pd.notnull(df), None)
                
                # Si subimos a la tabla 'Items', añadimos una columna para saber qué es
                if table_name == 'Items':
                    df['sub_category'] = file_name.replace('.csv', '')

                # Convertir dataframe a lista de diccionarios (formato JSON)
                records = df.to_dict(orient='records')
                
                # Subida por lotes (batch) para no saturar la API
                # Supabase permite subir listas de objetos directamente
                batch_size = 500 
                for i in range(0, len(records), batch_size):
                    batch = records[i:i + batch_size]
                    data, count = supabase.table(table_name).upsert(batch).execute()
                
                print(f"✅ {file_name} -> Subido a tabla '{table_name}' ({len(records)} filas)")

            except Exception as e:
                print(f"❌ Error subiendo {file_name}: {e}")
        else:
            print(f"⚠️ Archivo saltado (no existe): {file_name}")

if __name__ == "__main__":
    upload_to_supabase()