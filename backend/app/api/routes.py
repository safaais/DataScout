# routes.py 
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from typing import Optional, Dict, Any, List
import pandas as pd
import json
import uuid
import os
import joblib
import numpy as np
import shap

from ..services.data_service import DataService
from ..core.logger import logger
from ..schemas.request_models import QueryRequest, QueryResponse, UploadResponse
from ..config import Config

from sklearn.ensemble import (
    RandomForestRegressor, RandomForestClassifier,
    ExtraTreesRegressor, ExtraTreesClassifier,
    AdaBoostRegressor, AdaBoostClassifier,
    GradientBoostingRegressor, GradientBoostingClassifier
)
from sklearn.linear_model import (
    LinearRegression, LogisticRegression, Ridge, Lasso,
    ElasticNet
)
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.svm import SVC, SVR
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    r2_score, accuracy_score, mean_absolute_error, mean_squared_error,
    f1_score, precision_score, recall_score
)
from sklearn.preprocessing import StandardScaler, LabelEncoder

router = APIRouter(prefix="/api/v1", tags=["DataScout API"])

data_service = DataService()
sessions = {}
trained_models_store = {}

# ==================== HEALTH & INFO ====================

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "DataScout API",
        "version": "2.0.0"
    }

@router.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "service": "DataScout - Agent API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/api/v1/docs"
    }

# ==================== HELPER FUNCTION ====================

def encode_input_values(values: Dict, encoders: Dict, feature_columns: List[str]) -> List[float]:
    """Convert input values to numeric format"""
    encoded = []
    for col in feature_columns:
        raw_value = values.get(col, 0)
        if col in encoders:
            le = encoders[col]
            try:
                val_str = str(raw_value).lower().strip()
                encoded.append(float(le.transform([val_str])[0]))
            except:
                encoded.append(0.0)
        else:
            try:
                encoded.append(float(raw_value))
            except:
                encoded.append(0.0)
    return encoded

# ==================== UPLOAD ====================

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    df = data_service.load_file(contents, file.filename)
    session_id = str(uuid.uuid4())
    data_service.store_data(session_id, df)
    sessions[session_id] = file.filename
    
    return UploadResponse(
        success=True,
        session_id=session_id,
        filename=file.filename,
        rows=len(df),
        columns=len(df.columns),
        message=f"Successfully uploaded {len(df)} rows"
    )

# ==================== DELETE SESSION MODEL ====================

@router.delete("/session/{session_id}/model")
async def delete_session_model(session_id: str):
    if session_id in trained_models_store:
        del trained_models_store[session_id]
    model_path = Config.MODEL_DIR / f"model_{session_id}.pkl"
    if model_path.exists():
        model_path.unlink()
    return {"success": True}

# ==================== PREPROCESS ====================

@router.post("/preprocess")
async def preprocess_data(session_id: str):
    df = data_service.get_data(session_id)
    if df is None:
        raise HTTPException(404, "Session not found")
    
    df = df.dropna()
    data_service.store_data(session_id, df)
    
    return {"success": True, "message": "Data preprocessed"}

# ==================== AUTO DETECT ====================

@router.get("/auto_detect_task")
async def auto_detect_task(session_id: str, target_column: str):
    df = data_service.get_data(session_id)
    if df is None:
        raise HTTPException(404, "Session not found")
    
    y = df[target_column].dropna()
    
    for col in df.columns:
        if 'date' in col.lower() or 'time' in col.lower():
            return {"task_type": "timeseries", "date_column": col}
    
    if y.dtype == 'object' or y.dtype.name == 'category':
        return {"task_type": "classification"}
    
    if y.nunique() <= 10:
        return {"task_type": "classification"}
    
    return {"task_type": "regression"}

# ==================== TRAIN ====================

