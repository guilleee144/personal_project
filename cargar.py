import os
import pandas as pd
from supabase import create_client

URL = "https://ocvgoowkvpmpcrowsswl.supabase.co"
KEY = "sb_publishable_rPOclH4L9S1Z_3Xl8ciD8A_ppSRD8tk"
supabase = create_client(URL, KEY)

# Mapeo completo de tus archivos
csv_mapping = {
    'bosses.csv': 'bosses',
    'npcs.csv': 'npcs',
    'locations.csv': 'locations',
    'creatures.csv': 'creatures',
    'weapons.csv': 'items',
    'armors.csv': 'items',
    'talismans.csv': 'items',
    'shields.csv': 'items',
    'ammos.csv': 'items',
    'consumables.csv': 'items',
    'keyItems.csv': 'items',
    'materials.csv': 'items',
    'upgradeMaterials.csv': 'items',
    'tools.csv': 'items',
    'sorceries.csv': 'spells',
    'incantations.csv': 'spells',
    'ashesOfWar.csv': 'skills',
    'skills.csv': 'skills',
    'spiritAshes.csv': 'spirit_ashes',
    'greatRunes.csv': 'great_runes',
    'crystalTears.csv': 'crystal_tears',
    'cookbooks.csv': 'cookbooks',
    'bells.csv': 'bell_bearings',
    'remembrances.csv': 'remembrances',
    'whetblades.csv': 'whetblades'
}

def bulk_upload():
    print("🚀 Iniciando la Gran Carga...")
    
    for file, table in csv_mapping.items():
        if not os.path.exists(file):
            print(f"⚠️ Saltando {file}: No encontrado.")
            continue
            
        try:
            df = pd.read_csv(file)
            df = df.where(pd.notnull(df), None) # Convertir NaNs a nulls de SQL

            # Lógica especial para la tabla 'items'
            if table == 'items':
                df['category'] = file.replace('.csv', '')
            
            # Lógica para 'spells' (sorceries vs incantations)
            if table == 'spells':
                df['type'] = 'sorcery' if 'sorceries' in file else 'incantation'

            # Identificar DLC (si el nombre del archivo o alguna columna lo sugiere)
            if 'dlc' in file.lower() or 'shadow' in file.lower():
                df['is_dlc'] = True

            records = df.to_dict(orient='records')
            
            # Subida en bloques de 500 para evitar timeouts
            for i in range(0, len(records), 500):
                batch = records[i:i+500]
                supabase.table(table).insert(batch).execute()
                
            print(f"✅ {file} subido a la tabla '{table}'")

        except Exception as e:
            print(f"❌ Error procesando {file}: {e}")

if __name__ == "__main__":
    bulk_upload()