from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models.user import User
from ..models.tag import Tag, MaterialTag
from ..schemas.tag import TagCreate, TagOut
from ..auth.jwt import get_current_user, require_admin

router = APIRouter(prefix="/api/tags", tags=["tags"])


def _tag_with_count(tag: Tag, db: Session) -> TagOut:
    count = db.query(func.count(MaterialTag.material_id)).filter(
        MaterialTag.tag_id == tag.id
    ).scalar()
    return TagOut(
        id=tag.id,
        name=tag.name,
        created_by=tag.created_by,
        created_at=tag.created_at,
        material_count=count or 0,
    )


@router.get("", response_model=List[TagOut])
def list_tags(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    tags = db.query(Tag).order_by(Tag.name).all()
    return [_tag_with_count(t, db) for t in tags]


@router.post("", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(
    data: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Tag).filter(Tag.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="このタグ名はすでに存在します")
    tag = Tag(name=data.name, created_by=current_user.id)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return _tag_with_count(tag, db)


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="タグが見つかりません")
    # Remove associations
    db.query(MaterialTag).filter(MaterialTag.tag_id == tag_id).delete()
    db.delete(tag)
    db.commit()
