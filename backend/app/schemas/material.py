from pydantic import BaseModel, HttpUrl, field_validator
from datetime import datetime
from typing import Optional, List
from ..models.material import MaterialLevel, MaterialLanguage
from .tag import TagOut
from .evaluation import EvaluationOut


class MaterialCreate(BaseModel):
    name: str
    url: str
    provider: str
    duration: Optional[float] = None
    cost: Optional[float] = None
    level: Optional[MaterialLevel] = None
    language: Optional[MaterialLanguage] = None
    description: Optional[str] = None
    tag_ids: List[int] = []

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    provider: Optional[str] = None
    duration: Optional[float] = None
    cost: Optional[float] = None
    level: Optional[MaterialLevel] = None
    language: Optional[MaterialLanguage] = None
    description: Optional[str] = None
    tag_ids: Optional[List[int]] = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class TagSimple(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class MaterialOut(BaseModel):
    id: int
    name: str
    url: str
    provider: str
    duration: Optional[float] = None
    cost: Optional[float] = None
    level: Optional[MaterialLevel] = None
    language: Optional[MaterialLanguage] = None
    description: Optional[str] = None
    created_at: datetime
    created_by: Optional[int] = None
    creator_name: Optional[str] = None
    tags: List[TagSimple] = []
    overall_score: Optional[float] = None
    evaluation_count: int = 0

    model_config = {"from_attributes": True}


class MaterialListOut(BaseModel):
    items: List[MaterialOut]
    total: int
