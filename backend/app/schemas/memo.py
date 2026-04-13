from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MemoCreate(BaseModel):
    content: str


class MemoUpdate(BaseModel):
    content: str


class MemoOut(BaseModel):
    id: int
    material_id: int
    user_id: int
    user_name: Optional[str] = None
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
