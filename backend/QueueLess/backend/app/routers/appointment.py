from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.schemas.appointment import AppointmentCreate, AppointmentResponse
from app.services.firebase_db import create_document, filter_documents, get_document, list_documents, update_document

router = APIRouter(
    tags=["Appointment"]
)

APPOINTMENTS_COLLECTION = "appointments"
DOCTORS_COLLECTION = "doctors"
PATIENTS_COLLECTION = "patients"
NOTIFICATIONS_COLLECTION = "notifications"


def _parse_appointment_datetime(appointment: dict) -> datetime:
    appointment_date = appointment.get("appointment_date")
    appointment_time = appointment.get("appointment_time")
    date_str = appointment_date.isoformat() if hasattr(appointment_date, "isoformat") and not isinstance(appointment_date, str) else str(appointment_date)
    time_str = appointment_time.isoformat() if hasattr(appointment_time, "isoformat") and not isinstance(appointment_time, str) else str(appointment_time)
    if len(time_str) == 5:
        time_str = f"{time_str}:00"
    return datetime.fromisoformat(f"{date_str}T{time_str}")


def _serialize_appointment(appointment: dict, include_doctor: bool = False, include_patient: bool = False) -> dict:
    serialized = {**appointment}
    if include_doctor:
        doctor = get_document(DOCTORS_COLLECTION, appointment.get("doctor_id"))
        if doctor:
            serialized["doctor"] = {
                "id": doctor["id"],
                "name": doctor.get("name"),
                "specialization": doctor.get("specialization"),
            }
    if include_patient:
        patient = get_document(PATIENTS_COLLECTION, appointment.get("patient_id"))
        if patient:
            serialized["patient"] = {
                "id": patient["id"],
                "name": patient.get("name"),
                "mobile": patient.get("mobile"),
                "age": patient.get("age"),
                "gender": patient.get("gender"),
            }
    return serialized


# =========================
# Book Appointment Request
# =========================

