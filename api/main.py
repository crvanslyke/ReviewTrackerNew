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

# Debugging: Return detail of 500 errors
from fastapi.responses import JSONResponse
@app.exception_handler(500)
async def internal_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"message": f"Internal Server Error: {str(exc)}"},
    )
    
@app.exception_handler(Exception)
async def catch_all_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server Error: {str(exc)}"},
    )

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def read_root():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/index.html")

app.include_router(router, prefix="/api")

