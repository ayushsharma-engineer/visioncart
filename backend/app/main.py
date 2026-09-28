from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User

from app.schemas.user import UserCreate

from app.core.security import hash_password ,hash_token
from fastapi import HTTPException
from app.schemas.auth import LoginRequest,RefreshRequest
from app.core.security import verify_password

from app.core.jwt import create_access_token,verify_access_token

from app.core.jwt import create_access_token, create_refresh_token, verify_refresh_token,REFRESH_TOKEN_EXPIRE_DAYS
from app.core.security import hash_token
from app.models.refresh_session import RefreshSession

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from datetime import datetime, timedelta


app = FastAPI(title="VisionCart API")


@app.get("/")
def root():
    return {"message": "VisionCart API is running"}


@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        }
        for user in users
    ]

@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    new_user = User(
        name = user.name,
        email = user.email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id" : new_user.id,
        "name": new_user.name,
        "email": new_user.email
    }

@app.post("/login")
def login(user : LoginRequest, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(user.password,db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token({
    "user_id": db_user.id
})
    refresh_token = create_refresh_token({
        "user_id": db_user.id
    })

    refresh_expires_at = datetime.utcnow() + timedelta(
    days=REFRESH_TOKEN_EXPIRE_DAYS
)
    refresh_session = RefreshSession(
        user_id=db_user.id,
        token_hash=hash_token(refresh_token),
         expires_at=refresh_expires_at
    )
    db.add(refresh_session)
    db.commit()

    return{
        "message":"Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_id":db_user.id,
        "name":db_user.name,
        "email":db_user.email
    }

security = HTTPBearer()
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = verify_access_token(token)
        return payload
    except Exception as e:
        print("JWT ERROR:", e)
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

@app.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "message": "You are authenticated",
        "user_id": current_user["user_id"]
    }

@app.post("/refresh")
def refresh_token(
    request: RefreshRequest,
    db: Session = Depends(get_db)
):
    try:
        payload = verify_refresh_token(request.refresh_token)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token"
        )

    user_id = payload.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )

    token_hash = hash_token(request.refresh_token)

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
        raise HTTPException(
            status_code=401,
            detail="Refresh session is invalid or revoked"
        )

    if session.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=401,
            detail="Refresh session has expired"
        )

    # Create new tokens
    new_access_token = create_access_token({
        "user_id": user_id
    })

    new_refresh_token = create_refresh_token({
        "user_id": user_id
    })

    # Revoke old refresh session
    session.revoked_at = datetime.utcnow()

    # Create new refresh session
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