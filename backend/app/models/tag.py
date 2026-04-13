from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from ..database import Base


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    creator = relationship("User", back_populates="tags")
    material_tags = relationship("MaterialTag", back_populates="tag")


class MaterialTag(Base):
    __tablename__ = "material_tags"

    material_id = Column(Integer, ForeignKey("materials.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)

    material = relationship("Material", back_populates="material_tags")
    tag = relationship("Tag", back_populates="material_tags")