@router.post("/train_all")
async def train_all_models(
    session_id: str,
    target_column: str,
    problem_type: str = "auto"
):
    df = data_service.get_data(session_id)
    if df is None:
        raise HTTPException(404, "Session not found")
    
    # Auto-detect
    if problem_type == "auto":
        date_col = None
        for col in df.columns:
            if 'date' in col.lower() or 'time' in col.lower():
                date_col = col
                break
        
        if date_col:
            problem_type = "timeseries"
        else:
            y = df[target_column].dropna()
            if y.dtype == 'object' or y.dtype.name == 'category' or y.nunique() <= 10:
                problem_type = "classification"
            else:
                problem_type = "regression"
    
    # ==================== TIME SERIES ====================
    if problem_type == "timeseries":
        date_col = None
        for col in df.columns:
            if 'date' in col.lower() or 'time' in col.lower():
                date_col = col
                break
        
        if not date_col:
            date_col = df.columns[0]
        
        try:
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            df = df.dropna(subset=[date_col])
            df = df.sort_values(date_col)
            ts = df.set_index(date_col)[target_column].dropna()
            
            if len(ts) < 5:
                return {
                    'success': True,
                    'task_type': 'timeseries',
                    'target_column': target_column,
                    'message': 'Not enough data for time series',
                    'forecast': [float(ts.mean())] * 10 if len(ts) > 0 else [0] * 10,
                    'dates': []
                }
            
            horizon = 30
            if len(ts) > 10:
                recent = ts.tail(min(10, len(ts) // 2))
                trend = (recent.iloc[-1] - recent.iloc[0]) / len(recent) if len(recent) > 1 else 0
            else:
                trend = 0
            
            last_val = ts.iloc[-1]
            forecast = [float(last_val + trend * (i + 1)) for i in range(horizon)]
            
            last_date = ts.index[-1]
            future_dates = pd.date_range(start=last_date, periods=horizon + 1, freq='D')[1:]
            
            return {
                'success': True,
                'task_type': 'timeseries',
                'target_column': target_column,
                'date_column': date_col,
                'forecast_horizon': horizon,
                'forecast': forecast,
                'dates': [d.strftime('%Y-%m-%d') for d in future_dates],
                'history': ts.tail(30).values.tolist(),
                'history_dates': ts.tail(30).index.strftime('%Y-%m-%d').tolist(),
                'trend': float(trend),
                'last_value': float(last_val)
            }
        except Exception as e:
            logger.error(f"Time series error: {str(e)}")
            return {
                'success': True,
                'task_type': 'timeseries',
                'target_column': target_column,
                'message': f'Time series failed: {str(e)}',
                'forecast': []
            }
    
    # ==================== CLASSIFICATION OR REGRESSION ====================
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    mask = y.notna()
    X = X[mask]
    y = y[mask]
    
    if len(X) == 0:
        raise HTTPException(400, "No valid data")
    
    encoders = {}
    for col in X.select_dtypes(include=['object']).columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        encoders[col] = le
    
    X = X.select_dtypes(include=['number'])
    X = X.fillna(X.median())
    
    feature_cols = X.columns.tolist()
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    results = {}
    best_model = None
    best_score = -float('inf')
    best_name = ""
    
    if problem_type == "classification":
        models = {
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
            'SVM': SVC(kernel='rbf', random_state=42),
            'KNN': KNeighborsClassifier(n_neighbors=5),
            'Decision Tree': DecisionTreeClassifier(random_state=42),
            'Extra Trees': ExtraTreesClassifier(n_estimators=100, random_state=42),
            'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
            'AdaBoost': AdaBoostClassifier(n_estimators=100, random_state=42)
        }
        
        for name, model in models.items():
            try:
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
                acc = accuracy_score(y_test, y_pred)
                prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
                rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
                f1 = f1_score(y_test, y_pred, average='weighted')
                
                results[name] = {
                    'accuracy': float(acc),
                    'precision': float(prec),
                    'recall': float(rec),
                    'f1_score': float(f1),
                    'score': float(acc)
                }
                if acc > best_score:
                    best_score = acc
                    best_model = model
                    best_name = name
            except Exception as e:
                results[name] = {'error': str(e), 'score': 0}
    else:
        models = {
            'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'Linear Regression': LinearRegression(),
            'Ridge': Ridge(),
            'Lasso': Lasso(),
            'Decision Tree': DecisionTreeRegressor(random_state=42),
            'KNN': KNeighborsRegressor(n_neighbors=5),
            'Extra Trees': ExtraTreesRegressor(n_estimators=100, random_state=42),
            'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'AdaBoost': AdaBoostRegressor(n_estimators=100, random_state=42),
            'Elastic Net': ElasticNet(random_state=42)
        }
        
        for name, model in models.items():
            try:
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
                r2 = r2_score(y_test, y_pred)
                mae = mean_absolute_error(y_test, y_pred)
                rmse = np.sqrt(mean_squared_error(y_test, y_pred))
                
                results[name] = {
                    'r2': float(r2),
                    'mae': float(mae),
                    'rmse': float(rmse),
                    'score': float(r2)
                }
                if r2 > best_score:
                    best_score = r2
                    best_model = model
                    best_name = name
            except Exception as e:
                results[name] = {'error': str(e), 'score': -float('inf')}
    
    if best_model:
        trained_models_store[session_id] = {
            'model': best_model,
            'scaler': scaler,
            'feature_columns': feature_cols,
            'target_column': target_column,
            'model_name': best_name,
            'task_type': problem_type,
            'encoders': encoders
        }
        
        model_path = Config.MODEL_DIR / f"model_{session_id}.pkl"
        joblib.dump(trained_models_store[session_id], model_path)
    
    return {
        'success': True,
        'task_type': problem_type,
        'target_column': target_column,
        'best_model': best_name,
        'best_model_metrics': results.get(best_name, {}),
        'all_models': results,
        'samples_used': len(X),
        'features_used': len(feature_cols),
        'feature_columns': feature_cols
    }

# ==================== PREDICT ====================

@router.post("/predict")
async def make_prediction(request: Request):
    try:
        body = await request.json()
        session_id = body.get('session_id')
        values = body.get('values', {})
        
        if session_id not in trained_models_store:
            model_path = Config.MODEL_DIR / f"model_{session_id}.pkl"
            if not model_path.exists():
                return {'success': True, 'prediction': 1000.0, 'demo': True}
            trained_models_store[session_id] = joblib.load(model_path)
        
        model_data = trained_models_store[session_id]
        feature_columns = model_data['feature_columns']
        scaler = model_data.get('scaler')
        encoders = model_data.get('encoders', {})
        
        encoded_values = encode_input_values(values, encoders, feature_columns)
        
        input_array = np.array(encoded_values).reshape(1, -1)
        if scaler:
            input_array = scaler.transform(input_array)
        
        prediction = model_data['model'].predict(input_array)
        return {'success': True, 'prediction': float(prediction[0])}
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return {'success': True, 'prediction': 1000.0, 'demo': True}

# ==================== SHAP EXPLANATION ====================

@router.post("/shap_explain")
async def shap_explain(request: Request):
    try:
        body = await request.json()
        session_id = body.get('session_id')
        values = body.get('values', {})
        
        if not session_id:
            return {'success': False, 'message': 'session_id is required'}

        # Load model
        if session_id not in trained_models_store:
            model_path = Config.MODEL_DIR / f"model_{session_id}.pkl"
            if not model_path.exists():
                return {'success': False, 'message': 'No trained model found'}
            trained_models_store[session_id] = joblib.load(model_path)

        model_data = trained_models_store[session_id]
        model = model_data['model']
        scaler = model_data.get('scaler')
        encoders = model_data.get('encoders', {})
        feature_columns = model_data['feature_columns']
        target_column = model_data.get('target_column')

        # ⭐ Filter out target column from features
        feature_columns = [col for col in feature_columns if col != target_column]

        # Encode input values
        encoded_values = encode_input_values(values, encoders, feature_columns)
        logger.info(f"SHAP Features: {feature_columns}")
        logger.info(f"SHAP Encoded Values: {encoded_values}")

        input_array = np.array(encoded_values).reshape(1, -1)
        if scaler:
            input_array = scaler.transform(input_array)

        # Prediction
        prediction = model.predict(input_array)
        prediction_value = float(prediction[0])

        # Select SHAP explainer
        tree_models = (
            RandomForestRegressor, RandomForestClassifier,
            ExtraTreesRegressor, ExtraTreesClassifier,
            GradientBoostingRegressor, GradientBoostingClassifier,
            AdaBoostRegressor, AdaBoostClassifier,
            DecisionTreeClassifier, DecisionTreeRegressor
        )

        linear_models = (
            LinearRegression, Ridge, Lasso,
            ElasticNet, LogisticRegression
        )

        if isinstance(model, tree_models):
            explainer = shap.TreeExplainer(model)
        elif isinstance(model, linear_models):
            explainer = shap.LinearExplainer(model, input_array)
        else:
            explainer = shap.KernelExplainer(model.predict, input_array)

        shap_values = explainer(input_array)

        # Handle different output shapes
        if isinstance(shap_values.values, list):
            values_array = shap_values.values[0][0]
        else:
            values_array = shap_values.values[0]

        # Build importance data
        importance_data = []
        for i, feature in enumerate(feature_columns):
            shap_val = float(values_array[i])
            importance_data.append({
                "feature": feature,
                "value": shap_val,
                "abs_value": abs(shap_val)
            })

        importance_data.sort(key=lambda x: x["abs_value"], reverse=True)

        # Base value
        if isinstance(shap_values.base_values, np.ndarray):
            base_value = float(shap_values.base_values[0])
        else:
            base_value = float(shap_values.base_values)

        logger.info(f"Prediction: {prediction_value}")
        logger.info(f"Base Value: {base_value}")

        return {
            "success": True,
            "prediction_value": prediction_value,
            "expected_value": base_value,
            "base_value": base_value,
            "importance_data": importance_data
        }

    except Exception as e:
        logger.error(f"SHAP error: {str(e)}")
        return {'success': False, 'message': str(e)}

# ==================== CHAT ====================

@router.post("/chat")
async def chat_endpoint(session_id: str, query: str):
    """Natural language chat with data"""
    df = data_service.get_data(session_id)
    if df is None:
        raise HTTPException(404, "Session not found")
    
    try:
        from ..services.llm_service import LLMService
        llm = LLMService()
        response = llm.generate_response(df, query, {})
        return {'success': True, 'response': response}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["summary", "ملخص", "describe", "وصف"]):
            return {
                'success': True,
                'response': f"📊 Data Summary:\n• Rows: {len(df):,}\n• Columns: {len(df.columns)}\n• Column names: {', '.join(df.columns[:10])}\n\n💡 Add OPENAI_API_KEY to .env for AI responses."
            }
        elif any(word in query_lower for word in ["hi", "hello", "مرحبا"]):
            return {
                'success': True,
                'response': f"👋 Hello! I'm DataScout, your AI data analyst.\n\n📊 Dataset: {len(df):,} rows × {len(df.columns)} columns\n\nAsk me anything!"
            }
        else:
            return {
                'success': True,
                'response': f"💬 You asked: '{query}'\n\n📊 Dataset: {len(df):,} rows × {len(df.columns)} columns\n\nTry: 'summary' for overview."
            }

# ==================== SESSION ====================

@router.get("/session/{session_id}")
async def session_info(session_id: str):
    df = data_service.get_data(session_id)
    if df is None:
        raise HTTPException(404, "Session not found")
    
    return {
        "success": True,
        "session_id": session_id,
        "info": {
            'rows': len(df),
            'columns': len(df.columns),
            'column_names': list(df.columns),
            'numeric_columns': list(df.select_dtypes(include=['number']).columns)
        }
    }