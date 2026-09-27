# data_service.py - Data loading and management with leakage detection
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional, Dict, Any
import joblib
import io
from ..core.logger import logger
from ..config import Config

class DataService:
    """Service for managing uploaded data"""
    
    def __init__(self):
        self.cache: Dict[str, pd.DataFrame] = {}
        self.upload_dir = Config.UPLOAD_DIR
        
    def load_file(self, file_bytes: bytes, filename: str) -> pd.DataFrame:
        """Load CSV or Excel from bytes"""
        
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(file_bytes))
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            raise ValueError(f"Unsupported file type: {filename}")
        
        # Clean dataframe
        df = self._clean_dataframe(df)
        
        # Remove leaky columns (Id, Index, etc.)
        df = self.remove_leaky_columns(df)
        
        logger.info(f"Loaded {len(df)} rows, {len(df.columns)} columns from {filename}")
        return df
    
    def remove_leaky_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove columns that cause data leakage (Id, Index, Row number, etc.)"""
        leaky_patterns = ['id', 'Id', 'ID', 'index', 'Index', 'row', 'Row', 'unnamed', 'Unnamed']
        cols_to_drop = []
        
        for col in df.columns:
            col_lower = col.lower()
            
            # Check against known leaky patterns
            for pattern in leaky_patterns:
                if pattern.lower() == col_lower or col_lower.startswith(pattern):
                    cols_to_drop.append(col)
                    logger.warning(f"⚠️ Removing leaky column: {col}")
                    break
            
            # Also check for sequential integer columns (like row numbers)
            if col not in cols_to_drop:
                try:
                    if df[col].dtype in ['int64', 'float64']:
                        unique_count = df[col].nunique()
                        # If column has unique values for each row and looks like row numbers
                        if unique_count == len(df) and unique_count > 10:
                            min_val = df[col].min()
                            max_val = df[col].max()
                            # Check if values are sequential (like 1,2,3... or 0,1,2...)
                            if max_val - min_val == len(df) - 1:
                                cols_to_drop.append(col)
                                logger.warning(f"⚠️ Removing sequential integer column (potential ID): {col}")
                except:
                    pass
        
        if cols_to_drop:
            logger.info(f"Removed {len(cols_to_drop)} leaky columns: {cols_to_drop}")
            df = df.drop(columns=cols_to_drop)
        
        return df
    
    def store_data(self, session_id: str, df: pd.DataFrame):
        """Store dataframe in cache and disk"""
        self.cache[session_id] = df
        cache_file = self.upload_dir / f"{session_id}.pkl"
        joblib.dump(df, cache_file)
        logger.debug(f"Stored session {session_id}")
    
    def get_data(self, session_id: str) -> Optional[pd.DataFrame]:
        """Retrieve dataframe from cache or disk"""
        if session_id in self.cache:
            return self.cache[session_id]
        
        cache_file = self.upload_dir / f"{session_id}.pkl"
        if cache_file.exists():
            df = joblib.load(cache_file)
            self.cache[session_id] = df
            logger.debug(f"Loaded session {session_id} from disk")
            return df
        
        return None
    
    def clear_session(self, session_id: str):
        """Delete session data"""
        if session_id in self.cache:
            del self.cache[session_id]
        cache_file = self.upload_dir / f"{session_id}.pkl"
        if cache_file.exists():
            cache_file.unlink()
        logger.info(f"Cleared session {session_id}")
    
    def _clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and optimize dataframe"""
        # Remove empty columns
        df = df.dropna(axis=1, how='all')
        
        # Remove duplicate rows
        df = df.drop_duplicates()
        
        # Convert data types
        for col in df.columns:
            if df[col].dtype == 'object':
                # Try to convert to numeric
                try:
                    df[col] = pd.to_numeric(df[col], errors='ignore')
                except:
                    pass
                # Try to convert to datetime
                try:
                    df[col] = pd.to_datetime(df[col], errors='ignore')
                except:
                    pass
        
        return df
    
    def get_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get basic summary statistics"""
        # Identify potential leaky columns in summary
        leaky_patterns = ['id', 'Id', 'ID', 'index', 'Index', 'row', 'Row']
        remaining_leaky = []
        for col in df.columns:
            for pattern in leaky_patterns:
                if pattern.lower() == col.lower():
                    remaining_leaky.append(col)
                    break
        
        return {
            'rows': len(df),
            'columns': len(df.columns),
            'column_names': list(df.columns),
            'dtypes': df.dtypes.astype(str).to_dict(),
            'missing_values': df.isnull().sum().to_dict(),
            'missing_percentage': (df.isnull().sum() / len(df) * 100).to_dict(),
            'numeric_columns': list(df.select_dtypes(include=[np.number]).columns),
            'categorical_columns': list(df.select_dtypes(include=['object']).columns),
            'datetime_columns': list(df.select_dtypes(include=['datetime64']).columns),
            'duplicate_rows': int(df.duplicated().sum()),
            'memory_usage_mb': df.memory_usage(deep=True).sum() / 1024 / 1024,
            'warning_leaky_columns': remaining_leaky if remaining_leaky else None
        }