@router.post(
    "/book",
    response_model=AppointmentResponse
)
def book_appointment(
    appointment: AppointmentCreate,
):

    doctor = get_document(DOCTORS_COLLECTION, appointment.doctor_id)

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    patient = get_document(PATIENTS_COLLECTION, appointment.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    existing_appointment = next(
        (
            item for item in list_documents(APPOINTMENTS_COLLECTION)
            if item.get("doctor_id") == appointment.doctor_id
            and str(item.get("appointment_date")) == appointment.appointment_date.isoformat()
            and str(item.get("appointment_time")) == appointment.appointment_time.isoformat()
            and item.get("status") in {"pending", "confirmed"}
        ),
        None,
    )

    if existing_appointment:
        raise HTTPException(
            status_code=400,
            detail="Slot already booked"
        )

    new_appointment = create_document(
        APPOINTMENTS_COLLECTION,
        {
            "patient_id": appointment.patient_id,
            "doctor_id": appointment.doctor_id,
            "appointment_date": appointment.appointment_date,
            "appointment_time": appointment.appointment_time,
            "symptoms": appointment.symptoms,
            "status": "pending",
            "token_number": None,
            "queue_position": None,
            "estimated_wait_time": None,
            "notes": None,
            "rating": None,
            "created_at": datetime.utcnow(),
        },
    )

    create_document(
        NOTIFICATIONS_COLLECTION,
        {
            "user_role": "doctor",
            "user_id": appointment.doctor_id,
            "appointment_id": new_appointment["id"],
            "message": f"New appointment request from {patient.get('name') or f'Patient {appointment.patient_id}'} on {appointment.appointment_date} at {appointment.appointment_time}.",
            "is_read": False,
            "created_at": datetime.utcnow(),
        },
    )

    return _serialize_appointment(new_appointment)


# =========================
# Doctor Approves Appointment
# =========================

@router.put(
    "/approve/{appointment_id}",
    response_model=AppointmentResponse
)
def approve_appointment(
    appointment_id: int,
    doctor_id: int,
):
    appointment = get_document(APPOINTMENTS_COLLECTION, appointment_id)

    if not appointment or appointment.get("doctor_id") != doctor_id:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    if appointment.get("status") != "pending":
        raise HTTPException(
            status_code=400,
            detail="Appointment already processed"
        )

    doctor = get_document(DOCTORS_COLLECTION, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    confirmed_appointments = [
        item for item in list_documents(APPOINTMENTS_COLLECTION)
        if item.get("doctor_id") == doctor_id
        and str(item.get("appointment_date")) == str(appointment.get("appointment_date"))
        and item.get("status") == "confirmed"
    ]
    confirmed_appointments.append({**appointment, "status": "confirmed"})
    confirmed_appointments.sort(key=lambda item: (_parse_appointment_datetime(item), str(item.get("created_at", "")), item.get("id")))

    for index, item in enumerate(confirmed_appointments, start=1):
        update_document(
            APPOINTMENTS_COLLECTION,
            item["id"],
            {
                "status": "confirmed",
                "token_number": index,
                "queue_position": index,
                "estimated_wait_time": (index - 1) * int(doctor.get("average_consultation_time") or 15),
            },
        )

    updated_appointment = get_document(APPOINTMENTS_COLLECTION, appointment_id)
    create_document(
        NOTIFICATIONS_COLLECTION,
        {
            "user_role": "patient",
            "user_id": updated_appointment["patient_id"],
            "appointment_id": updated_appointment["id"],
            "message": f"Your appointment with Dr. {doctor.get('name')} on {updated_appointment.get('appointment_date')} at {updated_appointment.get('appointment_time')} has been confirmed.",
            "is_read": False,
            "created_at": datetime.utcnow(),
        },
    )

    return _serialize_appointment(updated_appointment, include_doctor=True, include_patient=True)


# =========================
# Doctor Rejects Appointment
# =========================

@router.put(
    "/reject/{appointment_id}",
    response_model=dict
)
def reject_appointment(
    appointment_id: int,
    doctor_id: int,
):
    appointment = get_document(APPOINTMENTS_COLLECTION, appointment_id)

    if not appointment or appointment.get("doctor_id") != doctor_id:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    update_document(APPOINTMENTS_COLLECTION, appointment_id, {"status": "rejected"})

    doctor = get_document(DOCTORS_COLLECTION, appointment.get("doctor_id"))
    create_document(
        NOTIFICATIONS_COLLECTION,
        {
            "user_role": "patient",
            "user_id": appointment.get("patient_id"),
            "appointment_id": appointment_id,
            "message": f"Your appointment with Dr. {doctor.get('name') if doctor else appointment.get('doctor_id')} on {appointment.get('appointment_date')} at {appointment.get('appointment_time')} has been rejected.",
            "is_read": False,
            "created_at": datetime.utcnow(),
        },
    )

    return {
        "message": "Appointment rejected"
    }


def _mark_completed_appointments(appointments: list[dict]):
    now = datetime.now()
    normalized = []

    for appointment in appointments:
        current = appointment
        if appointment.get("status") == "confirmed":
            appointment_datetime = _parse_appointment_datetime(appointment)
            if now >= appointment_datetime:
                current = update_document(APPOINTMENTS_COLLECTION, appointment["id"], {"status": "completed"}) or appointment
        normalized.append(current)

    return normalized


# =========================
# Get Patient Appointments
# =========================

@router.get(
    "/patient/{patient_id}",
    response_model=list[AppointmentResponse]
)
def get_patient_appointments(
    patient_id: int,
):
    appointments = filter_documents(
        APPOINTMENTS_COLLECTION,
        lambda item: item.get("patient_id") == patient_id,
    )
    return [_serialize_appointment(appointment, include_doctor=True) for appointment in _mark_completed_appointments(appointments)]


# =========================
# Patient rates a completed appointment
# =========================

@router.put(
    "/rate/{appointment_id}",
    response_model=AppointmentResponse
)
def rate_appointment(
    appointment_id: int,
    patient_id: int,
    rating: int,
):

    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5"
        )

    appointment = get_document(APPOINTMENTS_COLLECTION, appointment_id)

    if not appointment or appointment.get("patient_id") != patient_id:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    appointment = _mark_completed_appointments([appointment])[0]

    if appointment.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail="Only completed consultations can be rated"
        )

    updated = update_document(APPOINTMENTS_COLLECTION, appointment_id, {"rating": rating})
    return _serialize_appointment(updated, include_doctor=True)

# =========================
# Get Doctor Appointments
# =========================

@router.get(
    "/doctor/{doctor_id}"
)
def get_doctor_appointments(
    doctor_id: int,
):
    appointments = filter_documents(
        APPOINTMENTS_COLLECTION,
        lambda item: item.get("doctor_id") == doctor_id,
    )
    return [_serialize_appointment(appointment, include_patient=True) for appointment in _mark_completed_appointments(appointments)]
