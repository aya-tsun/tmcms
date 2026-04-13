from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.material import Material
from ..models.evaluation import Evaluation, CustomEvaluationAxis
from ..schemas.evaluation import (
    EvaluationCreate, EvaluationUpdate, EvaluationOut,
    CustomAxisCreate, CustomAxisOut,
)
from ..auth.jwt import get_current_user, require_admin

router = APIRouter(tags=["evaluations"])


def _eval_out(e: Evaluation, db: Session) -> EvaluationOut:
    user_name = e.user.name if e.user else None
    return EvaluationOut(
        id=e.id,
        material_id=e.material_id,
        user_id=e.user_id,
        user_name=user_name,
        overall_score=e.overall_score,
        quality=e.quality,
        clarity=e.clarity,
        cost_effectiveness=e.cost_effectiveness,
        custom_scores=e.custom_scores,
        created_at=e.created_at,
        updated_at=e.updated_at,
    )


@router.get("/api/materials/{material_id}/evaluations", response_model=List[EvaluationOut])
def list_evaluations(
    material_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="教材が見つかりません")
    evals = db.query(Evaluation).filter(Evaluation.material_id == material_id).all()
    return [_eval_out(e, db) for e in evals]


@router.post("/api/materials/{material_id}/evaluations", response_model=EvaluationOut, status_code=status.HTTP_201_CREATED)
def upsert_evaluation(
    material_id: int,
    data: EvaluationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="教材が見つかりません")

    existing = db.query(Evaluation).filter(
        Evaluation.material_id == material_id,
        Evaluation.user_id == current_user.id,
    ).first()

    if existing:
        existing.overall_score = data.overall_score
        existing.quality = data.quality
        existing.clarity = data.clarity
        existing.cost_effectiveness = data.cost_effectiveness
        existing.custom_scores = data.custom_scores
        db.commit()
        db.refresh(existing)
        return _eval_out(existing, db)
    else:
        evaluation = Evaluation(
            material_id=material_id,
            user_id=current_user.id,
            overall_score=data.overall_score,
            quality=data.quality,
            clarity=data.clarity,
            cost_effectiveness=data.cost_effectiveness,
            custom_scores=data.custom_scores,
        )
        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)
        return _eval_out(evaluation, db)


@router.delete("/api/materials/{material_id}/evaluations/{eval_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_evaluation(
    material_id: int,
    eval_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    evaluation = db.query(Evaluation).filter(
        Evaluation.id == eval_id,
        Evaluation.material_id == material_id,
    ).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="評価が見つかりません")
    if evaluation.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="権限がありません")
    db.delete(evaluation)
    db.commit()


# Custom evaluation axes
@router.get("/api/settings/axes", response_model=List[CustomAxisOut])
def list_axes(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(CustomEvaluationAxis).order_by(CustomEvaluationAxis.order).all()


@router.post("/api/settings/axes", response_model=CustomAxisOut, status_code=status.HTTP_201_CREATED)
def create_axis(
    data: CustomAxisCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    count = db.query(CustomEvaluationAxis).count()
    if count >= 3:
        raise HTTPException(status_code=400, detail="カスタム評価軸は最大3つまでです")
    axis = CustomEvaluationAxis(name=data.name, order=data.order)
    db.add(axis)
    db.commit()
    db.refresh(axis)
    return axis


@router.delete("/api/settings/axes/{axis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_axis(
    axis_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    axis = db.query(CustomEvaluationAxis).filter(CustomEvaluationAxis.id == axis_id).first()
    if not axis:
        raise HTTPException(status_code=404, detail="評価軸が見つかりません")
    db.delete(axis)
    db.commit()
