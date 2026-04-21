from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.learning_topic import LearningTopic, MaterialLearningTopic
from ..schemas.material import LearningTopicOut
from ..auth.jwt import get_current_user

router = APIRouter(prefix="/api/learning-topics", tags=["learning-topics"])


@router.get("", response_model=list[LearningTopicOut])
def list_topics(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(LearningTopic).order_by(LearningTopic.order, LearningTopic.id).all()


@router.post("", response_model=LearningTopicOut, status_code=status.HTTP_201_CREATED)
def create_topic(
    body: dict,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="名前は必須です")
    if db.query(LearningTopic).filter(LearningTopic.name == name).first():
        raise HTTPException(status_code=409, detail=f"「{name}」はすでに存在します")
    order = db.query(LearningTopic).count()
    topic = LearningTopic(name=name, order=order)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    topic = db.query(LearningTopic).filter(LearningTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="学習項目が見つかりません")
    db.delete(topic)
    db.commit()


@router.post("/materials/{material_id}/toggle", status_code=status.HTTP_200_OK)
def toggle_material_topic(
    material_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    topic_id = body.get("topic_id")
    checked = body.get("checked", True)

    existing = db.query(MaterialLearningTopic).filter(
        MaterialLearningTopic.material_id == material_id,
        MaterialLearningTopic.topic_id == topic_id,
    ).first()

    if checked and not existing:
        db.add(MaterialLearningTopic(material_id=material_id, topic_id=topic_id))
        db.commit()
    elif not checked and existing:
        db.delete(existing)
        db.commit()

    return {"material_id": material_id, "topic_id": topic_id, "checked": checked}
