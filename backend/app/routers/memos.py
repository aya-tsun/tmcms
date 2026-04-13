from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.material import Material
from ..models.memo import Memo
from ..schemas.memo import MemoCreate, MemoUpdate, MemoOut
from ..auth.jwt import get_current_user

router = APIRouter(tags=["memos"])


def _memo_out(m: Memo) -> MemoOut:
    return MemoOut(
        id=m.id,
        material_id=m.material_id,
        user_id=m.user_id,
        user_name=m.user.name if m.user else None,
        content=m.content,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


@router.get("/api/materials/{material_id}/memos", response_model=List[MemoOut])
def list_memos(
    material_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="教材が見つかりません")
    memos = db.query(Memo).filter(Memo.material_id == material_id).order_by(Memo.created_at.desc()).all()
    return [_memo_out(m) for m in memos]


@router.post("/api/materials/{material_id}/memos", response_model=MemoOut, status_code=status.HTTP_201_CREATED)
def create_memo(
    material_id: int,
    data: MemoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="教材が見つかりません")
    memo = Memo(
        material_id=material_id,
        user_id=current_user.id,
        content=data.content,
    )
    db.add(memo)
    db.commit()
    db.refresh(memo)
    return _memo_out(memo)


@router.put("/api/materials/{material_id}/memos/{memo_id}", response_model=MemoOut)
def update_memo(
    material_id: int,
    memo_id: int,
    data: MemoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memo = db.query(Memo).filter(Memo.id == memo_id, Memo.material_id == material_id).first()
    if not memo:
        raise HTTPException(status_code=404, detail="メモが見つかりません")
    if memo.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="自分が作成したメモのみ編集できます")
    memo.content = data.content
    db.commit()
    db.refresh(memo)
    return _memo_out(memo)


@router.delete("/api/materials/{material_id}/memos/{memo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memo(
    material_id: int,
    memo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memo = db.query(Memo).filter(Memo.id == memo_id, Memo.material_id == material_id).first()
    if not memo:
        raise HTTPException(status_code=404, detail="メモが見つかりません")
    if memo.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="自分が作成したメモのみ削除できます")
    db.delete(memo)
    db.commit()
