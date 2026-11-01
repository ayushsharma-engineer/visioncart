
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    CustomerRegisterRequest,
    EmailOTPRequest,
    EmailRequest,
    LoginRequest,
    PasswordResetRequest,
    RefreshRequest,
)
from app.schemas.common import APIResponse
from app.services.auth_service import (
    login_user,
    refresh_user_token,
    logout_user,
)
from app.core.security import hash_password
from fastapi import HTTPException
from app.schemas.auth import SellerRegisterRequest, DeliveryRegisterRequest
from app.models.seller_profile import SellerProfile
from app.models.delivery_partner import DeliveryPartner
from app.services.email_auth_service import (
    register_customer,
    request_password_reset,
    resend_verification,
    reset_password,
    verify_email,
)

router = APIRouter()


def create_pending_user(name, email, password, db):
    email = str(email).strip().lower()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=409,
            detail="Email is already registered",
        )

    user = User(
        name=name.strip(),
        email=email,
        password_hash=hash_password(password),
        role="customer",  # Overridden by each registration endpoint
    )
    db.add(user)
    db.flush()
    return user


@router.post("/seller/register")
def register_seller(
    request: SellerRegisterRequest,
    db: Session = Depends(get_db),
):
    try:
        user = create_pending_user(
            request.name,
            request.email,
            request.password,
            db,
        )
        user.role = "seller"

        profile = SellerProfile(
            user_id=user.id,
            store_name=request.store_name.strip(),
            status="pending",
        )
        db.add(profile)
        db.commit()
        db.refresh(user)

        return APIResponse(data={
            "message": "Seller application submitted. Approval is pending.",
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "status": "pending",
        })
    except Exception:
        db.rollback()
        raise


@router.post("/delivery/register")
def register_delivery_partner(
    request: DeliveryRegisterRequest,
    db: Session = Depends(get_db),
):
    try:
        user = create_pending_user(
            request.name,
            request.email,
            request.password,
            db,
        )
        user.role = "delivery"

        partner = DeliveryPartner(
            user_id=user.id,
            phone=request.phone.strip(),
            status="pending",
        )
        db.add(partner)
        db.commit()
        db.refresh(user)

        return APIResponse(data={
            "message": "Delivery application submitted. Approval is pending.",
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "status": "pending",
        })
    except Exception:
        db.rollback()
        raise


@router.post("/register")
def register_customer_account(
    request: CustomerRegisterRequest,
    db: Session = Depends(get_db),
):
    return APIResponse(data=register_customer(request, db))


@router.post("/verify-email")
def verify_customer_email(
    request: EmailOTPRequest,
    db: Session = Depends(get_db),
):
    return APIResponse(data=verify_email(str(request.email), request.otp, db))


@router.post("/resend-verification")
def resend_customer_verification(
    request: EmailRequest,
    db: Session = Depends(get_db),
):
    return APIResponse(data=resend_verification(str(request.email), db))


@router.post("/forgot-password")
def forgot_customer_password(
    request: EmailRequest,
    db: Session = Depends(get_db),
):
    return APIResponse(data=request_password_reset(str(request.email), db))


@router.post("/reset-password")
def reset_customer_password(
    request: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    return APIResponse(data=reset_password(request.token, request.password, db))


@router.post("/login")
def customer_login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    return APIResponse(data=login_user(request, db))


@router.post("/seller/login")
def seller_login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    return APIResponse(
        data=login_user(request, db, allowed_roles=("seller",))
    )


@router.post("/delivery/login")
def delivery_login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    return APIResponse(
        data=login_user(request, db, allowed_roles=("delivery",))
    )


@router.post("/refresh")
def refresh_token(
    request: RefreshRequest,
    db: Session = Depends(get_db),
):
    return APIResponse(data=refresh_user_token(request, db))


@router.post("/logout")
def logout(
    request: RefreshRequest,
    db: Session = Depends(get_db),
):
    return APIResponse(data=logout_user(request, db))
