# logger.py - Logging configuration
import logging
import sys
from pathlib import Path
from datetime import datetime
from ..config import Config

def setup_logger(name: str = "chat_with_data") -> logging.Logger:
    """Setup application logger"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO if not Config.DEBUG else logging.DEBUG)
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    ))
    logger.addHandler(console_handler)
    
    if Config.LOG_DIR:
        Config.LOG_DIR.mkdir(exist_ok=True)
        file_handler = logging.FileHandler(
            Config.LOG_DIR / f"{name}_{datetime.now().strftime('%Y%m%d')}.log",
            encoding='utf-8'
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        logger.addHandler(file_handler)
    
    return logger

logger = setup_logger()