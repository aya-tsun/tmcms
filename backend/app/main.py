from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from .database import engine, Base
from .models import User, Material, Tag, MaterialTag, Evaluation, CustomEvaluationAxis, Memo
from .routers import auth, users, materials, tags, evaluations, memos, export
from .auth.jwt import hash_password
from .database import SessionLocal
from .models.user import UserRole

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TMCMS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(materials.router)
app.include_router(tags.router)
app.include_router(evaluations.router)
app.include_router(memos.router)
app.include_router(export.router)


def create_initial_admin():
    """Create initial admin user if no users exist."""
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            admin = User(
                name="管理者",
                email="admin@example.com",
                hashed_password=hash_password("admin1234"),
                role=UserRole.admin,
            )
            db.add(admin)
            db.commit()
            print("Initial admin created: admin@example.com / admin1234")
    finally:
        db.close()


create_initial_admin()


@app.get("/api/health")
def health():
    return {"status": "ok"}
