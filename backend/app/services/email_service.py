import os
import smtplib
import ssl
from email.message import EmailMessage
from urllib.parse import quote


class EmailConfigurationError(RuntimeError):
    pass


class EmailDeliveryError(RuntimeError):
    pass


def _get_smtp_settings() -> tuple[str, int, str, str, str, str]:
    required = (
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USERNAME",
        "SMTP_PASSWORD",
        "SMTP_FROM_EMAIL",
        "FRONTEND_URL",
    )
    missing = [key for key in required if not os.getenv(key)]
    if missing:
        names = ", ".join(missing)
        raise EmailConfigurationError(
            f"Email delivery is not configured. Set: {names}."
        )

    try:
        port = int(os.environ["SMTP_PORT"])
    except ValueError as exc:
        raise EmailConfigurationError("SMTP_PORT must be a valid port number.") from exc

    if not 1 <= port <= 65535:
        raise EmailConfigurationError("SMTP_PORT must be between 1 and 65535.")

    return (
        os.environ["SMTP_HOST"],
        port,
        os.environ["SMTP_USERNAME"],
        os.environ["SMTP_PASSWORD"],
        os.environ["SMTP_FROM_EMAIL"],
        os.environ["FRONTEND_URL"].rstrip("/"),
    )


def require_email_configuration() -> None:
    _get_smtp_settings()


def send_email(recipient: str, subject: str, body: str) -> None:
    host, port, username, password, sender, _ = _get_smtp_settings()
    message = EmailMessage()
    message["From"] = sender
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)

    try:
        context = ssl.create_default_context()
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=10, context=context) as server:
                server.login(username, password)
                server.send_message(message)
        else:
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(username, password)
                server.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise EmailDeliveryError(
            "Email could not be sent. Check SMTP settings and try again."
        ) from exc


def send_verification_email(recipient: str, otp: str) -> None:
    send_email(
        recipient,
        "Verify your VisionCartAI account",
        "Use this verification code to finish creating your account: "
        f"{otp}\n\nThis code expires in 5 minutes. If you did not request it, "
        "you can ignore this email.",
    )


def send_password_reset_email(recipient: str, token: str) -> None:
    _, _, _, _, _, frontend_url = _get_smtp_settings()
    reset_url = f"{frontend_url}/reset-password?token={quote(token, safe='')}"
    send_email(
        recipient,
        "Reset your VisionCartAI password",
        "Use this link to reset your password:\n\n"
        f"{reset_url}\n\nThis link expires in 30 minutes and can only be used once. "
        "If you did not request a reset, you can ignore this email.",
    )
