# VisionCartAI

## Email Verification and Password Reset

Customer registration creates an inactive account and sends a six-digit verification code to the supplied email address. The code expires after five minutes. Customers must verify the address before login succeeds. Seller and delivery registration continue to use their existing approval flows.

Password recovery starts at `/forgot-password`. Reset links are single-use and expire after 30 minutes. The API returns a generic forgot-password response to avoid confirming whether an email belongs to an account.

### Configure email delivery

1. Copy `.env.example` to `.env` in the repository root.
2. Set `DATABASE_URL` and `SECRET_KEY` (at least 32 random characters). The application reads `SECRET_KEY`; do not use `JWT_SECRET`.
3. Configure all SMTP settings in `.env`:

	- `SMTP_HOST`: provider SMTP hostname, for Gmail use `smtp.gmail.com`.
	- `SMTP_PORT`: `587` for STARTTLS or `465` for implicit TLS.
	- `SMTP_USERNAME`: SMTP account username, usually the full sender email.
	- `SMTP_PASSWORD`: SMTP password or provider app password. For Gmail, use a Google app password; never use or commit your account password.
	- `SMTP_FROM_EMAIL`: verified sender address.
	- `FRONTEND_URL`: public frontend origin, such as `http://localhost:3000` for development. FastAPI adds this exact origin to its CORS allowlist.

4. Install backend dependencies from `backend` with `pip install -r requirement.txt`.
5. Apply the schema with `alembic upgrade head` from `backend`.
6. Restart the FastAPI application and frontend after changing environment variables.

When required SMTP settings are absent, registration and reset requests return a clear service-unavailable error; the application does not return an OTP/reset token or claim an email was sent. SMTP transport is implemented with Python's standard library and can be adapted later without changing the authentication API.

### Auth API

- `POST /api/auth/register` creates a pending customer and emails a verification code.
- `POST /api/auth/verify-email` accepts `{ "email": "...", "otp": "123456" }` and activates the customer.
- `POST /api/auth/resend-verification` accepts `{ "email": "..." }`; resend is limited to one per minute and five per hour.
- `POST /api/auth/forgot-password` accepts `{ "email": "..." }` and sends a reset link when eligible.
- `POST /api/auth/reset-password` accepts `{ "token": "...", "password": "..." }`.

For tests, install `backend/requirement-dev.txt` and run `pytest` from `backend`.
