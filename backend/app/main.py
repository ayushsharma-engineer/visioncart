from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate
from app.schemas.common import APIResponse

from app.core.security import hash_password
from app.core.jwt import verify_access_token

from app.api.auth import router as auth_router

from app.exceptions.exceptions import AppException
from app.exceptions.handlers import app_exception_handler
from app.api.products import router as products_router


app = FastAPI(title="VisionCart API")


# Global exception handler
app.add_exception_handler(
    AppException,
    app_exception_handler
)


# Authentication routes
app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"],

)
app.include_router(
    products_router,
    prefix="/api/v1/products",
    tags=["Products"],
)

@app.get("/")
def root():
    return APIResponse(
        data={
            "message": "VisionCart API is running"
        }
    )


@app.get("/users")
def get_users(
    db: Session = Depends(get_db)
):
    users = db.query(User).all()

    return APIResponse(
        data=[
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
            }
            for user in users
        ]
    )


@app.post("/users")
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return APIResponse(
        data={
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email
        }
    )


# JWT authentication
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = verify_access_token(token)
        return payload

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


@app.get("/profile")
def get_profile(
    current_user: dict = Depends(get_current_user)
):
    return APIResponse(
        data={
            "message": "You are authenticated",
            "user_id": current_user["user_id"]
        }
    )