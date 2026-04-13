from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, Dict


class EvaluationCreate(BaseModel):
    overall_score: float
    quality: Optional[float] = None
    clarity: Optional[float] = None
    cost_effectiveness: Optional[float] = None
    custom_scores: Optional[Dict[str, float]] = None

    @field_validator("overall_score", "quality", "clarity", "cost_effectiveness", mode="before")
    @classmethod
    def validate_score(cls, v):
        if v is not None and not (1 <= v <= 5):
            raise ValueError("Score must be between 1 and 5")
        return v


class EvaluationUpdate(BaseModel):
    overall_score: Optional[float] = None
    quality: Optional[float] = None
    clarity: Optional[float] = None
    cost_effectiveness: Optional[float] = None
    custom_scores: Optional[Dict[str, float]] = None


class EvaluationOut(BaseModel):
    id: int
    material_id: int
    user_id: int
    user_name: Optional[str] = None
    overall_score: float
    quality: Optional[float] = None
    clarity: Optional[float] = None
    cost_effectiveness: Optional[float] = None
    custom_scores: Optional[Dict[str, float]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustomAxisCreate(BaseModel):
    name: str
    order: int = 0


class CustomAxisOut(BaseModel):
    id: int
    name: str
    order: int
    created_at: datetime

    model_config = {"from_attributes": True}
