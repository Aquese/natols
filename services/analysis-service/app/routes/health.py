# services/analysis-service/app/routes/health.py
from fastapi import APIRouter, HTTPException
from datetime import datetime
import httpx
from app.config import settings

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "analysis-service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check including Ollama connectivity"""
    health_status = {
        "status": "healthy",
        "service": "analysis-service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "components": {}
    }
    
    # Check Ollama connectivity
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.OLLAMA_URL}/api/tags")
            if response.status_code == 200:
                health_status["components"]["ollama"] = {
                    "status": "healthy",
                    "url": settings.OLLAMA_URL,
                    "model": settings.OLLAMA_MODEL
                }
            else:
                health_status["components"]["ollama"] = {
                    "status": "unhealthy",
                    "error": f"HTTP {response.status_code}"
                }
                health_status["status"] = "degraded"
    except Exception as e:
        health_status["components"]["ollama"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    return health_status

@router.get("/models")
async def list_available_models():
    """List available Ollama models"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{settings.OLLAMA_URL}/api/tags")
            response.raise_for_status()
            data = response.json()
            
            models = []
            for model in data.get("models", []):
                models.append({
                    "name": model.get("name"),
                    "size": model.get("size"),
                    "modified": model.get("modified_at")
                })
            
            return {
                "success": True,
                "current_model": settings.OLLAMA_MODEL,
                "available_models": models
            }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to fetch models: {str(e)}")