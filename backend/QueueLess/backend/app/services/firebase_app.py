import json

import firebase_admin
from fastapi import HTTPException
from firebase_admin import credentials, db

from app.config import (
    FIREBASE_DATABASE_URL,
    FIREBASE_SERVICE_ACCOUNT_JSON,
    FIREBASE_SERVICE_ACCOUNT_PATH,
    FIREBASE_STORAGE_BUCKET,
)


def get_firebase_app():
    if firebase_admin._apps:
        return firebase_admin.get_app()

    options = {}
    if FIREBASE_STORAGE_BUCKET.strip():
        options["storageBucket"] = FIREBASE_STORAGE_BUCKET.strip()
    if FIREBASE_DATABASE_URL.strip():
        options["databaseURL"] = FIREBASE_DATABASE_URL.strip()

    if FIREBASE_SERVICE_ACCOUNT_JSON.strip():
        try:
            service_account_info = json.loads(FIREBASE_SERVICE_ACCOUNT_JSON)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=500,
                detail="FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON"
            ) from exc
        return firebase_admin.initialize_app(
            credentials.Certificate(service_account_info),
            options=options or None,
        )

    if FIREBASE_SERVICE_ACCOUNT_PATH.strip():
        try:
            return firebase_admin.initialize_app(
                credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH.strip()),
                options=options or None,
            )
        except OSError as exc:
            raise HTTPException(
                status_code=500,
                detail="Firebase service account file could not be loaded"
            ) from exc

    raise HTTPException(
        status_code=500,
        detail="Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON."
    )


def get_realtime_db_root():
    return db.reference("/", app=get_firebase_app())


# Backward-compatible alias used by existing imports.
def get_firestore_client():
    return get_realtime_db_root()
