# request_models.py - Pydantic models for requests/responses
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from enum import Enum

class TaskType(str, Enum):
    SUMMARY = "summary"
    PLOT = "plot"
    ML_TRAIN = "ml_train"
    DATA_QUALITY = "data_quality"
    STATISTICS = "statistics"
    AUTOML = "automl"
    GENERAL = "general"

class QueryRequest(BaseModel):
    session_id: str = Field(..., description="Session ID from upload")
    query: str = Field(..., min_length=1, max_length=2000, description="Natural language query")
    
    @validator('query')
    def validate_query(cls, v):
        if not v or not v.strip():
            raise ValueError('Query cannot be empty')
        return v.strip()

class UploadResponse(BaseModel):
    success: bool
    session_id: str
    filename: str
    rows: int
    columns: int
    message: str

class QueryResponse(BaseModel):
    success: bool
    task_type: str
    data: Dict[str, Any]
    message: str
    error: Optional[str] = None