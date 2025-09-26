from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from datetime import datetime

from .routers import ml, mesh, analytics, health
from .core.config import settings

# Initialize FastAPI app
app = FastAPI(
    title="Disaster Management ML Services",
    description="AI/ML services for flood and disaster management platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(ml.router, prefix="/ml", tags=["machine-learning"])
app.include_router(mesh.router, prefix="/mesh", tags=["mesh-network"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Disaster Management ML Services",
        "version": "1.0.0",
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "health": "/health",
            "ml_services": "/ml",
            "mesh_network": "/mesh", 
            "analytics": "/analytics",
            "docs": "/docs"
        },
        "ml_models": {
            "hazard_classification": "CNN + CLIP",
            "flood_prediction": "LSTM + Weather APIs",
            "rescue_prioritization": "Multi-factor scoring",
            "safe_zone_recommendation": "Graph algorithms"
        },
        "communication": {
            "mesh_simulation": "BLE + Wi-Fi",
            "lora_gateway": "Laptop emulation",
            "convex_integration": "Real-time sync"
        }
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info"
    )