from datetime import datetime, timedelta
from fastapi import HTTPException
from datetime import datetime, timedelta, timezone
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
from app.exceptions.exceptions import UnauthorizedException


def login_user(
    request: LoginRequest,
    db: Session,
    allowed_roles: tuple[str, ...] = ("customer",),
):
    email = request.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise UnauthorizedException(
            "INVALID_CREDENTIALS",
            "Invalid email or password",
        )

    if user.role == "customer" and not user.email_verified_at:
        raise UnauthorizedException(
            "EMAIL_NOT_VERIFIED",
            "Verify your email address before signing in",
        )

    if not user.is_active:
        raise UnauthorizedException(
            "ACCOUNT_DISABLED",
            "Account is disabled",
        )

    if user.role not in allowed_roles:
        raise UnauthorizedException(
            "PORTAL_ACCESS_DENIED",
            "This account cannot access this portal",
        )

    if user.role == "seller":
        from app.models.seller_profile import SellerProfile 

        profile = db.query(SellerProfile).filter(
            SellerProfile.user_id == user.id
        ).first()

        if not profile or profile.status != "approved":
            raise UnauthorizedException(
                "SELLER_NOT_APPROVED",
                "Seller account is not approved",
            )

    if user.role == "delivery":
        from app.models.delivery_partner import DeliveryPartner

        profile = db.query(DeliveryPartner).filter(
            DeliveryPartner.user_id == user.id
        ).first()

        if not profile or profile.status != "approved":
            raise UnauthorizedException(
                "DELIVERY_NOT_APPROVED",
                "Delivery partner is not approved",
            )

    access_token = create_access_token({"user_id": user.id})
    refresh_token = create_refresh_token({"user_id": user.id})

    session = RefreshSession(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.utcnow()
        + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )

    db.add(session)
    db.commit()

    return {
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }



def refresh_user_token(
    request: RefreshRequest,
    db: Session,
):
    try:
        payload = verify_refresh_token(request.refresh_token)
    except Exception:
        raise UnauthorizedException(
            "INVALID_REFRESH_TOKEN",
            "Invalid or expired refresh token",
        )

    user_id = payload.get("user_id")
    if not user_id:
        raise UnauthorizedException(
            "INVALID_REFRESH_TOKEN",
            "Invalid refresh token",
        )

    token_hash = hash_token(request.refresh_token)

    # Lock the refresh session to reduce concurrent token rotation races.
    session = (
        db.query(RefreshSession)
        .filter(
            RefreshSession.user_id == user_id,
            RefreshSession.token_hash == token_hash,
            RefreshSession.revoked_at.is_(None),
        )
        .with_for_update()
        .first()
    )

    if not session:
        raise UnauthorizedException(
            "REFRESH_SESSION_INVALID",
            "Refresh session is invalid or revoked",
        )

    now = datetime.utcnow()

    if session.expires_at <= now:
        raise UnauthorizedException(
            "REFRESH_SESSION_EXPIRED",
            "Refresh session has expired",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        raise UnauthorizedException(
            "ACCOUNT_DISABLED",
            "Account is unavailable",
        )

    # Re-check seller/delivery eligibility on every refresh.
    if user.role == "seller":
        from app.models.seller_profile import SellerProfile

        profile = (
            db.query(SellerProfile)
            .filter(SellerProfile.user_id == user.id)
            .first()
        )

        if not profile or profile.status != "approved":
            raise UnauthorizedException(
                "SELLER_NOT_APPROVED",
                "Seller account is not approved",
            )

    elif user.role == "delivery":
        from app.models.delivery_partner import DeliveryPartner

        profile = (
            db.query(DeliveryPartner)
            .filter(DeliveryPartner.user_id == user.id)
            .first()
        )

        if not profile or profile.status != "approved":
            raise UnauthorizedException(
                "DELIVERY_NOT_APPROVED",
                "Delivery partner is not approved",
            )

    # Rotate tokens within one database transaction.
    try:
        new_access_token = create_access_token(
            {"user_id": user.id}
        )
        new_refresh_token = create_refresh_token(
            {"user_id": user.id}
        )

        session.revoked_at = now
        session.last_used_at = now

        new_session = RefreshSession(
            user_id=user.id,
            token_hash=hash_token(new_refresh_token),
            expires_at=now + timedelta(
                days=REFRESH_TOKEN_EXPIRE_DAYS
            ),
        )

        db.add(new_session)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
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
    