from datetime import datetime, timedelta

from app.exceptions.exceptions import UnauthorizedException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.refresh_session import RefreshSession

from app.schemas.auth import LoginRequest, RefreshRequest

from app.core.security import (
    verify_password,
    hash_token
)

from app.core.jwt import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    REFRESH_TOKEN_EXPIRE_DAYS
)


def login_user(
    request: LoginRequest,
    db: Session
):
    db_user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if not db_user:
        raise UnauthorizedException(
            "INVALID_CREDENTIALS",
            "Invalid email or password"
            )

    if not verify_password(
        request.password,
        db_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token({
        "user_id": db_user.id
    })

    refresh_token = create_refresh_token({
        "user_id": db_user.id
    })

    refresh_session = RefreshSession(
        user_id=db_user.id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.utcnow() + timedelta(
            days=REFRESH_TOKEN_EXPIRE_DAYS
        )
    )

    db.add(refresh_session)
    db.commit()

    return {
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_id": db_user.id,
        "name": db_user.name,
        "email": db_user.email
    }


def refresh_user_token(
    request: RefreshRequest,
    db: Session
):
    try:
        payload = verify_refresh_token(
            request.refresh_token
        )
    except Exception:
        raise UnauthorizedException(
            "INVALID_REFRESH_TOKEN",
            "Invalid or expired refresh token"
            )
    user_id = payload.get("user_id")

    if not user_id:
        raise UnauthorizedException(
            "INVALID_REFRESH_TOKEN",
            "Invalid refresh token"
            )

    token_hash = hash_token(
        request.refresh_token
    )

    session = (
        db.query(RefreshSession)
        .filter(
            RefreshSession.user_id == user_id,
            RefreshSession.token_hash == token_hash,
            RefreshSession.revoked_at.is_(None)
        )
        .first()
    )

    if not session:
        raise UnauthorizedException(
            "REFRESH_SESSION_INVALID",
            "Refresh session is invalid or revoked"
            )
    if session.expires_at < datetime.utcnow():
        raise UnauthorizedException(
             "REFRESH_SESSION_EXPIRED",
             "Refresh session has expired"
             )

    new_access_token = create_access_token({
        "user_id": user_id
    })

    new_refresh_token = create_refresh_token({
        "user_id": user_id
    })

    # Revoke old session
    session.revoked_at = datetime.utcnow()

    # Create new session
    new_session = RefreshSession(
        user_id=user_id,
        token_hash=hash_token(new_refresh_token),
        expires_at=datetime.utcnow() + timedelta(
            days=REFRESH_TOKEN_EXPIRE_DAYS
        ),
        last_used_at=datetime.utcnow()
    )

    db.add(new_session)
    db.commit()

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token
    }

def logout_user(
    request: RefreshRequest,
    db: Session
):
    token_hash = hash_token(request.refresh_token)

    session = (
        db.query(RefreshSession)
        .filter(
            RefreshSession.token_hash == token_hash,
            RefreshSession.revoked_at.is_(None)
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=401,
            detail="Invalid or already revoked refresh token"
        )

    session.revoked_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Logout successful"
    }
    