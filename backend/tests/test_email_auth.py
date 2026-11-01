from datetime import timedelta
import re

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import verify_password
from app.db.base import Base
from app.models.email_auth import EmailVerificationChallenge, PasswordResetToken
from app.models.refresh_session import RefreshSession
from app.models.user import User
from app.schemas.auth import CustomerRegisterRequest, LoginRequest
from app.exceptions.exceptions import UnauthorizedException
from app.services import email_auth_service as auth_service
from app.services import email_service
from app.services.auth_service import login_user


@pytest.fixture

def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [
        User.__table__,
        EmailVerificationChallenge.__table__,
        PasswordResetToken.__table__,
        RefreshSession.__table__,
    ]
    Base.metadata.create_all(engine, tables=tables)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine, tables=tables)
        engine.dispose()


@pytest.fixture

def smtp_config(monkeypatch):
    values = {
        "SMTP_HOST": "smtp.example.test",
        "SMTP_PORT": "587",
        "SMTP_USERNAME": "sender@example.test",
        "SMTP_PASSWORD": "test-only-password",
        "SMTP_FROM_EMAIL": "sender@example.test",
        "FRONTEND_URL": "http://localhost:3000",
    }
    for key, value in values.items():
        monkeypatch.setenv(key, value)


def create_registration():
    return CustomerRegisterRequest(
        name="Example Customer",
        email="customer@example.com",
        password="correct-horse-battery",
    )


def capture_verification(monkeypatch):
    messages = []

    def send(email, otp):
        messages.append((email, otp))

    monkeypatch.setattr(email_service, "send_verification_email", send)
    return messages


def test_registration_stays_pending_and_verification_activates_user(
    db_session, monkeypatch, smtp_config
):
    messages = capture_verification(monkeypatch)
    result = auth_service.register_customer(create_registration(), db_session)

    user = db_session.query(User).one()
    challenge = db_session.query(EmailVerificationChallenge).one()
    assert result["email"] == user.email
    assert "otp" not in result
    assert "password" not in result
    assert user.is_active is False
    assert user.email_verified_at is None
    assert challenge.otp_hash != messages[0][1]
    assert re.fullmatch(r"\d{6}", messages[0][1])

    verified = auth_service.verify_email(user.email, messages[0][1], db_session)
    assert verified["message"] == "Email verified. You can now sign in."
    assert user.is_active is True
    assert user.email_verified_at is not None
    assert db_session.query(EmailVerificationChallenge).count() == 0


def test_wrong_otp_is_rejected_and_attempts_are_limited(
    db_session, monkeypatch, smtp_config
):
    messages = capture_verification(monkeypatch)
    auth_service.register_customer(create_registration(), db_session)
    email = "customer@example.com"
    wrong_otp = "000000" if messages[0][1] != "000000" else "000001"

    for _ in range(auth_service.OTP_MAX_ATTEMPTS):
        with pytest.raises(HTTPException) as error:
            auth_service.verify_email(email, wrong_otp, db_session)
        assert error.value.detail == "Invalid or expired verification code."

    with pytest.raises(HTTPException) as error:
        auth_service.verify_email(email, messages[0][1], db_session)
    assert error.value.detail == "Invalid or expired verification code."
    assert db_session.query(User).one().is_active is False


def test_expired_otp_is_rejected(db_session, monkeypatch, smtp_config):
    messages = capture_verification(monkeypatch)
    auth_service.register_customer(create_registration(), db_session)
    challenge = db_session.query(EmailVerificationChallenge).one()
    challenge.expires_at = auth_service.utcnow() - timedelta(seconds=1)
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        auth_service.verify_email("customer@example.com", messages[0][1], db_session)
    assert error.value.detail == "Invalid or expired verification code."
    assert db_session.query(User).one().is_active is False


def test_resend_cooldown_and_hourly_limit(db_session, monkeypatch, smtp_config):
    messages = capture_verification(monkeypatch)
    auth_service.register_customer(create_registration(), db_session)
    email = "customer@example.com"

    cooldown = auth_service.resend_verification(email, db_session)
    assert cooldown["resend_cooldown"] > 0
    assert len(messages) == 1

    fixed_now = auth_service.utcnow()
    monkeypatch.setattr(auth_service, "utcnow", lambda: fixed_now)
    challenge = db_session.query(EmailVerificationChallenge).one()
    challenge.last_sent_at = fixed_now - auth_service.OTP_RESEND_COOLDOWN - timedelta(seconds=1)
    db_session.commit()

    for _ in range(auth_service.OTP_MAX_SENDS_PER_WINDOW - 1):
        auth_service.resend_verification(email, db_session)
        challenge.last_sent_at = fixed_now - auth_service.OTP_RESEND_COOLDOWN - timedelta(seconds=1)
        db_session.commit()

    with pytest.raises(HTTPException) as error:
        auth_service.resend_verification(email, db_session)
    assert error.value.status_code == 429
    assert int(error.value.headers["Retry-After"]) > 0


