"""Run work after a response — or not, on serverless hosting.

On a normal server, FastAPI background tasks run after the response is sent. On Vercel the
function can be frozen as soon as the response is sent, so background work would be lost.
There we skip it, and the frontend drives the work instead (POST /emails/process,
POST /ads/score, POST /emails/sync?if_stale=true) plus the daily cron.
"""

from collections.abc import Callable

from fastapi import BackgroundTasks

from app.core.config import get_settings


def defer(background: BackgroundTasks, fn: Callable, *args, **kwargs) -> None:
    if get_settings().is_serverless:
        return
    background.add_task(fn, *args, **kwargs)
