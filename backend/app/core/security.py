"""Session cookies, encryption at rest, and the current-user dependency.

- OAuth tokens and email bodies are encrypted with Fernet (AES + HMAC) before they hit the DB.
- The browser only ever gets an httpOnly session cookie, never a Microsoft/Google token (NFR-06).
"""

import json
from datetime import UTC, datetime, timedelta
from functools import lru_cache

import jwt
from cryptography.fernet import Fernet, InvalidToken
from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy import Text
from sqlalchemy.orm import Session
from sqlalchemy.types import TypeDecorator

from app.core.config import get_settings
from app.core.database import get_db

SESSION_COOKIE = "mailsense_session"
_ALGORITHM = "HS256"


# --- Encryption at rest -----------------------------------------------------------------


@lru_cache
def _fernet() -> Fernet:
    key = get_settings().encryption_key
    if not key:
        if get_settings().is_production:
            raise RuntimeError("ENCRYPTION_KEY must be set in production")
        # Dev fallback: derive a stable key from SECRET_KEY so local data stays readable.
        import base64
        import hashlib

        key = base64.urlsafe_b64encode(hashlib.sha256(get_settings().secret_key.encode()).digest())
    return Fernet(key)


def encrypt(text: str) -> str:
    return _fernet().encrypt(text.encode()).decode()


def decrypt(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("Could not decrypt value (wrong ENCRYPTION_KEY?)") from exc


class EncryptedText(TypeDecorator):
    """A Text column that is stored encrypted and read back as plain text."""

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return None if value is None else encrypt(value)

    def process_result_value(self, value, dialect):
        return None if value is None else decrypt(value)


def encrypt_json(data: dict) -> str:
    return encrypt(json.dumps(data))


def decrypt_json(token: str) -> dict:
    return json.loads(decrypt(token))


# --- Session cookie ---------------------------------------------------------------------


def create_session_token(user_id: int) -> str:
    settings = get_settings()
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(UTC) + timedelta(days=settings.session_days),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=_ALGORITHM)


def read_session_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, get_settings().secret_key, algorithms=[_ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def set_cookie(response: Response, name: str, value: str, max_age: int) -> None:
    response.set_cookie(
        name,
        value,
        max_age=max_age,
        httponly=True,
        secure=get_settings().is_production,
        samesite="lax",
        path="/",
    )


def set_session_cookie(response: Response, user_id: int) -> None:
    max_age = get_settings().session_days * 24 * 3600
    set_cookie(response, SESSION_COOKIE, create_session_token(user_id), max_age)


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/")


def get_current_user(request: Request, db: Session = Depends(get_db)):
    from app.models.user import User  # avoid import cycle

    token = request.cookies.get(SESSION_COOKIE)
    user_id = read_session_token(token) if token else None
    user = db.get(User, user_id) if user_id else None
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not signed in")
    return user


def require_role(*roles: str):
    """Dependency factory for role-based access control (NFR-07)."""

    def checker(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed")
        return user

    return checker
