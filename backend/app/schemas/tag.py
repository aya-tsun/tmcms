from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TagCreate(BaseModel):
    name: str


class TagOut(BaseModel):
    id: int
    name: str
    created_by: Optional[int] = None
    created_at: datetime
    material_count: int = 0

    model_config = {"from_attributes": True}
