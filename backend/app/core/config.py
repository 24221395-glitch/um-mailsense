"""Settings read from environment variables / .env (see the repo's .env.example)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    database_url: str = "postgresql+psycopg://mailsense:mailsense@localhost:5432/mailsense"

    ms_client_id: str = ""
    ms_client_secret: str = ""
    ms_tenant_id: str = "organizations"
    ms_redirect_uri: str = "http://localhost:8000/api/v1/auth/callback"
    ms_scopes: str = "User.Read Mail.Read offline_access"

    secret_key: str = "change-me"
    frontend_url: str = "http://localhost:5173"
    mail_sync_interval_minutes: int = 10

    @property
    def ms_authority(self) -> str:
        return f"https://login.microsoftonline.com/{self.ms_tenant_id}"

    @property
    def ms_scope_list(self) -> list[str]:
        # MSAL adds offline_access itself and rejects it in the list.
        return [s for s in self.ms_scopes.split() if s != "offline_access"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
