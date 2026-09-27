# preprocessing_service.py - Data preprocessing options
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from typing import Dict, Any, Optional, List
from ..core.logger import logger

class PreprocessingService:
    """Service for data preprocessing"""
    
    @staticmethod
    def handle_missing_values(df: pd.DataFrame, strategy: str, columns: Optional[List[str]] = None) -> pd.DataFrame:
        """Handle missing values in dataframe"""
        df_copy = df.copy()
        
        if columns is None:
            columns = df_copy.columns.tolist()
        
        if strategy == 'drop':
            df_copy = df_copy.dropna(subset=columns)
            logger.info(f"Dropped rows with missing values. Remaining: {len(df_copy)} rows")
        
        elif strategy == 'fill_mean':
            for col in columns:
                if df_copy[col].dtype in ['float64', 'int64']:
                    df_copy[col] = df_copy[col].fillna(df_copy[col].mean())
            logger.info("Filled missing values with mean")
        
        elif strategy == 'fill_median':
            for col in columns:
                if df_copy[col].dtype in ['float64', 'int64']:
                    df_copy[col] = df_copy[col].fillna(df_copy[col].median())
            logger.info("Filled missing values with median")
        
        elif strategy == 'interpolate':
            df_copy = df_copy.interpolate()
            logger.info("Interpolated missing values")
        
        return df_copy
    
    @staticmethod
    def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
        """Remove duplicate rows"""
        before = len(df)
        df = df.drop_duplicates()
        after = len(df)
        logger.info(f"Removed {before - after} duplicate rows")
        return df
    
    @staticmethod
    def normalize(df: pd.DataFrame, method: str = 'standard') -> pd.DataFrame:
        """Normalize numeric columns"""
        df_copy = df.copy()
        numeric_cols = df_copy.select_dtypes(include=[np.number]).columns
        
        if method == 'standard':
            scaler = StandardScaler()
        elif method == 'minmax':
            scaler = MinMaxScaler()
        else:
            return df_copy
        
        df_copy[numeric_cols] = scaler.fit_transform(df_copy[numeric_cols])
        logger.info(f"Normalized {len(numeric_cols)} columns using {method} scaling")
        return df_copy
    
    @staticmethod
    def encode_categorical(df: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical columns to numbers"""
        df_copy = df.copy()
        cat_cols = df_copy.select_dtypes(include=['object', 'category']).columns
        
        for col in cat_cols:
            le = LabelEncoder()
            df_copy[col] = le.fit_transform(df_copy[col].astype(str))
        
        logger.info(f"Encoded {len(cat_cols)} categorical columns")
        return df_copy
    
    @staticmethod
    def apply_all(df: pd.DataFrame, config: Dict[str, Any]) -> Dict[str, Any]:
        """Apply all preprocessing steps based on config"""
        result = {
            'original_rows': len(df),
            'original_columns': len(df.columns),
            'steps_applied': []
        }
        
        df_processed = df.copy()
        
        # Handle missing values
        missing_strategy = config.get('missing_strategy')
        if missing_strategy and missing_strategy != 'none':
            df_processed = PreprocessingService.handle_missing_values(df_processed, missing_strategy)
            result['steps_applied'].append(f"missing_values: {missing_strategy}")
        
        # Remove duplicates
        if config.get('remove_duplicates', False):
            before = len(df_processed)
            df_processed = PreprocessingService.remove_duplicates(df_processed)
            after = len(df_processed)
            result['steps_applied'].append(f"removed_duplicates: {before - after} rows")
        
        # Normalize
        if config.get('normalize', False):
            method = config.get('normalize_method', 'standard')
            df_processed = PreprocessingService.normalize(df_processed, method)
            result['steps_applied'].append(f"normalized: {method}")
        
        # Encode categorical
        if config.get('encode_categorical', False):
            df_processed = PreprocessingService.encode_categorical(df_processed)
            result['steps_applied'].append("encoded_categorical")
        
        result['processed_rows'] = len(df_processed)
        result['processed_columns'] = len(df_processed.columns)
        
        return {
            'dataframe': df_processed,
            'info': result
        }