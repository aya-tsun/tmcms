from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from datetime import datetime, timezone
import enum

from ..database import Base


class MaterialLevel(str, enum.Enum):
    beginner = "入門"
    elementary = "初級"
    intermediate = "中級"
    advanced = "上級"


class MaterialLanguage(str, enum.Enum):
    japanese = "日本語"
    english = "英語"
    other = "その他"


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    url = Column(String(2048), nullable=False)
    provider = Column(String(100), nullable=False)
    provider_category = Column(String(50), nullable=True)
    category = Column(String(100), nullable=True)
    duration = Column(Float, nullable=True)
    cost = Column(Float, nullable=True)
    level = Column(Enum(MaterialLevel), nullable=True)
    language = Column(Enum(MaterialLanguage), nullable=True)
    delivery_methods = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    target_audience = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    creator = relationship("User", back_populates="materials")
    material_tags = relationship("MaterialTag", back_populates="material", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="material", cascade="all, delete-orphan")
    memos = relationship("Memo", back_populates="material", cascade="all, delete-orphan")
    material_learning_topics = relationship("MaterialLearningTopic", back_populates="material", cascade="all, delete-orphan")
