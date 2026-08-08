from fastapi import APIRouter, HTTPException

from app.schemas.hospital import HospitalResponse
from app.services.firebase_db import filter_documents, get_document, list_documents

router = APIRouter(
    prefix="/area",
    tags=["Area"]
)

PATIENTS_COLLECTION = "patients"
HOSPITALS_COLLECTION = "hospitals"
DOCTORS_COLLECTION = "doctors"
APPOINTMENTS_COLLECTION = "appointments"


@router.get("/hospitals/my-area/{patient_id}", response_model=list[HospitalResponse])
def hospitals_my_area(patient_id: int):
    patient = get_document(PATIENTS_COLLECTION, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    district = (patient.get("district") or "").strip().lower()
    if not district:
        return []

    hospitals = filter_documents(
        HOSPITALS_COLLECTION,
        lambda item: str(item.get("district", "")).strip().lower() == district,
    )
    return hospitals


@router.get("/doctors/my-area/{patient_id}")
def doctors_my_area(patient_id: int):
    patient = get_document(PATIENTS_COLLECTION, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    district = (patient.get("district") or "").strip().lower()
    if not district:
        return []

    hospitals = {
        hospital["id"]: hospital
        for hospital in filter_documents(
            HOSPITALS_COLLECTION,
            lambda item: str(item.get("district", "")).strip().lower() == district,
        )
    }
    doctors = filter_documents(
        DOCTORS_COLLECTION,
        lambda item: bool(item.get("is_available", True)) and item.get("hospital_id") in hospitals,
    )
    appointments = list_documents(APPOINTMENTS_COLLECTION)

    result = []

    for doctor in doctors:
        queue_count = sum(
            1
            for appointment in appointments
            if appointment.get("doctor_id") == doctor["id"] and appointment.get("status") in {"pending", "confirmed"}
        )

        estimated_wait = queue_count * int(doctor.get("average_consultation_time") or 15)
        hospital = hospitals.get(doctor.get("hospital_id"))

        result.append({
            "doctor_name": doctor.get("name"),
            "specialization": doctor.get("specialization"),
            "hospital_name": hospital.get("name") if hospital else None,
            "queue_count": queue_count,
            "estimated_wait_time": estimated_wait,
            "doctor_id": doctor["id"],
        })

    result.sort(key=lambda x: x["estimated_wait_time"])

    return result
