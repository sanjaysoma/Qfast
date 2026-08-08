from uuid import uuid4
from typing import Any

from app.config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET, SUPABASE_URL

try:
    from supabase import create_client
except Exception:  # pragma: no cover - handled at runtime if dependency is missing
    create_client = None  # type: ignore[assignment]


_supabase_client = None


def _get_client() -> Any | None:
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or create_client is None:
        return None

    _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_client


def upload_dmho_certificate(file_bytes: bytes, original_filename: str, content_type: str) -> str | None:
    client = _get_client()
    if client is None:
        return None

    extension = ".jpg"
    if "." in original_filename:
        extension = "." + original_filename.split(".")[-1].lower()

    object_path = f"dmho/{uuid4().hex}{extension}"

    # Keep uploads idempotent-safe with random object names and no upsert.
    response = client.storage.from_(SUPABASE_STORAGE_BUCKET).upload(
        object_path,
        file_bytes,
        {
            "content-type": content_type or "image/jpeg",
            "upsert": "false",
        },
    )

    if isinstance(response, dict) and response.get("error"):
        raise RuntimeError(f"Supabase upload failed: {response['error']}")

    public_url_data = client.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(object_path)

    if isinstance(public_url_data, dict):
        return public_url_data.get("publicURL") or public_url_data.get("publicUrl")

    return str(public_url_data)
