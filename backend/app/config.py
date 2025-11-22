"""
Configuration management using pydantic-settings.
Reads from .env file automatically.
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str
    
    # Google Cloud
    gcp_project_id: str
    gcs_bucket_name: str
    google_application_credentials: str | None = None
    
    # LLM
    google_api_key: str
    gemini_model: str = "gemini-1.5-flash"
    
    # Geocoding (optional)
    mapbox_api_key: str | None = None
    google_maps_api_key: str | None = None
    
    # App configuration
    environment: str = "development"
    debug: bool = True
    cors_origins: str = "http://localhost:3000"
    
    # Limits
    max_images_per_sighting: int = 3
    max_image_size_mb: int = 5
    search_radius_km: int = 10
    min_match_score: float = 0.3
    
    # Security (optional)
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow"
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"


# Global settings instance
settings = Settings()