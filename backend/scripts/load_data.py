import os
from supabase import create_client
from dotenv import load_dotenv

# Cargar variables del .env
load_dotenv()

# Configuración
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
FEXTRALIFE_BASE = "https://eldenring.wiki.fextralife.com/file/Elden-Ring/"

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL y SUPABASE_KEY deben estar definidas en .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Skills con sus nombres de archivo encontrados
SKILLS_TO_UPDATE = {
    "Aspects of the Crucible: Wings": "aspect_of_the_crucible_wings.gif",
    "Raging Beast": "raging_beast.gif",
    "Red Bear Hunt": "red_bear_hunt2.gif",
    "Swift Slash": "swift_slash2.gif",
    "Overhead Stance": "overhead_stance.gif",
    "Flame Skewer": "flame_skewer.gif",
    "Shriek of Sorrow": "shriek_of_sorrow.gif",
    "Flame Spear": "flame_spear.gif",
    "Shield Strike": "shield_strike.gif",
    "Igon's Drake Hunt": "igons_drake_hunt.gif",
    "Ghostflame Call": "ghostflame_call.gif",
    "Dynastic Sickleplay": "dynastic_sickleplay.gif",
    "Blinkbolt: Twinaxe": "blinkbolt_twinaxe2.gif",
    "Blinkbolt: Long-hafted Axe": "blinkbolt_long-hafted_axe.gif",
    "Devonia's Vortex": "devonias_vortex.gif",
    "Sleep Evermore": "sleep_evermore_elden_ring_fextralife.gif",
    "Moore's Charge": "moores_charge.gif",
    "Euporia Vortex": "euporia_vortex.gif",
    "Poison Spear-Hand Strike": "poison_spear-hand_strike.gif",
    "Feeble Lord's Frenzied Flame": "feeble_lords_frenzied_flame.gif",
    "Repeating Fire": "repeating_fire.gif",
    "Fan Shot": "fan_shot.gif",
    "Flower Dragonbolt": "flower_dragonbolt.gif",
    "Kowtower's Resentment": "kowtowers_resentment.gif",
    "Painful Strike": "painful_strike.gif",
    "Jori's Inquisition": "joris_inquisition.gif",
    "Roaring Bash": "roaring_bash.gif",
    "Hone Blade": "hone_blade.gif",
    "Tremendous Phalanx": "tremendous_phalanx2_2.gif",
    "Bloodfiends' Bloodboon": "bloodfiends_bloodboon.gif",
    "Dragonform Flame": "dragonform_flame.gif",
    "Rancor Shot": "rancor_shot.gif",
}

def update_skills():
    """
    Actualiza los skills con las imágenes encontradas
    """
    print("\n" + "=" * 60)
    print("SUBIENDO IMÁGENES DE SKILLS - MANUALMENTE ENCONTRADAS")
    print("=" * 60 + "\n")
    
    updated = 0
    failed = 0
    
    for idx, (skill_name, filename) in enumerate(SKILLS_TO_UPDATE.items(), 1):
        image_url = FEXTRALIFE_BASE + filename
        
        print(f"[{idx}/{len(SKILLS_TO_UPDATE)}] {skill_name}")
        print(f"  → {image_url}")
        
        try:
            # Buscar el skill por nombre
            response = supabase.table("skills").select("id").eq("name", skill_name).execute()
            
            if not response.data or len(response.data) == 0:
                print(f"  ✗ Skill no encontrado en BD\n")
                failed += 1
                continue
            
            skill_id = response.data[0]['id']
            
            # Actualizar imagen
            supabase.table("skills").update({
                "image": image_url
            }).eq("id", skill_id).execute()
            
            print(f"  ✓ Actualizado en BD\n")
            updated += 1
            
        except Exception as e:
            print(f"  ✗ Error: {e}\n")
            failed += 1
    
    print("=" * 60)
    print(f"RESUMEN: {updated} skills actualizados, {failed} errores")
    print("=" * 60)

if __name__ == "__main__":
    update_skills()