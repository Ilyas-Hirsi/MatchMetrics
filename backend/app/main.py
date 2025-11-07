from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.utils.database import init_db
from app.api import auth, users, matchups, champions
from config.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(" Starting League Analytics API...")
    init_db()
    yield
    # Shutdown
    print(" Shutting down League Analytics API...")


app = FastAPI(
    title="League Analytics API",
    description="A comprehensive League of Legends analytics platform similar to u.gg",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React/Vue dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(matchups.router)
app.include_router(champions.router)


@app.get("/")
async def root():
    return {
        "message": "League Analytics API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=settings.DEBUG
    )
