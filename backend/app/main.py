from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User

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