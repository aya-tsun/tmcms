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

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "*"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.github\.io",
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


# Serve frontend static files (production build)
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/favicon.svg")
    def favicon():
        return FileResponse(os.path.join(FRONTEND_DIST, "favicon.svg"))

    # Catch-all: serve index.html for React Router (SPA)
    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        index = os.path.join(FRONTEND_DIST, "index.html")
        return FileResponse(index)
