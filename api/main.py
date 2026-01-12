from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import create_db_and_tables
from .routes import router

app = FastAPI(title="Academic Review Tracker API")

# Allow CORS for development (and Vercel frontend)
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000", # Allow local api calls
    # Add production URL later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For Vercel preview environments, simpler to allow all or restricted subset
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

app.include_router(router, prefix="/api")