def test_forgot_password_is_generic_and_reset_token_is_hashed(
    db_session, monkeypatch, smtp_config
):
    sent = []
    monkeypatch.setattr(
        email_service,
        "send_password_reset_email",
        lambda email, token: sent.append((email, token)),
    )
    missing = auth_service.request_password_reset("missing@example.com", db_session)

    user = User(
        name="Example Customer",
        email="customer@example.com",
        password_hash=auth_service.hash_password("old-password-value"),
        role="customer",
        is_active=True,
        email_verified_at=auth_service.utcnow(),
    )
    db_session.add(user)
    db_session.commit()
    existing = auth_service.request_password_reset(user.email, db_session)

    assert missing == existing
    assert len(sent) == 1
    reset = db_session.query(PasswordResetToken).one()
    assert reset.token_hash != sent[0][1]
    assert sent[0][1] not in existing["message"]


def test_reset_token_expiry_and_single_use(db_session, monkeypatch, smtp_config):
    user = User(
        name="Example Customer",
        email="customer@example.com",
        password_hash=auth_service.hash_password("old-password-value"),
        role="customer",
        is_active=True,
        email_verified_at=auth_service.utcnow(),
    )
    db_session.add(user)
    db_session.flush()

    raw_token = "r" * 48
    reset = PasswordResetToken(
        user_id=user.id,
        token_hash=auth_service._token_digest(raw_token),
        expires_at=auth_service.utcnow() + auth_service.RESET_TTL,
        last_sent_at=auth_service.utcnow(),
        window_started_at=auth_service.utcnow(),
        send_count=1,
    )
    session = RefreshSession(
        user_id=user.id,
        token_hash="existing-session-token-hash",
        expires_at=auth_service.utcnow() + timedelta(days=1),
    )
    db_session.add_all([reset, session])
    db_session.commit()

    response = auth_service.reset_password(raw_token, "new-password-value", db_session)
    assert "successfully" in response["message"]
    assert verify_password("new-password-value", user.password_hash)
    assert session.revoked_at is not None
    assert db_session.query(PasswordResetToken).count() == 0

    with pytest.raises(HTTPException) as error:
        auth_service.reset_password(raw_token, "another-password-value", db_session)
    assert error.value.detail == "Invalid or expired password reset link."


def test_expired_reset_token_is_rejected(db_session, smtp_config):
    user = User(
        name="Example Customer",
        email="customer@example.com",
        password_hash=auth_service.hash_password("old-password-value"),
        role="customer",
        is_active=True,
        email_verified_at=auth_service.utcnow(),
    )
    db_session.add(user)
    db_session.flush()
    token = "x" * 48
    db_session.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=auth_service._token_digest(token),
            expires_at=auth_service.utcnow() - timedelta(seconds=1),
            last_sent_at=auth_service.utcnow(),
            window_started_at=auth_service.utcnow(),
            send_count=1,
        )
    )
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        auth_service.reset_password(token, "new-password-value", db_session)
    assert error.value.detail == "Invalid or expired password reset link."
    assert not verify_password("new-password-value", user.password_hash)


def test_missing_smtp_configuration_fails_before_customer_creation(db_session, monkeypatch):
    for key in (
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USERNAME",
        "SMTP_PASSWORD",
        "SMTP_FROM_EMAIL",
        "FRONTEND_URL",
    ):
        monkeypatch.delenv(key, raising=False)

    with pytest.raises(HTTPException) as error:
        auth_service.register_customer(create_registration(), db_session)
    assert error.value.status_code == 503
    assert db_session.query(User).count() == 0


def test_registration_conflict_does_not_replace_active_user(
    db_session, monkeypatch, smtp_config
):
    user = User(
        name="Existing Customer",
        email="customer@example.com",
        password_hash=auth_service.hash_password("existing-password-value"),
        role="customer",
        is_active=True,
        email_verified_at=auth_service.utcnow(),
    )
    db_session.add(user)
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        auth_service.register_customer(create_registration(), db_session)
    assert error.value.status_code == 409
    assert db_session.query(User).count() == 1


def test_customer_cannot_login_before_email_verification(db_session):
    user = User(
        name="Pending Customer",
        email="customer@example.com",
        password_hash=auth_service.hash_password("correct-horse-battery"),
        role="customer",
        is_active=False,
        email_verified_at=None,
    )
    db_session.add(user)
    db_session.commit()

    with pytest.raises(UnauthorizedException) as error:
        login_user(
            LoginRequest(email=user.email, password="correct-horse-battery"),
            db_session,
        )
    assert error.value.code == "EMAIL_NOT_VERIFIED"
