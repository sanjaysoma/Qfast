from dotenv import load_dotenv
import os
from pathlib import Path
from urllib.parse import quote_plus


def _env_flag(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}

# Load environment variables
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# =========================
# DATABASE CONFIG
# =========================

USER = os.getenv("user")

PASSWORD = os.getenv("password")

HOST = os.getenv("host")

PORT = os.getenv("port")

DBNAME = os.getenv("dbname")

SUPABASE_POOLER_HOST = os.getenv("SUPABASE_POOLER_HOST", "").strip()
SUPABASE_POOLER_PORT = os.getenv("SUPABASE_POOLER_PORT", "6543").strip()
DB_SSLMODE = os.getenv("DB_SSLMODE", "require").strip()

DATABASE_URL = os.getenv("DATABASE_URL")
USE_FIREBASE_DATABASE = _env_flag("USE_FIREBASE_DATABASE", "false")

import re
if DATABASE_URL:
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

    if "supabase" in DATABASE_URL:
        if "sslmode=" not in DATABASE_URL:
            separator = "&" if "?" in DATABASE_URL else "?"
            DATABASE_URL = f"{DATABASE_URL}{separator}sslmode=require"

        match = re.search(r"@db\.([a-z0-9]+)\.supabase\.co(?::\d+)?", DATABASE_URL)
        if match:
            ref = match.group(1)
            pooler_host = SUPABASE_POOLER_HOST or "aws-0-ap-northeast-1.pooler.supabase.com"
            pooler_port = SUPABASE_POOLER_PORT or "6543"
            DATABASE_URL = re.sub(
                rf"@db\.{ref}\.supabase\.co(?::\d+)?",
                f"@{pooler_host}:{pooler_port}",
                DATABASE_URL
            )
            if "://postgres:" in DATABASE_URL:
                DATABASE_URL = DATABASE_URL.replace("://postgres:", f"://postgres.{ref}:")

if not DATABASE_URL and USER and PASSWORD and HOST and PORT and DBNAME:
    encoded_user = quote_plus(USER)
    encoded_password = quote_plus(PASSWORD)
    selected_host = HOST.strip()
    selected_port = PORT.strip()

    # Supabase direct DB hosts are often IPv6-only in some networks.
    # If pooler host is provided, prefer it for better connectivity.
    if selected_host.endswith(".supabase.co") and SUPABASE_POOLER_HOST:
        selected_host = SUPABASE_POOLER_HOST
        selected_port = SUPABASE_POOLER_PORT or "6543"

    encoded_host = selected_host
    encoded_port = selected_port
    encoded_dbname = quote_plus(DBNAME)
    query_suffix = f"?sslmode={quote_plus(DB_SSLMODE)}" if DB_SSLMODE else ""
    DATABASE_URL = (
        f"postgresql+psycopg2://{encoded_user}:{encoded_password}@"
        f"{encoded_host}:{encoded_port}/{encoded_dbname}{query_suffix}"
    )

if not USE_FIREBASE_DATABASE and not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is not configured. Set DATABASE_URL or user/password/host/port/dbname env vars."
    )

DB_INIT_ON_STARTUP = _env_flag("DB_INIT_ON_STARTUP", "true")
DB_REQUIRED_ON_STARTUP = _env_flag("DB_REQUIRED_ON_STARTUP", "true")
# =========================
# JWT CONFIG
# =========================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "supersecretkey"
)

FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")
FIREBASE_SERVICE_ACCOUNT_JSON = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "")
FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL", "")
FIREBASE_STORAGE_UPLOAD_ENABLED = _env_flag("FIREBASE_STORAGE_UPLOAD_ENABLED", "false")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60

MSG91_AUTH_KEY = os.getenv("MSG91_AUTH_KEY", "")
MSG91_TEMPLATE_ID = os.getenv("MSG91_TEMPLATE_ID", "")
MSG91_COUNTRY_CODE = os.getenv("MSG91_COUNTRY_CODE", "91")
MSG91_FORCE_IPV4 = _env_flag("MSG91_FORCE_IPV4", "true")
OTP_TOKEN_EXPIRE_MINUTES = int(os.getenv("OTP_TOKEN_EXPIRE_MINUTES", "15"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "dmho-certificates")