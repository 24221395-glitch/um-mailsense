"""UM MailSense API. Owner: Raihan. Contract: docs/04-api-contract.md."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import admin, ads, auth, emails, health, profile

API_PREFIX = "/api/v1"

app = FastAPI(
    title="UM MailSense API",
    version="0.1.0",
    description="Siswamail organiser and recommender. Contract: docs/04-api-contract.md",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (health.router, auth.router, emails.router, ads.router, profile.router, admin.router):
    app.include_router(r, prefix=API_PREFIX)
