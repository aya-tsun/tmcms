from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from ..database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    overall_score = Column(Float, nullable=False)  # 1-5
    quality = Column(Float, nullable=True)          # 1-5
    clarity = Column(Float, nullable=True)          # 1-5
    cost_effectiveness = Column(Float, nullable=True)  # 1-5
    custom_scores = Column(JSON, nullable=True)     # {axis_id: score}
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    material = relationship("Material", back_populates="evaluations")
    user = relationship("User", back_populates="evaluations")


class CustomEvaluationAxis(Base):
    __tablename__ = "custom_evaluation_axes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
