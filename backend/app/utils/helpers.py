# helpers.py - Utility functions
import pandas as pd
import hashlib
from typing import List, Dict, Any

def calculate_data_hash(df: pd.DataFrame) -> str:
    """Calculate hash of dataframe for caching"""
    sample = df.head(100).to_string()
    return hashlib.md5(sample.encode()).hexdigest()

def detect_language(text: str) -> str:
    """Detect if text is Arabic or English"""
    arabic_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
    if arabic_chars > len(text) * 0.3:
        return "ar"
    return "en"

def format_number(num: float) -> str:
    """Format number with K/M suffix"""
    if abs(num) >= 1e6:
        return f"{num/1e6:.2f}M"
    elif abs(num) >= 1e3:
        return f"{num/1e3:.2f}K"
    return f"{num:.2f}"

def clean_column_name(col: str) -> str:
    """Clean column name for safe usage"""
    return col.strip().lower().replace(' ', '_').replace('-', '_')