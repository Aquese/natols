# services/analysis-service/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8083
    DEBUG: bool = True
    
    # Ollama settings
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama2"  # or mistral, codellama, etc.
    
    # Database settings (optional - for caching analysis)
    DB_HOST: Optional[str] = "localhost"
    DB_PORT: Optional[int] = 5432
    DB_USER: Optional[str] = "natols_user"
    DB_PASSWORD: Optional[str] = "natols_password"
    DB_NAME: Optional[str] = "natols_db"
    
    # External API keys (optional)
    ALPHA_VANTAGE_API_KEY: Optional[str] = None
    NEWS_API_KEY: Optional[str] = None
    
    # Analysis settings
    MAX_ANALYSIS_LENGTH: int = 2000
    ENABLE_CACHING: bool = True
    CACHE_TTL: int = 3600  # 1 hour
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()