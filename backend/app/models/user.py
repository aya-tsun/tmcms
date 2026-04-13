from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from ..database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    member = "member"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.member, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    materials = relationship("Material", back_populates="creator")
    evaluations = relationship("Evaluation", back_populates="user")
    memos = relationship("Memo", back_populates="user")
    tags = relationship("Tag", back_populates="creator")
