# config.py - Project configuration
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Keys
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    HF_TOKEN = os.getenv("HF_TOKEN", "")
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # Directories
    BASE_DIR = Path(__file__).parent.parent
    UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", BASE_DIR / "uploads"))
    MODEL_DIR = Path(os.getenv("MODEL_DIR", BASE_DIR / "models"))
    LOG_DIR = Path(os.getenv("LOG_DIR", BASE_DIR / "logs"))
    
    # Limits
    MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", 500))
    MAX_QUERY_LENGTH = int(os.getenv("MAX_QUERY_LENGTH", 2000))
    
    # Allowed extensions
    ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
    
    # TabPFN settings
    USE_TABPFN = os.getenv("USE_TABPFN", "true").lower() == "true"
    TABPFN_DEVICE = os.getenv("TABPFN_DEVICE", "cpu")
    
    @classmethod
    def ensure_directories(cls):
        """Create required directories"""
        for directory in [cls.UPLOAD_DIR, cls.MODEL_DIR, cls.LOG_DIR]:
            directory.mkdir(parents=True, exist_ok=True)

# Initialize directories
Config.ensure_directories()