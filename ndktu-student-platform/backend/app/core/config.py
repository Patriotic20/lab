from typing import Any

from dotenv import load_dotenv
from pydantic import BaseModel, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class ServerConfig(BaseModel):
    app_path: str
    host: str
    port: int
    reload: bool = True


class JwtConfig(BaseModel):
    access_token_secret: str
    refresh_token_secret: str
    access_token_expires_minutes: int
    refresh_token_expires_days: int
    algorithm: str


class DatabaseConfig(BaseModel):
    url: PostgresDsn
    test_url: PostgresDsn
    echo: bool = False
    echo_pool: bool = False
    pool_size: int = 50
    max_overflow: int = 10

    naming_convention: dict[str, str] = {
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }

    @field_validator("echo", "echo_pool", mode="before")
    @classmethod
    def coerce_bool(cls, v: Any) -> Any:
        """Treat empty string as the field default (False)."""
        if v == "":
            return False
        return v

    @field_validator("pool_size", mode="before")
    @classmethod
    def coerce_pool_size(cls, v: Any) -> Any:
        """Treat empty string as the field default (50)."""
        if v == "":
            return 50
        return v

    @field_validator("max_overflow", mode="before")
    @classmethod
    def coerce_max_overflow(cls, v: Any) -> Any:
        """Treat empty string as the field default (10)."""
        if v == "":
            return 10
        return v


class AdminConfig(BaseModel):
    username: str
    password: str
    secret_key: str


class FileUrl(BaseModel):
    http: str
    upload_dir: str


class HemisConfig(BaseModel):
    login_url: str
    me_url: str


class RedisConfig(BaseModel):
    host: str
    port: int
    prefix: str

    @property
    def url(self) -> str:
        """Собирает URL для подключения к Redis"""
        return f"redis://{self.host}:{self.port}/0"


class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        env_nested_delimiter="__",
        env_prefix="APP_CONFIG__",
        extra="ignore",
    )

    server: ServerConfig
    database: DatabaseConfig
    jwt: JwtConfig
    admin: AdminConfig
    hemis: HemisConfig
    file_url: FileUrl
    redis: RedisConfig


settings = AppConfig()
