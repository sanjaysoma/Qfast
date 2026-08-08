from fastapi import APIRouter, HTTPException

from app.schemas.notification import NotificationResponse
from app.services.firebase_db import filter_documents, get_document, update_document

router = APIRouter(
    tags=["Notification"]
)

NOTIFICATIONS_COLLECTION = "notifications"


@router.get(
    "/patient/{patient_id}",
    response_model=list[NotificationResponse]
)
def get_patient_notifications(
    patient_id: int,
):
    notifications = filter_documents(
        NOTIFICATIONS_COLLECTION,
        lambda item: item.get("user_role") == "patient" and item.get("user_id") == patient_id,
    )
    notifications.sort(key=lambda item: item.get("created_at", ""), reverse=True)
    return notifications


@router.get(
    "/doctor/{doctor_id}",
    response_model=list[NotificationResponse]
)
def get_doctor_notifications(
    doctor_id: int,
):
    notifications = filter_documents(
        NOTIFICATIONS_COLLECTION,
        lambda item: item.get("user_role") == "doctor" and item.get("user_id") == doctor_id,
    )
    notifications.sort(key=lambda item: item.get("created_at", ""), reverse=True)
    return notifications


@router.put(
    "/mark-read/{notification_id}",
    response_model=NotificationResponse
)
def mark_notification_read(
    notification_id: int,
):
    notification = get_document(NOTIFICATIONS_COLLECTION, notification_id)
    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )
    return update_document(NOTIFICATIONS_COLLECTION, notification_id, {"is_read": True})
