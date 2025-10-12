"""
Family Hub Backend - Main Application
Location: backend/main.py
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Import database initialization
from shared.database import init_db

# Import routers
from services.calendar.routes import router as calendar_router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("🚀 Family Hub API starting up...")
    
    # Initialize database tables
    print("📊 Initializing database...")
    await init_db()
    print("✅ Database initialized")
    
    yield
    
    print("🛑 Family Hub API shutting down...")

app = FastAPI(
    title="Family Hub API",
    description="API for family organization system",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Family Hub API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }

# API health check
@app.get("/api/v1/health")
async def health_check():
    """API health check"""
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "database": "connected"
    }

# Mount routers
app.include_router(
    calendar_router,
    prefix="/api/v1/calendar",
    tags=["Calendar"]
)

# Add more routers here as you build them
# app.include_router(tasks_router, prefix="/api/v1/tasks", tags=["Tasks"])
# app.include_router(meals_router, prefix="/api/v1/meals", tags=["Meals"])
# app.include_router(shopping_router, prefix="/api/v1/shopping", tags=["Shopping"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )