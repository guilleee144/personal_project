import os
import csv
import ast
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from services.supabase_client import get_supabase

sb = get_supabase()
BASE = os.path.join(os.path.dirname(__file__), "csvs")

def to_bool(val):
    return str(val).strip() in ("1", "true", "True", "yes")

def to_int(val, default=0):
    try: return int(val)
    except: return default

def to_float(val):
    try: return float(val)
    except: return None

def to_json(val):
    if not val or str(val).strip() in ("", "nan", "None", "NaN"): return None
    try: return ast.literal_eval(val)
    except: return str(val)

def insert_in_batches(table: str, rows: list, batch_size: int = 100):
    total = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        sb.table(table).insert(batch).execute()
        total += len(batch)
        print(f"    {total}/{len(rows)}...")

def load_weapons_upgrades():
    print("Loading weapons upgrades...")
    rows = []
    with open(f"{BASE}/weapons_upgrades.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append({
                "weapon_name":      row["weapon name"],
                "upgrade":          row["upgrade"] or None,
                "attack_power":     to_json(row["attack power"]),
                "stat_scaling":     to_json(row["stat scaling"]),
                "passive_effects":  to_json(row["passive effects"]),
                "damage_reduction": to_json(row["damage reduction (%)"]),
            })
    insert_in_batches("weapons_upgrades", rows)
    print(f"  ✓ {len(rows)} weapons upgrades")

def load_shields_upgrades():
    print("Loading shields upgrades...")
    rows = []
    with open(f"{BASE}/shields_upgrades.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append({
                "shield_name":      row["shield name"],
                "upgrade":          row["upgrade"] or None,
                "attack_power":     to_json(row["attack power"]),
                "stat_scaling":     to_json(row["stat scaling"]),
                "passive_effects":  to_json(row["passive effects"]),
                "damage_reduction": to_json(row["damage reduction (%)"]),
            })
    insert_in_batches("shields_upgrades", rows)
    print(f"  ✓ {len(rows)} shields upgrades")

if __name__ == "__main__":
    print("=== Loading remaining Elden Ring data ===\n")
    load_weapons_upgrades()
    load_shields_upgrades()
    print("\n=== Done! ===")