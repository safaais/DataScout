# main.py - Application entry point
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .api import routes
from .core.logger import logger
from .config import Config

app = FastAPI(
    title="Chat with Data API",
    description="AI Agent that analyzes data, runs AutoML, and answers natural language queries",
    version="2.0.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error", "message": str(exc)}
    )

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 50)
    logger.info("🚀 Chat with Data API v2.0.0")
    logger.info(f"📍 Host: {Config.HOST}:{Config.PORT}")
    logger.info(f"🔐 OpenAI: {'Enabled' if Config.OPENAI_API_KEY else 'Disabled'}")
    logger.info(f"🤖 TabPFN: {'Enabled' if Config.USE_TABPFN else 'Disabled'}")
    logger.info(f"📁 Upload dir: {Config.UPLOAD_DIR}")
    logger.info(f"📁 Models dir: {Config.MODEL_DIR}")
    logger.info("=" * 50)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Chat with Data API shutting down...")

@app.get("/")
async def root():
    return {
        "service": "Chat with Data - Agent API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/api/v1/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",   # ← ← ← ✅ التعديل هنا
        host=Config.HOST,
        port=Config.PORT,
        reload=Config.DEBUG
    )