from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from urllib.parse import urlsplit, urlunsplit

from app.config import DATABASE_URL, USE_FIREBASE_DATABASE


def _mask_database_url(url: str) -> str:
    try:
        parts = urlsplit(url)
        if parts.password is None:
            return url
        safe_netloc = parts.netloc.replace(f":{parts.password}@", ":***@")
        return urlunsplit((parts.scheme, safe_netloc, parts.path, parts.query, parts.fragment))
    except Exception:
        return "<unavailable>"

print("===================================")
print("Connected Database URL:")
print(_mask_database_url(DATABASE_URL))
print("===================================")

Base = declarative_base()

engine = None

if DATABASE_URL:
    connect_args = {}
    if DATABASE_URL.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        engine = create_engine(
            DATABASE_URL,
            connect_args=connect_args
        )
    else:
        connect_args["connect_timeout"] = 10
        engine = create_engine(
            DATABASE_URL,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_recycle=300
        )

    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
else:
    # Allow Firebase-only mode without requiring SQL configuration at import time.
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
    )


# Dependency for database session
def get_db():

    if engine is None and not USE_FIREBASE_DATABASE:
        raise RuntimeError("Database engine is not configured. Set DATABASE_URL for SQL mode.")

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()