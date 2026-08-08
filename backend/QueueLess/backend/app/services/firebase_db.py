from __future__ import annotations

from datetime import date, datetime, time
from random import randint
from time import time_ns
from typing import Any, Callable

from app.config import USE_FIREBASE_DATABASE
from app.database import SessionLocal
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.hospital import Hospital
from app.models.notification import Notification
from app.models.patient import Patient
from app.models.user import User
from app.services.firebase_app import get_realtime_db_root

def _serialize_value(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, time):
        return value.isoformat()
    if isinstance(value, list):
        return [_serialize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _serialize_value(item) for key, item in value.items()}
    return value


def _deserialize_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _deserialize_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_deserialize_value(item) for item in value]
    return value


def _collection_ref(collection_name: str):
    return get_realtime_db_root().child(collection_name)


MODEL_BY_COLLECTION = {
    "users": User,
    "patients": Patient,
    "doctors": Doctor,
    "hospitals": Hospital,
    "appointments": Appointment,
    "notifications": Notification,
}


def _model_for_collection(collection_name: str):
    model = MODEL_BY_COLLECTION.get(collection_name)
    if model is None:
        raise ValueError(f"Unsupported collection for SQL backend: {collection_name}")
    return model


def _row_to_dict(row: Any) -> dict[str, Any]:
    return {column.name: getattr(row, column.name) for column in row.__table__.columns}


def _sanitize_payload_for_model(model: Any, payload: dict[str, Any]) -> dict[str, Any]:
    allowed = {column.name for column in model.__table__.columns}
    return {key: value for key, value in payload.items() if key in allowed}


def next_id(collection_name: str) -> int:
    if not USE_FIREBASE_DATABASE:
        model = _model_for_collection(collection_name)
        db = SessionLocal()
        try:
            latest = db.query(model).order_by(model.id.desc()).first()
            return int((latest.id if latest else 0) + 1)
        finally:
            db.close()

    # RTDB transactions can be slow under poor network conditions; use a fast
    # time-based numeric id to keep write latency predictable.
    return int(f"{time_ns() // 1_000_000}{randint(100, 999)}")


def list_documents(collection_name: str) -> list[dict[str, Any]]:
    if not USE_FIREBASE_DATABASE:
        model = _model_for_collection(collection_name)
        db = SessionLocal()
        try:
            rows = db.query(model).all()
            return [_row_to_dict(row) for row in rows]
        finally:
            db.close()

    raw = _collection_ref(collection_name).get() or {}
    documents: list[dict[str, Any]] = []
    if isinstance(raw, dict):
        entries = raw.items()
    elif isinstance(raw, list):
        entries = ((index, value) for index, value in enumerate(raw) if value is not None)
    else:
        entries = []

    for key, value in entries:
        payload = value or {}
        payload["id"] = int(payload.get("id") or key)
        documents.append(_deserialize_value(payload))
    documents.sort(key=lambda item: int(item.get("id", 0)))
    return documents


def get_document(collection_name: str, document_id: int) -> dict[str, Any] | None:
    if not USE_FIREBASE_DATABASE:
        model = _model_for_collection(collection_name)
        db = SessionLocal()
        try:
            row = db.query(model).filter(model.id == int(document_id)).first()
            return _row_to_dict(row) if row else None
        finally:
            db.close()

    payload = _collection_ref(collection_name).child(str(document_id)).get()
    if payload is None:
        return None
    payload = payload or {}
    payload["id"] = int(payload.get("id") or document_id)
    return _deserialize_value(payload)


def create_document(collection_name: str, payload: dict[str, Any]) -> dict[str, Any]:
    if not USE_FIREBASE_DATABASE:
        model = _model_for_collection(collection_name)
        data = _sanitize_payload_for_model(model, {k: v for k, v in payload.items() if k != "id"})
        db = SessionLocal()
        try:
            row = model(**data)
            db.add(row)
            db.commit()
            db.refresh(row)
            return _row_to_dict(row)
        finally:
            db.close()

    document_id = next_id(collection_name)
    data = {"id": document_id, **payload}
    serialized = _serialize_value(data)
    _collection_ref(collection_name).child(str(document_id)).set(serialized)
    return data


def set_document(collection_name: str, document_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    if not USE_FIREBASE_DATABASE:
        model = _model_for_collection(collection_name)
        data = _sanitize_payload_for_model(model, {k: v for k, v in payload.items() if k != "id"})
        db = SessionLocal()
        try:
            row = db.query(model).filter(model.id == int(document_id)).first()
            if row is None:
                row = model(id=int(document_id), **data)
                db.add(row)
            else:
                for key, value in data.items():
                    if hasattr(row, key):
                        setattr(row, key, value)
            db.commit()
            db.refresh(row)
            return _row_to_dict(row)
        finally:
            db.close()

    data = {"id": document_id, **payload}
    _collection_ref(collection_name).child(str(document_id)).set(_serialize_value(data))
    return data


def update_document(collection_name: str, document_id: int, updates: dict[str, Any]) -> dict[str, Any] | None:
    if not USE_FIREBASE_DATABASE:
        model = _model_for_collection(collection_name)
        db = SessionLocal()
        try:
            row = db.query(model).filter(model.id == int(document_id)).first()
            if row is None:
                return None
            for key, value in updates.items():
                if key == "id":
                    continue
                if hasattr(row, key):
                    setattr(row, key, value)
            db.commit()
            db.refresh(row)
            return _row_to_dict(row)
        finally:
            db.close()

    existing = get_document(collection_name, document_id)
    if existing is None:
        return None
    merged = {**existing, **updates, "id": document_id}
    _collection_ref(collection_name).child(str(document_id)).set(_serialize_value(merged))
    return merged


def delete_document(collection_name: str, document_id: int) -> bool:
    if not USE_FIREBASE_DATABASE:
        model = _model_for_collection(collection_name)
        db = SessionLocal()
        try:
            row = db.query(model).filter(model.id == int(document_id)).first()
            if row is None:
                return False
            db.delete(row)
            db.commit()
            return True
        finally:
            db.close()

    current = _collection_ref(collection_name).child(str(document_id)).get()
    if current is None:
        return False
    _collection_ref(collection_name).child(str(document_id)).delete()
    return True


def find_first(collection_name: str, predicate: Callable[[dict[str, Any]], bool]) -> dict[str, Any] | None:
    for document in list_documents(collection_name):
        if predicate(document):
            return document
    return None


def filter_documents(collection_name: str, predicate: Callable[[dict[str, Any]], bool]) -> list[dict[str, Any]]:
    return [document for document in list_documents(collection_name) if predicate(document)]