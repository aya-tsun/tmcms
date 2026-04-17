from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from ..database import get_db
from ..models.user import User
from ..models.material import Material
from ..models.tag import Tag, MaterialTag
from ..models.evaluation import Evaluation
from ..schemas.material import MaterialCreate, MaterialUpdate, MaterialOut, MaterialListOut
from ..auth.jwt import get_current_user

router = APIRouter(prefix="/api/materials", tags=["materials"])


def _build_material_out(material: Material, db: Session) -> MaterialOut:
    tags = [mt.tag for mt in material.material_tags]
    evaluations = material.evaluations
    overall_score = None
    if evaluations:
        overall_score = sum(e.overall_score for e in evaluations) / len(evaluations)
    creator_name = material.creator.name if material.creator else None
    return MaterialOut(
        id=material.id,
        name=material.name,
        url=material.url,
        provider=material.provider,
        duration=material.duration,
        cost=material.cost,
        level=material.level,
        language=material.language,
        description=material.description,
        created_at=material.created_at,
        created_by=material.created_by,
        creator_name=creator_name,
        tags=[{"id": t.id, "name": t.name} for t in tags],
        overall_score=round(overall_score, 2) if overall_score is not None else None,
        evaluation_count=len(evaluations),
    )


@router.get("", response_model=MaterialListOut)
def list_materials(
    search: Optional[str] = Query(None),
    provider: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    tag_ids: Optional[str] = Query(None),  # comma-separated
    level: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Material)

    if search:
        query = query.filter(
            or_(
                Material.name.ilike(f"%{search}%"),
                Material.provider.ilike(f"%{search}%"),
            )
        )
    if provider:
        query = query.filter(Material.provider.ilike(f"%{provider}%"))
    if category:
        query = query.filter(Material.category.ilike(f"%{category}%"))
    if level:
        query = query.filter(Material.level == level)
    if language:
        query = query.filter(Material.language == language)
    if tag_ids:
        ids = [int(x) for x in tag_ids.split(",") if x.strip().isdigit()]
        if ids:
            for tid in ids:
                query = query.filter(
                    Material.id.in_(
                        db.query(MaterialTag.material_id).filter(MaterialTag.tag_id == tid)
                    )
                )

    total = query.count()
    materials = query.offset(skip).limit(limit).all()

    items = [_build_material_out(m, db) for m in materials]

    # Sort by overall_score if needed (post-query since it's computed)
    if sort_by == "overall_score":
        reverse = sort_order == "desc"
        items.sort(key=lambda x: (x.overall_score is not None, x.overall_score or 0), reverse=reverse)
    elif sort_by == "name":
        reverse = sort_order == "desc"
        items.sort(key=lambda x: x.name, reverse=reverse)
    else:
        # created_at handled by DB
        pass

    return MaterialListOut(items=items, total=total)


@router.post("", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
def create_material(
    data: MaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = Material(
        name=data.name,
        url=data.url,
        provider=data.provider,
        duration=data.duration,
        cost=data.cost,
        level=data.level,
        language=data.language,
        description=data.description,
        created_by=current_user.id,
    )
    db.add(material)
    db.flush()

    for tag_id in data.tag_ids:
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if tag:
            db.add(MaterialTag(material_id=material.id, tag_id=tag_id))

    db.commit()
    db.refresh(material)
    return _build_material_out(material, db)


@router.get("/{material_id}", response_model=MaterialOut)
def get_material(
    material_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="教材が見つかりません")
    return _build_material_out(material, db)


@router.put("/{material_id}", response_model=MaterialOut)
def update_material(
    material_id: int,
    data: MaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="教材が見つかりません")

    if data.name is not None:
        material.name = data.name
    if data.url is not None:
        material.url = data.url
    if data.provider is not None:
        material.provider = data.provider
    if data.duration is not None:
        material.duration = data.duration
    if data.cost is not None:
        material.cost = data.cost
    if data.level is not None:
        material.level = data.level
    if data.language is not None:
        material.language = data.language
    if data.description is not None:
        material.description = data.description

    if data.tag_ids is not None:
        db.query(MaterialTag).filter(MaterialTag.material_id == material_id).delete()
        for tag_id in data.tag_ids:
            tag = db.query(Tag).filter(Tag.id == tag_id).first()
            if tag:
                db.add(MaterialTag(material_id=material.id, tag_id=tag_id))

    db.commit()
    db.refresh(material)
    return _build_material_out(material, db)


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="教材が見つかりません")
    db.delete(material)
    db.commit()
