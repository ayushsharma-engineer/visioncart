import os

from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.common import APIResponse

from app.core.jwt import verify_access_token

from app.api.auth import router as auth_router

from app.exceptions.exceptions import AppException
from app.exceptions.handlers import app_exception_handler
from app.api.products import router as products_router
from app.api.address import router as address_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.orders import router as orders_router
from app.api.account import router as account_router

app = FastAPI(title="VisionCart API")
frontend_origin = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
allowed_origins = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
}
if frontend_origin and frontend_origin != "*":
    allowed_origins.add(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.include_router(
    orders_router,
    prefix="/api/orders",
    tags=["Orders and Payments"],
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
def create_user():
    raise HTTPException(
        status_code=410,
        detail="Direct user creation is disabled. Use /api/auth/register to verify an email address.",
    )



from app.core.dependencies import get_current_user

@app.get("/profile")
def get_profile(
    current_user: User = Depends(get_current_user),
):
    return APIResponse(
        data={
            "message": "You are authenticated",
            "user_id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "phone": current_user.phone,
            "role": current_user.role,
        }
    )


app.include_router(address_router, prefix="/api/addresses", tags=["Addresses"])
app.include_router(account_router, prefix="/api/account", tags=["Customer Account"])
