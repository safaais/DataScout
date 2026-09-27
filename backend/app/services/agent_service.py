# agent_service.py - Agent as a Service
import pandas as pd
import asyncio
import aiohttp
import io
from typing import Dict, Any, Optional
import uuid
import joblib
from pathlib import Path

from ..services.data_service import DataService
from ..services.ml_service import MLService
from ..services.llm_service import LLMService
from ..core.logger import logger
from ..config import Config

class AgentService:
    """Agent-as-a-Service - External applications can call this API"""
    
    def __init__(self):
        self.data_service = DataService()
        self.ml_service = MLService()
        self.llm_service = LLMService()
        
    async def analyze_data(self, file_url: str, file_type: str) -> Dict[str, Any]:
        """Analyze data from a URL"""
        try:
            df = await self._download_data(file_url, file_type)
            session_id = str(uuid.uuid4())
            self.data_service.store_data(session_id, df)
            summary = self.data_service.get_summary(df)
            
            return {
                "success": True,
                "session_id": session_id,
                "analysis": summary,
                "rows": len(df),
                "columns": len(df.columns),
                "message": f"Data analyzed: {len(df)} rows, {len(df.columns)} columns"
            }
        except Exception as e:
            logger.error(f"Agent analyze error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def run_automl(self, session_id: str, target_column: Optional[str] = None) -> Dict[str, Any]:
        """Run AutoML on existing session data"""
        try:
            df = self.data_service.get_data(session_id)
            if df is None:
                return {"success": False, "error": "Session not found"}
            
            result = self.ml_service.run_automl(df, target_column)
            
            return {
                "success": True,
                "session_id": session_id,
                "best_model": result['best_model'],
                "accuracy": result['best_score'],
                "task_type": result['task_type'],
                "all_models": result['all_results'],
                "feature_importance": result.get('feature_importance', {}),
                "model_path": result['model_path']
            }
        except Exception as e:
            logger.error(f"Agent AutoML error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def predict(self, session_id: str, new_data: Dict) -> Dict[str, Any]:
        """Make predictions using trained model"""
        try:
            model_path = Config.MODEL_DIR / "best_model.pkl"
            if not model_path.exists():
                return {"success": False, "error": "No trained model found. Run AutoML first."}
            
            model_data = joblib.load(model_path)
            model = model_data['model']
            feature_cols = model_data['feature_columns']
            scaler = model_data['scaler']
            
            df_input = pd.DataFrame([new_data])
            for col in feature_cols:
                if col not in df_input.columns:
                    df_input[col] = 0
            
            df_input = df_input[feature_cols]
            df_input = df_input.fillna(df_input.mean())
            X_scaled = scaler.transform(df_input)
            prediction = model.predict(X_scaled)
            
            return {
                "success": True,
                "prediction": prediction.tolist(),
                "features_used": feature_cols
            }
        except Exception as e:
            logger.error(f"Agent predict error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def chat_query(self, session_id: str, query: str) -> Dict[str, Any]:
        """Natural language query on data"""
        try:
            df = self.data_service.get_data(session_id)
            if df is None:
                return {"success": False, "error": "Session not found"}
            
            response = self.llm_service.generate_response(df, query, {})
            
            return {
                "success": True,
                "session_id": session_id,
                "query": query,
                "response": response
            }
        except Exception as e:
            logger.error(f"Agent chat error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _download_data(self, url: str, file_type: str) -> pd.DataFrame:
        """Download and parse data from URL"""
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise Exception(f"Failed to download file: HTTP {response.status}")
                content = await response.read()
                
                if file_type == 'csv':
                    return pd.read_csv(io.BytesIO(content))
                elif file_type == 'excel':
                    return pd.read_excel(io.BytesIO(content))
                else:
                    raise ValueError(f"Unsupported file type: {file_type}")