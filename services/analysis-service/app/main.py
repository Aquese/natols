# services/analysis-service/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.routes import analysis, health
from app.config import settings

app = FastAPI(
    title="Natols Analysis Service",
    description="AI-powered stock analysis using Ollama",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])

@app.on_event("startup")
async def startup_event():
    print(f"Analysis Service starting on {settings.HOST}:{settings.PORT}")
    print(f"Ollama endpoint: {settings.OLLAMA_URL}")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )