"""Vercel entry point: serves the FastAPI backend as one serverless function.

vercel.json sends every /api/* request here; the React frontend is served as static files.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(ROOT / "backend"), str(ROOT / "ai")]

from app.main import app, check_settings  # noqa: E402

check_settings()  # fail fast on unsafe production settings (lifespan may not run here)

__all__ = ["app"]
