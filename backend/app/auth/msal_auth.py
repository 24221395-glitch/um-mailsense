"""Siswamail sign-in through Microsoft Entra ID (W2-BE-02). Owner: Raihan."""

import msal

from app.core.config import get_settings


def build_msal_app() -> msal.ConfidentialClientApplication:
    s = get_settings()
    return msal.ConfidentialClientApplication(
        client_id=s.ms_client_id,
        client_credential=s.ms_client_secret,
        authority=s.ms_authority,
    )


def login_url(state: str) -> str:
    """URL that sends the student to Microsoft sign-in. TODO W2-BE-02."""
    raise NotImplementedError("W2-BE-02")


def exchange_code(code: str) -> dict:
    """Swap the callback code for tokens. TODO W2-BE-02."""
    raise NotImplementedError("W2-BE-02")
