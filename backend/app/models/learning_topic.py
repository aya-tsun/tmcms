from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from ..database import Base


class LearningTopic(Base):
    __tablename__ = "learning_topics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    material_topics = relationship("MaterialLearningTopic", back_populates="topic", cascade="all, delete-orphan")


class MaterialLearningTopic(Base):
    __tablename__ = "material_learning_topics"

    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), primary_key=True)
    topic_id = Column(Integer, ForeignKey("learning_topics.id", ondelete="CASCADE"), primary_key=True)

    topic = relationship("LearningTopic", back_populates="material_topics")
    material = relationship("Material", back_populates="material_learning_topics")
