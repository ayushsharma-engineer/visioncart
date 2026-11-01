from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import secrets

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.email_auth import EmailVerificationChallenge, PasswordResetToken
from app.models.refresh_session import RefreshSession
from app.models.user import User
from app.schemas.auth import CustomerRegisterRequest
from app.services import email_service

OTP_LENGTH = 6
OTP_TTL = timedelta(minutes=5)
OTP_RESEND_COOLDOWN = timedelta(seconds=60)
OTP_SEND_WINDOW = timedelta(hours=1)
OTP_MAX_SENDS_PER_WINDOW = 5
OTP_MAX_ATTEMPTS = 5
RESET_TTL = timedelta(minutes=30)
RESET_RESEND_COOLDOWN = timedelta(seconds=60)
RESET_SEND_WINDOW = timedelta(hours=1)
RESET_MAX_SENDS_PER_WINDOW = 3


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _otp_digest(user_id: int, otp: str) -> str:
    key = settings.SECRET_KEY.encode("utf-8")
    value = f"email-verification:{user_id}:{otp}".encode("utf-8")
    return hmac.new(key, value, hashlib.sha256).hexdigest()


def _token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _remaining_seconds(until: datetime, now: datetime) -> int:
    return max(0, int((until - now).total_seconds()))


def _ensure_email_configured() -> None:
    try:
        email_service.require_email_configuration()
    except email_service.EmailConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def _send_otp(user: User, challenge: EmailVerificationChallenge, now: datetime) -> dict:
    otp = f"{secrets.randbelow(900_000) + 100_000:06d}"
    previous = (
        challenge.otp_hash,
        challenge.expires_at,
        challenge.last_sent_at,
        challenge.window_started_at,
        challenge.send_count,
        challenge.failed_attempts,
    )
    challenge.otp_hash = _otp_digest(user.id, otp)
    challenge.expires_at = now + OTP_TTL
    challenge.last_sent_at = now
    challenge.failed_attempts = 0
    try:
        email_service.send_verification_email(user.email, otp)
        return {
            "message": "Verification code sent. It expires in 5 minutes.",
            "email": user.email,
            "expires_in": int(OTP_TTL.total_seconds()),
            "resend_cooldown": int(OTP_RESEND_COOLDOWN.total_seconds()),
        }
    except email_service.EmailDeliveryError as exc:
        (
            challenge.otp_hash,
            challenge.expires_at,
            challenge.last_sent_at,
            challenge.window_started_at,
            challenge.send_count,
            challenge.failed_attempts,
        ) = previous
        raise HTTPException(
            status_code=503,
            detail="Verification email could not be sent. Please try again later.",
        ) from exc


def register_customer(request: CustomerRegisterRequest, db: Session) -> dict:
    _ensure_email_configured()
    now = utcnow()
    email = _normalize_email(str(request.email))
    user = db.query(User).filter(User.email == email).with_for_update().first()
    created_user = False

    if user:
        if user.role != "customer" or user.is_active or user.email_verified_at:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
    else:
        user = User(
            name=request.name.strip(),
            email=email,
            password_hash=hash_password(request.password),
            role="customer",
            is_active=False,
            email_verified_at=None,
        )
        db.add(user)
        db.flush()
        created_user = True

    # Save phone for new and pending unverified customer accounts.
    user.phone = request.phone.strip()

    challenge = (
        db.query(EmailVerificationChallenge)
        .filter(EmailVerificationChallenge.user_id == user.id)
        .with_for_update()
        .first()
    )
    if challenge:
        if now - challenge.window_started_at >= OTP_SEND_WINDOW:
            challenge.window_started_at = now
            challenge.send_count = 0
        cooldown = challenge.last_sent_at + OTP_RESEND_COOLDOWN - now
        if cooldown.total_seconds() > 0:
            db.commit()
            return {
                "message": "Enter the code already sent, or wait before requesting another.",
                "email": email,
                "expires_in": max(0, _remaining_seconds(challenge.expires_at, now)),
                "resend_cooldown": int(cooldown.total_seconds()),
            }
        if challenge.send_count >= OTP_MAX_SENDS_PER_WINDOW:
            retry_after = max(
                1,
                _remaining_seconds(challenge.window_started_at + OTP_SEND_WINDOW, now),
            )
            db.commit()
            return {
                "message": "The resend limit was reached. Enter your existing code or try again later.",
                "email": email,
                "expires_in": max(0, _remaining_seconds(challenge.expires_at, now)),
                "resend_cooldown": retry_after,
            }
        challenge.send_count += 1
    else:
        challenge = EmailVerificationChallenge(
            user_id=user.id,
            otp_hash="",
            expires_at=now,
            last_sent_at=now - OTP_RESEND_COOLDOWN,
            window_started_at=now,
            send_count=1,
            failed_attempts=0,
        )
        db.add(challenge)

    try:
        result = _send_otp(user, challenge, now)
        db.commit()
        return result
    except Exception:
        db.rollback()
        if created_user:
            persisted_user = db.query(User).filter(User.email == email).first()
            if persisted_user:
                db.delete(persisted_user)
                db.commit()
        raise


