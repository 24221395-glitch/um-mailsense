"""Scheduled jobs called by Vercel Cron (see vercel.json). Protected by CRON_SECRET."""

import secrets

from fastapi import APIRouter, Header, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from app.core.config import get_settings
from app.graph.mail_sync import sync_everyone

router = APIRouter(prefix="/api/v1/cron", tags=["cron"])

TIME_BUDGET_S = 240  # stay under the 300 s function limit


@router.get("/sync")
async def cron_sync(authorization: str = Header("")):
    """Daily catch-up: sync and sort mail for every user (oldest sync first)."""
    secret = get_settings().cron_secret
    if not secret:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    if not secrets.compare_digest(authorization, f"Bearer {secret}"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Bad cron secret")
    return await run_in_threadpool(sync_everyone, TIME_BUDGET_S)
