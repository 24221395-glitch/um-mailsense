"""UM MailSense API. Run locally with:  uvicorn app.main:app --reload   (from backend/)"""

import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.graph.mail_sync import run_scheduler
from app.routers import admin, ads, auth, calendar, cron, emails, organisations, profile
from app.services import ai_bridge

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
def check_settings() -> None:
    """Refuse to run with unsafe production settings."""
    s = get_settings()
    if s.is_production and (s.secret_key.startswith("dev-only") or not s.encryption_key):
        raise RuntimeError("Set SECRET_KEY and ENCRYPTION_KEY before running in production")
    if s.is_production and s.demo_mode:
        raise RuntimeError("DEMO_MODE must be off in production")
    if s.is_production and s.database_url.startswith("sqlite"):
        raise RuntimeError("Use PostgreSQL (DATABASE_URL) in production, not SQLite")


async def lifespan(_app: FastAPI):
    check_settings()
    s = get_settings()
    ai_bridge.configure()
    # No background timer on serverless hosting: the daily cron + inbox visits do the work
    run_loop = s.sync_enabled and not s.is_serverless
    task = asyncio.create_task(run_scheduler()) if run_loop else None
    yield
    if task:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


app = FastAPI(title="UM MailSense API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(emails.router)
app.include_router(profile.router)
app.include_router(organisations.router)
app.include_router(ads.router)
app.include_router(admin.router)
app.include_router(calendar.router)
app.include_router(cron.router)


@app.get("/api/v1/health", tags=["health"])
def health():
    return {"status": "ok"}
