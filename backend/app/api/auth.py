from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import LoginRequest, RefreshRequest
from app.services.auth_service import (
    login_user,
    logout_user,
    refresh_user_token
)


router = APIRouter()


@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    return login_user(request, db)


@router.post("/refresh")
def refresh_token(
    request: RefreshRequest,
    db: Session = Depends(get_db)
):
    return refresh_user_token(request, db)

@router.post("/logout")
def logout(
    request: RefreshRequest,
    db: Session = Depends(get_db)
):
    return logout_user(request, db)