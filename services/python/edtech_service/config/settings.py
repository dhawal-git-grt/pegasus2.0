from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    ENV: str = Field(default="development")
    PORT: int = Field(default=8000)
    LOG_LEVEL: str = Field(default="INFO")
    ZOOM_API_KEY: str = Field(default="")
    ZOOM_API_SECRET: str = Field(default="")
    ZOOM_ACCOUNT_ID: str = Field(default="")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
