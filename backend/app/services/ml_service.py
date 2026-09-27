# ml_service.py - Complete working version
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import (
    RandomForestRegressor, RandomForestClassifier,
    ExtraTreesRegressor, ExtraTreesClassifier,
    AdaBoostRegressor, AdaBoostClassifier,
    GradientBoostingRegressor, GradientBoostingClassifier
)
from sklearn.linear_model import LinearRegression, LogisticRegression, Ridge, Lasso
from sklearn.metrics import (
    r2_score, mean_absolute_error, mean_squared_error,
    accuracy_score, f1_score, explained_variance_score
)
from sklearn.preprocessing import LabelEncoder, StandardScaler
from typing import Dict, Any, Optional, Tuple
import joblib
import warnings
import numpy as np
from ..core.logger import logger
from ..config import Config

warnings.filterwarnings('ignore')

class MLService:
    """Service for machine learning tasks with TabPFN support"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.model_dir = Config.MODEL_DIR
        self.use_tabpfn = Config.USE_TABPFN and Config.HF_TOKEN
        self.tabpfn_available = False
        self.trained_model = None
        self.trained_model_metrics = None
        self.trained_model_name = None
        self.task_type = None
        self.feature_columns = None
        
        if self.use_tabpfn:
            try:
                from tabpfn import TabPFNClassifier, TabPFNRegressor
                self.TabPFNClassifier = TabPFNClassifier
                self.TabPFNRegressor = TabPFNRegressor
                self.tabpfn_available = True
                logger.info("✅ TabPFN initialized successfully")
            except Exception as e:
                logger.warning(f"⚠️ TabPFN not available: {str(e)}")
    
    def auto_detect_problem_type(self, df: pd.DataFrame, target_column: str) -> str:
        """Auto-detect if problem is regression or classification"""
        y = df[target_column].dropna()
        
        if y.dtype == 'object' or y.dtype.name == 'category':
            return 'classification'
        
        unique_count = y.nunique()
        total_count = len(y)
        
        if unique_count <= 10 or (unique_count / total_count) < 0.05:
            return 'classification'
        
        if y.dtype in ['int64', 'int32'] and unique_count <= 20:
            return 'classification'
        
        return 'regression'
    
    def auto_detect_date_column(self, df: pd.DataFrame) -> Optional[str]:
        """Auto-detect date column"""
        for col in df.columns:
            if 'date' in col.lower() or 'time' in col.lower():
                return col
            try:
                if pd.api.types.is_datetime64_any_dtype(df[col]):
                    return col
                pd.to_datetime(df[col], errors='raise')
                return col
            except:
                pass
        return None
    
    def run_automl(self, df: pd.DataFrame, target_column: str, problem_type: Optional[str] = None) -> Dict[str, Any]:
        """Run AutoML with specified or auto-detected problem type"""
        
        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found")
        
        if problem_type is None or problem_type == "auto":
            problem_type = self.auto_detect_problem_type(df, target_column)
        
        logger.info(f"Running AutoML with problem type: {problem_type}")
        
        # Prepare data
        X, y, feature_cols = self._prepare_data(df, target_column)
        self.feature_columns = feature_cols
        
        if len(X) == 0:
            raise ValueError("No valid data after preprocessing")
        
        # Split data
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42,
                stratify=y if problem_type == 'classification' else None
            )
        except ValueError as e:
            logger.warning(f"Train-test split issue: {str(e)}")
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train models
        results = self._train_all_models(
            X_train_scaled, X_test_scaled, y_train, y_test, problem_type
        )
        
        if not results:
            raise ValueError("No models could be trained successfully")
        
        # Find best model
        if problem_type == 'regression':
            best_model_name = max(results, key=lambda x: results[x].get('r2', -float('inf')))
        else:
            best_model_name = max(results, key=lambda x: results[x].get('accuracy', -float('inf')))
        
        best_model_data = results[best_model_name]
        
        # Store trained model
        self.trained_model = best_model_data.get('model')
        self.trained_model_metrics = best_model_data
        self.trained_model_name = best_model_name
        self.task_type = problem_type
        
        # Save best model
        model_path = self.model_dir / "best_model.pkl"
        joblib.dump({
            'model': self.trained_model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'task_type': self.task_type,
            'metrics': self.trained_model_metrics,
            'model_name': self.trained_model_name
        }, model_path)
        
        logger.info(f"🏆 Best model: {best_model_name}")
        
        return {
            'best_model': best_model_name,
            'best_model_metrics': best_model_data,
            'all_models': results,
            'task_type': problem_type,
            'feature_importance': self._get_feature_importance(best_model_data.get('model'), feature_cols),
            'samples_used': len(X),
            'features_used': len(feature_cols)
        }
    
    def predict_from_values(self, df: pd.DataFrame, values: Dict[str, float]) -> float:
        """Make prediction from input values"""
        # Load model if not already loaded
        if self.trained_model is None:
            model_path = self.model_dir / "best_model.pkl"
            if not model_path.exists():
                raise FileNotFoundError("No trained model found. Please train models first.")
            
            model_data = joblib.load(model_path)
            self.trained_model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_columns = model_data['feature_columns']
            self.task_type = model_data['task_type']
        
        # Create input array
        input_data = []
        for col in self.feature_columns:
            input_data.append(values.get(col, 0))
        
        input_array = np.array(input_data).reshape(1, -1)
        input_scaled = self.scaler.transform(input_array)
        
        prediction = self.trained_model.predict(input_scaled)
        return float(prediction[0])
    
    def _train_all_models(self, X_train, X_test, y_train, y_test, task_type: str) -> Dict[str, Any]:
        """Train ALL models and return metrics"""
        results = {}
        
        if task_type == 'regression':
            models = {
                'Linear Regression': LinearRegression(),
                'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
                'Extra Trees': ExtraTreesRegressor(n_estimators=100, random_state=42, n_jobs=-1),
                'AdaBoost': AdaBoostRegressor(n_estimators=100, random_state=42),
                'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
                'Ridge': Ridge(),
                'Lasso': Lasso()
            }
        else:
            models = {
                'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42, n_jobs=-1),
                'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
                'Extra Trees': ExtraTreesClassifier(n_estimators=100, random_state=42, n_jobs=-1),
                'AdaBoost': AdaBoostClassifier(n_estimators=100, random_state=42),
                'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42)
            }
            
            if self.tabpfn_available:
                try:
                    models['TabPFN'] = self.TabPFNClassifier(device=Config.TABPFN_DEVICE)
                except:
                    pass
        
        for name, model in models.items():
            try:
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                
                if task_type == 'regression':
                    metrics = {
                        'r2': r2_score(y_test, y_pred),
                        'mae': mean_absolute_error(y_test, y_pred),
                        'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
                        'explained_variance': explained_variance_score(y_test, y_pred)
                    }
                else:
                    metrics = {
                        'accuracy': accuracy_score(y_test, y_pred),
                        'f1_score': f1_score(y_test, y_pred, average='weighted')
                    }
                
                results[name] = {
                    'model': model,
                    **metrics,
                    'model_name': name
                }
                logger.info(f"✅ {name}: {metrics}")
                
            except Exception as e:
                logger.warning(f"❌ {name} failed: {str(e)}")
        
        return results
    
    def _prepare_data(self, df: pd.DataFrame, target_col: str) -> Tuple[pd.DataFrame, pd.Series, list]:
        """Prepare data for training"""
        X = df.drop(columns=[target_col])
        y = df[target_col]
        
        # Remove rows where target is NaN
        clean_mask = y.notna()
        X = X[clean_mask]
        y = y[clean_mask]
        
        if len(X) == 0:
            raise ValueError(f"No valid data after removing NaN values from target column")
        
        # Handle missing values in features
        numeric_cols = X.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            X[col] = X[col].fillna(X[col].median())
        
        # Encode categorical features
        cat_cols = X.select_dtypes(include=['object', 'category']).columns
        for col in cat_cols:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
        
        # Keep only numeric columns
        X = X.select_dtypes(include=[np.number])
        
        # Encode target if needed
        if y.dtype == 'object':
            y = LabelEncoder().fit_transform(y)
        
        return X, y, X.columns.tolist()
    
    def _get_feature_importance(self, model, feature_names: list) -> Dict[str, float]:
        """Extract feature importance"""
        try:
            if model is None:
                return {}
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
            elif hasattr(model, 'coef_'):
                importances = np.abs(model.coef_[0]) if len(model.coef_.shape) > 1 else np.abs(model.coef_)
            else:
                return {}
            
            min_len = min(len(feature_names), len(importances))
            importance_dict = dict(zip(feature_names[:min_len], importances[:min_len]))
            return dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)[:10])
        except Exception as e:
            logger.warning(f"Could not extract feature importance: {str(e)}")
            return {}