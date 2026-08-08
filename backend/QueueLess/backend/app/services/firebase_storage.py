from uuid import uuid4

from firebase_admin import storage

from app.config import FIREBASE_STORAGE_BUCKET, FIREBASE_STORAGE_UPLOAD_ENABLED
from app.services.firebase_app import get_firebase_app


def upload_dmho_certificate(file_bytes: bytes, original_filename: str, content_type: str) -> str | None:
    if not FIREBASE_STORAGE_UPLOAD_ENABLED:
        return None

    bucket_name = FIREBASE_STORAGE_BUCKET.strip()
    if not bucket_name:
        return None

    get_firebase_app()

    extension = ".jpg"
    if "." in original_filename:
        extension = "." + original_filename.split(".")[-1].lower()

    object_path = f"dmho/{uuid4().hex}{extension}"

    bucket = storage.bucket(bucket_name)
    blob = bucket.blob(object_path)
    # Fail fast on storage connectivity issues so the caller can fallback to local storage.
    blob.upload_from_string(
        file_bytes,
        content_type=content_type or "image/jpeg",
        timeout=10,
        retry=None,
    )

    # Returns a direct URL to the object; access depends on bucket IAM rules.
    return f"gs://{bucket_name}/{object_path}"
