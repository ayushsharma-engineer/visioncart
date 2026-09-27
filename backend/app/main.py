from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User

from app.schemas.user import UserCreate

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
        password_hash = user.password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id" : new_user.id,
        "name": new_user.name,
        "email": new_user.email
    }