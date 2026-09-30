from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import LoginRequest, RefreshRequest
from app.schemas.common import APIResponse

from app.services.auth_service import (
    login_user,
    refresh_user_token,
    logout_user
)


router = APIRouter()


@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    result = login_user(request, db)

    return APIResponse(
        data=result
    )


@router.post("/refresh")
def refresh_token(
    request: RefreshRequest,
    db: Session = Depends(get_db)
):
    result = refresh_user_token(request, db)

    return APIResponse(
        data=result
    )


@router.post("/logout")
def logout(
    request: RefreshRequest,
    db: Session = Depends(get_db)
):
    result = logout_user(request, db)

    return APIResponse(
        data=result
    )