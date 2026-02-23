import os
import secrets
from pathlib import Path
from typing import Literal, Self

from pydantic import AnyHttpUrl, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[4]
_ENV_FILE_BY_ENV = {"development": ".env.development", "production": ".env.production"}


def _resolve_env_file() -> str:
    environment = os.getenv("ENVIRONMENT", "development").lower()
    env_file = _ENV_FILE_BY_ENV.get(environment, ".env.development")
    env_path = _BACKEND_DIR / env_file

    return str(env_path)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_resolve_env_file(),
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
    )

    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ENVIRONMENT: Literal["test", "development", "production"] = "development"
    # 60 minutes * 24 hours * 7 days = 7 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    BACKEND_CORS_ORIGINS: list[AnyHttpUrl] = []
    PROJECT_NAME: str = "PeerHub"
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "peerhub"
    GITHUB_CLIENT_ID: str | None = None
    GITHUB_CLIENT_SECRET: str | None = None
    SSO_CALLBACK_HOSTNAME: str | None = None
    ALLOWED_USERNAMES: set[str] = set()
    POSTHOG_HOST: str = "https://us.i.posthog.com"
    POSTHOG_API_KEY: str | None = None
    RESEND_API_KEY: str | None = None
    SENDER_EMAIL: str | None = None
    ABUSE_CONTROL_EMAIL: str | None = None

    @model_validator(mode="after")
    def validate_production_settings(self) -> Self:
        if self.ENVIRONMENT == "production":
            default_length = 43  # len(secrets.token_urlsafe(32))
            if len(self.SECRET_KEY) == default_length:
                raise ValueError(
                    "SECRET_KEY must be explicitly set in production "
                    "to prevent token invalidation on restart"
                )
        return self


settings = Settings()
