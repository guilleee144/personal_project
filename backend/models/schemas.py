from pydantic import BaseModel
from typing import Optional

class AgentQuery(BaseModel):
    message: str
    context: Optional[str] = None

class BuildFilter(BaseModel):
    strength: Optional[int] = 0
    dexterity: Optional[int] = 0
    intelligence: Optional[int] = 0
    faith: Optional[int] = 0
    arcane: Optional[int] = 0
    is_dlc: Optional[bool] = None
    playstyle: Optional[str] = None