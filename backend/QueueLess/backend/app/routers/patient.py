from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.services.firebase_db import create_document, find_first, get_document, update_document
from app.schemas.patient import (
    PatientCreate,
    PatientResponse
)
from app.schemas.profile import PatientUpdate

router = APIRouter(
    tags=["Patient"]
)

PATIENTS_COLLECTION = "patients"


# Register Patient
@router.post(
    "/register",
    response_model=PatientResponse
)
def register_patient(
    patient: PatientCreate,
):
    existing_user = find_first(
        PATIENTS_COLLECTION,
        lambda item: str(item.get("mobile", "")).strip() == patient.mobile.strip(),
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Mobile already registered"
        )

    new_patient = create_document(
        PATIENTS_COLLECTION,
        {
            "name": patient.name.strip(),
            "mobile": patient.mobile.strip(),
            "age": patient.age,
            "gender": patient.gender,
            "state": patient.state,
            "district": patient.district,
            "address": patient.address,
            "is_active": True,
            "created_at": datetime.utcnow(),
        },
    )

    return new_patient


@router.put(
    "/{patient_id}",
    response_model=PatientResponse
)
def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
):
    patient = get_document(PATIENTS_COLLECTION, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    updates = patient_update.dict(exclude_unset=True)
    updated = update_document(PATIENTS_COLLECTION, patient_id, updates)
    return updated