"""UM MailSense API. Run locally with:  uvicorn app.main:app --reload   (from backend/)"""

import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.graph.mail_sync import run_scheduler
from app.routers import auth, emails

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    s = get_settings()
    if s.is_production and (s.secret_key.startswith("dev-only") or not s.encryption_key):
        raise RuntimeError("Set SECRET_KEY and ENCRYPTION_KEY before running in production")
    task = asyncio.create_task(run_scheduler()) if s.sync_enabled else None
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


@app.get("/api/v1/health", tags=["health"])
def health():
    return {"status": "ok"}
