from fastapi import APIRouter

router = APIRouter(prefix="/patches", tags=["patches"])

# Mock data — aquí conectaremos Reddit más adelante
PATCH_NOTES = [
    {
        "version": "1.12.3",
        "date": "2024-10-15",
        "source": "official",
        "title": "Balance update — Shadow of the Erdtree weapons adjusted",
        "changes": [
            {"type": "nerf", "item": "Milady", "detail": "Damage reduced by 8%"},
            {"type": "buff", "item": "Backhand Blade", "detail": "Bleed buildup increased"},
            {"type": "fix", "item": "General", "detail": "Fixed hitbox issues in DLC areas"},
        ]
    },
    {
        "version": "1.12.2",
        "date": "2024-08-20",
        "source": "reddit",
        "title": "Community findings — Hidden nerfs detected via datamine",
        "changes": [
            {"type": "nerf", "item": "Rivers of Blood", "detail": "Ash of War damage -10%"},
            {"type": "buff", "item": "Meteoric Ore Blade", "detail": "Stance damage increased"},
        ]
    }
]

@router.get("/")
def get_patches():
    return PATCH_NOTES