def resend_verification(email: str, db: Session) -> dict:
    _ensure_email_configured()
    now = utcnow()
    normalized_email = _normalize_email(email)
    user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .with_for_update()
        .first()
    )
    generic_result = {
        "message": "If an account is awaiting verification, a code will be sent when eligible.",
    }
    if not user or user.role != "customer" or user.is_active or user.email_verified_at:
        return generic_result

    challenge = (
        db.query(EmailVerificationChallenge)
        .filter(EmailVerificationChallenge.user_id == user.id)
        .with_for_update()
        .first()
    )
    if not challenge:
        challenge = EmailVerificationChallenge(
            user_id=user.id,
            otp_hash="",
            expires_at=now,
            last_sent_at=now - OTP_RESEND_COOLDOWN,
            window_started_at=now,
            send_count=0,
            failed_attempts=0,
        )
        db.add(challenge)
        db.flush()

    if now - challenge.window_started_at >= OTP_SEND_WINDOW:
        challenge.window_started_at = now
        challenge.send_count = 0

    cooldown = challenge.last_sent_at + OTP_RESEND_COOLDOWN - now
    if cooldown.total_seconds() > 0:
        db.commit()
        return {
            **generic_result,
            "resend_cooldown": int(cooldown.total_seconds()),
        }
    if challenge.send_count >= OTP_MAX_SENDS_PER_WINDOW:
        retry_after = max(
            1,
            _remaining_seconds(challenge.window_started_at + OTP_SEND_WINDOW, now),
        )
        raise HTTPException(
            status_code=429,
            detail="Too many verification requests. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    challenge.send_count += 1
    try:
        result = _send_otp(user, challenge, now)
        db.commit()
        return result
    except Exception:
        db.rollback()
        raise


def verify_email(email: str, otp: str, db: Session) -> dict:
    now = utcnow()
    normalized_email = _normalize_email(email)
    user = db.query(User).filter(User.email == normalized_email).with_for_update().first()
    if not user or user.role != "customer" or user.is_active or user.email_verified_at:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    challenge = (
        db.query(EmailVerificationChallenge)
        .filter(EmailVerificationChallenge.user_id == user.id)
        .with_for_update()
        .first()
    )
    if not challenge:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    if challenge.expires_at <= now or challenge.failed_attempts >= OTP_MAX_ATTEMPTS:
        db.delete(challenge)
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    if not hmac.compare_digest(challenge.otp_hash, _otp_digest(user.id, otp)):
        challenge.failed_attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    user.email_verified_at = now
    user.is_active = True
    db.delete(challenge)
    db.commit()
    return {
        "message": "Email verified. You can now sign in.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }


def request_password_reset(email: str, db: Session) -> dict:
    _ensure_email_configured()
    now = utcnow()
    normalized_email = _normalize_email(email)
    user = (
        db.query(User)
        .filter(
            User.email == normalized_email,
            User.is_active.is_(True),
            User.role == "customer",
        )
        .with_for_update()
        .first()
    )
    generic_message = (
        "If an eligible account exists, reset instructions will arrive if email delivery succeeds."
    )
    if not user:
        return {"message": generic_message}

    reset = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == user.id)
        .with_for_update()
        .first()
    )
    if reset:
        if now - reset.window_started_at >= RESET_SEND_WINDOW:
            reset.window_started_at = now
            reset.send_count = 0
        if reset.last_sent_at + RESET_RESEND_COOLDOWN > now:
            db.commit()
            return {"message": generic_message}
        if reset.send_count >= RESET_MAX_SENDS_PER_WINDOW:
            db.commit()
            return {"message": generic_message}

    token = secrets.token_urlsafe(32)
    if reset is None:
        reset = PasswordResetToken(
            user_id=user.id,
            token_hash=_token_digest(token),
            expires_at=now + RESET_TTL,
            last_sent_at=now,
            window_started_at=now,
            send_count=1,
        )
        db.add(reset)
    else:
        reset.token_hash = _token_digest(token)
        reset.expires_at = now + RESET_TTL
        reset.last_sent_at = now
        reset.send_count += 1

    try:
        email_service.send_password_reset_email(user.email, token)
        db.commit()
    except email_service.EmailDeliveryError:
        db.rollback()
        return {"message": generic_message}
    except Exception:
        db.rollback()
        raise

    return {"message": generic_message}


def reset_password(token: str, password: str, db: Session) -> dict:
    now = utcnow()
    token_hash = _token_digest(token)
    reset = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_hash)
        .with_for_update()
        .first()
    )
    if not reset or reset.expires_at <= now:
        if reset:
            db.delete(reset)
            db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired password reset link.")

    user = db.query(User).filter(User.id == reset.user_id).with_for_update().first()
    if not user or not user.is_active or user.role != "customer":
        db.delete(reset)
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired password reset link.")

    user.password_hash = hash_password(password)
    sessions = db.query(RefreshSession).filter(
    RefreshSession.user_id == user.id,
    RefreshSession.revoked_at.is_(None),
    ).all()
    for session in sessions:
        session.revoked_at = now
    db.delete(reset)
    db.commit()
    return {"message": "Password reset successfully. Please sign in with your new password."}
