import os
from sqlmodel import SQLModel, create_engine, Session

# Fallback to sqlite for local dev if POSTGRES_URL not set
DATABASE_URL = os.environ.get("POSTGRES_URL")
if not DATABASE_URL:
    # Use SQLite for local testing if no Postgres URL is provided
    # Warning: Vercel requires Postgres
    DATABASE_URL = "sqlite:///./database.db"

# Handle 'postgres://' vs 'postgresql://' for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
