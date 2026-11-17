"""App settings, read from environment variables or backend/.env (never commit .env)."""

import os
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # General
    environment: str = "development"  # "production" turns on secure cookies
    # SQLite locally; PostgreSQL (e.g. Neon) in production: postgresql://user:pass@host/db
    database_url: str = "sqlite:///./mailsense.db"
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:5173"

    # Signs session cookies (any long random string)
    secret_key: str = "dev-only-change-me-dev-only-change-me"
    # Encrypts OAuth tokens and email bodies at rest. Generate with:
    #   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    encryption_key: str = ""
    session_days: int = 7

    # Microsoft (Siswamail / Outlook) — Microsoft Entra app registration
    ms_client_id: str = ""
    ms_client_secret: str = ""
    # "common" = any work/school account + personal Microsoft accounts.
    # Use the UM tenant ID if UM IT registers the app inside their tenant.
    ms_tenant: str = "common"

    # Google (Gmail) — Google Cloud OAuth client
    google_client_id: str = ""
    google_client_secret: str = ""

    # Comma-separated list, e.g. "siswa.um.edu.my,siswa365.um.edu.my". Empty = allow any account.
    allowed_email_domains: str = ""
    # True = every new board post waits for an admin before it is visible.
    # False = verified organisations publish straight away; admins can still hide/remove.
    ads_require_approval: bool = False

    # Local demo: a "Try the demo" sign-in with sample data. Never allowed in production.
    demo_mode: bool = False

    # Comma-separated emails that get the admin role when they sign in.
    admin_emails: str = ""

    # AI — Llama 4 Scout through an OpenAI-compatible API (openrouter | together | groq)
    llm_provider: str = "openrouter"
    llm_api_key: str = ""
    llm_model: str = ""  # empty = the provider's Llama 4 Scout model
    llm_base_url: str = ""  # only for a provider not in the list
    llm_daily_token_limit: int = 2_000_000  # safety cap; 0 = no limit
    ai_max_attempts: int = 3  # give up on an email after this many failed tries

    # Mail sync
    sync_interval_minutes: int = 10
    sync_max_messages: int = 50
    sync_enabled: bool = True

    # Serverless hosting (Vercel): no background loop or background tasks. Work runs inside
    # requests instead (see /emails/process and the daily cron). Auto-on when VERCEL is set.
    serverless: bool = False
    # Vercel Cron sends "Authorization: Bearer <CRON_SECRET>" to /api/v1/cron/sync
    cron_secret: str = ""

    @field_validator("database_url")
    @classmethod
    def _driver(cls, v: str) -> str:
        """Neon/Heroku style URLs -> SQLAlchemy with the psycopg 3 driver."""
        for prefix in ("postgres://", "postgresql://"):
            if v.startswith(prefix):
                return "postgresql+psycopg://" + v[len(prefix) :]
        return v

    @property
    def is_serverless(self) -> bool:
        return self.serverless or bool(os.environ.get("VERCEL"))

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def allowed_domains(self) -> list[str]:
        return [d.strip().lower() for d in self.allowed_email_domains.split(",") if d.strip()]

    @property
    def admins(self) -> set[str]:
        return {e.strip().lower() for e in self.admin_emails.split(",") if e.strip()}

    @property
    def ms_configured(self) -> bool:
        return bool(self.ms_client_id and self.ms_client_secret)

    @property
    def google_configured(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)


@lru_cache
def get_settings() -> Settings:
    return Settings()
