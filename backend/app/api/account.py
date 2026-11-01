from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import hash_password, verify_password
from app.db.session import get_db
from app.models.refresh_session import RefreshSession
from app.models.user import User
from app.schemas.account import ChangePasswordRequest, ProfileUpdateRequest
from app.schemas.common import APIResponse

router = APIRouter()


def require_customer(user: User):
    if user.role != "customer":
        raise HTTPException(status_code=403, detail="Customer account required")


@router.patch("/profile")
def update_profile(request: ProfileUpdateRequest, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    require_customer(current_user)
    values = request.model_dump(exclude_unset=True)
    if values.get("name") is not None:
        current_user.name = values["name"].strip()
    if values.get("phone") is not None:
        current_user.phone = values["phone"].strip()
    try:
        db.commit()
        db.refresh(current_user)
    except Exception:
        db.rollback()
        raise
    return APIResponse(data={"message": "Profile updated successfully",
        "user_id": current_user.id, "name": current_user.name,
        "email": current_user.email, "phone": current_user.phone})


@router.post("/change-password")
def change_password(request: ChangePasswordRequest, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    require_customer(current_user)
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if request.current_password == request.new_password:
        raise HTTPException(status_code=422, detail="New password must be different")
    now = datetime.utcnow()
    try:
        current_user.password_hash = hash_password(request.new_password)
        db.query(RefreshSession).filter(
            RefreshSession.user_id == current_user.id,
            RefreshSession.revoked_at.is_(None),
        ).update({"revoked_at": now}, synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return APIResponse(data={"message": "Password changed. Please sign in again on all devices."})


@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    require_customer(current_user)
    now = datetime.utcnow()
    sessions = db.query(RefreshSession).filter(
        RefreshSession.user_id == current_user.id,
        RefreshSession.revoked_at.is_(None),
        RefreshSession.expires_at > now,
    ).order_by(RefreshSession.created_at.desc()).all()
    return APIResponse(data=[{
        "id": s.id, "created_at": s.created_at,
        "last_used_at": s.last_used_at, "expires_at": s.expires_at,
    } for s in sessions])


@router.delete("/sessions/{session_id}")
def revoke_session(session_id: int, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    require_customer(current_user)
    session = db.query(RefreshSession).filter(
        RefreshSession.id == session_id,
        RefreshSession.user_id == current_user.id,
        RefreshSession.revoked_at.is_(None),
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")
    session.revoked_at = datetime.utcnow()
    db.commit()
    return APIResponse(data={"message": "Session revoked successfully"})


@router.post("/sessions/revoke-all")
def revoke_all_sessions(db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    require_customer(current_user)
    db.query(RefreshSession).filter(
        RefreshSession.user_id == current_user.id,
        RefreshSession.revoked_at.is_(None),
    ).update({"revoked_at": datetime.utcnow()}, synchronize_session=False)
    db.commit()
    return APIResponse(data={"message": "All sessions revoked. Sign in again."})
