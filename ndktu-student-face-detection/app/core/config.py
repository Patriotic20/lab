from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Face detection
    model_path: str = "blaze_face_short_range.tflite"
    sample_fps: int = 2
    min_detection_confidence: float = 0.5

    # Upload limits
    max_file_size_mb: int = 200

    # Logging
    log_level: str = "INFO"

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024

    @property
    def allowed_mime_types(self) -> set[str]:
        return {"video/mp4", "video/avi", "video/quicktime", "video/x-matroska", "video/webm"}


settings = Settings()
