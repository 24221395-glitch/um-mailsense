"""Session cookie and token encryption helpers (W2-BE-02). Owner: Raihan."""

from fastapi import Cookie, HTTPException, status

SESSION_COOKIE = "ms_session"


def get_current_user_id(ms_session: str | None = Cookie(default=None)) -> str:
    """Return the signed-in user's id from the session cookie.

    TODO W2-BE-02: verify a signed session token.
    """
    if not ms_session:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in with Siswamail first.")
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Sessions not built yet (task W2-BE-02).")


def encrypt_token(token: str) -> str:
    """Encrypt a refresh token before storing it. TODO W2-BE-02."""
    raise NotImplementedError("W2-BE-02")


def decrypt_token(token: str) -> str:
    raise NotImplementedError("W2-BE-02")
