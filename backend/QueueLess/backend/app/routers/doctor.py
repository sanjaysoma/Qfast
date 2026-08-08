from datetime import date, datetime, time

from fastapi import APIRouter, HTTPException

from app.schemas.doctor import DoctorResponse
from app.schemas.profile import DoctorUpdate
from app.services.firebase_db import filter_documents, get_document, list_documents, update_document
from app.utils.location import calculate_distance
from app.utils.slot_utils import build_slot_times, resolve_slot_duration

router = APIRouter()

DOCTORS_COLLECTION = "doctors"
HOSPITALS_COLLECTION = "hospitals"
APPOINTMENTS_COLLECTION = "appointments"


def _normalize(value: str | None) -> str:
    return (value or "").strip().lower()


def _parse_time_value(value, default: time | None = None) -> time | None:
    if value is None:
        return default
    if isinstance(value, time):
        return value
    if isinstance(value, datetime):
        return value.time()
    if isinstance(value, str):
        cleaned = value.strip()
        if not cleaned:
            return default
        try:
            return time.fromisoformat(cleaned)
        except ValueError:
            if len(cleaned) == 5:
                return time.fromisoformat(f"{cleaned}:00")
    return default


def _parse_date_value(value) -> date | None:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str) and value.strip():
        return date.fromisoformat(value.strip())
    return None


def hospital_matches_location_exact_filter(hospital: dict | None, location: str) -> bool:
    if not hospital:
        return False
    normalized_location = _normalize(location)
    return normalized_location in {
        _normalize(hospital.get("city")),
        _normalize(hospital.get("district")),
        _normalize(hospital.get("state")),
        _normalize(hospital.get("pincode")),
    }


def hospital_matches_location_fuzzy_filter(hospital: dict | None, location: str) -> bool:
    if not hospital:
        return False
    pattern = _normalize(location)
    values = [
        hospital.get("city"),
        hospital.get("district"),
        hospital.get("address"),
        hospital.get("state"),
        hospital.get("pincode"),
    ]
    return any(pattern in _normalize(value) for value in values)


def hospital_matches_location_python(hospital, location: str):
    if not hospital or not location:
        return False

    values = [
        hospital.get("city"),
        hospital.get("district"),
        hospital.get("address"),
        hospital.get("state"),
        hospital.get("pincode"),
    ]
    normalized_location = location.strip().lower()
    return any((value or "").lower().find(normalized_location) != -1 for value in values)


def _doctor_rating(doctor_id: int, appointments: list[dict]) -> tuple[float | None, int]:
    ratings = [appointment.get("rating") for appointment in appointments if appointment.get("doctor_id") == doctor_id and appointment.get("rating") is not None]
    if not ratings:
        return None, 0
    return sum(ratings) / len(ratings), len(ratings)


def _active_queue_count(doctor_id: int, appointments: list[dict]) -> int:
    return sum(
        1
        for appointment in appointments
        if appointment.get("doctor_id") == doctor_id and appointment.get("status") in {"pending", "confirmed"}
    )


def _enrich_doctor(doctor: dict, hospitals: dict[int, dict], appointments: list[dict], lat: float | None = None, lon: float | None = None) -> dict:
    hospital = hospitals.get(doctor.get("hospital_id"))
    queue_count = _active_queue_count(doctor["id"], appointments)
    average_rating, rating_count = _doctor_rating(doctor["id"], appointments)
    enriched = {
        **doctor,
        "hospital_name": hospital.get("name") if hospital else None,
        "hospital_address": hospital.get("address") if hospital else None,
        "hospital_city": hospital.get("city") if hospital else None,
        "hospital_google_maps_link": hospital.get("google_maps_link") if hospital else None,
        "state": doctor.get("state") or (hospital.get("state") if hospital else None),
        "city": hospital.get("city") if hospital else None,
        "queue_count": queue_count,
        "estimated_wait_time": queue_count * int(doctor.get("average_consultation_time") or 15),
        "average_rating": average_rating,
        "rating_count": rating_count,
        "distance_km": None,
    }

    if lat is not None and lon is not None and hospital and hospital.get("latitude") is not None and hospital.get("longitude") is not None:
        enriched["distance_km"] = round(
            calculate_distance(lat, lon, hospital["latitude"], hospital["longitude"]),
            2,
        )

    return enriched


def _all_hospitals_map() -> dict[int, dict]:
    return {hospital["id"]: hospital for hospital in list_documents(HOSPITALS_COLLECTION)}


def _all_appointments() -> list[dict]:
    return list_documents(APPOINTMENTS_COLLECTION)

@router.get(
    "/all",
    response_model=list[DoctorResponse]
)
def get_all_doctors(
):
    hospitals = _all_hospitals_map()
    appointments = _all_appointments()
    doctors = list_documents(DOCTORS_COLLECTION)
    return [_enrich_doctor(doctor, hospitals, appointments) for doctor in doctors]


# =========================
# Get Specializations
# =========================

@router.get(
    "/specializations"
)
def get_specializations(
    lat: float | None = None,
    lon: float | None = None,
    max_km: float = 50.0,
    city: str | None = None,
):
    doctors = [
        doctor for doctor in list_documents(DOCTORS_COLLECTION)
        if _normalize(doctor.get("specialization"))
    ]
    hospitals = _all_hospitals_map()
    appointments = _all_appointments()

    specialization_map = {}

    for doctor in doctors:
        specialization = str(doctor.get("specialization") or "").strip()
        if not specialization:
            continue

        hospital = hospitals.get(doctor.get("hospital_id"))
        if city:
            if not hospital_matches_location_python(hospital, city):
                continue

        if lat is not None and lon is not None:
            if not hospital or hospital.get("latitude") is None or hospital.get("longitude") is None:
                continue
            distance = calculate_distance(lat, lon, hospital["latitude"], hospital["longitude"])
            if distance > max_km:
                continue

        queue_count = _active_queue_count(doctor["id"], appointments)

        wait_time = queue_count * int(doctor.get("average_consultation_time") or 15)
        if wait_time == 0:
            wait_time = int(doctor.get("average_consultation_time") or 15)

        key = specialization.lower()

        if key not in specialization_map:
            specialization_map[key] = {
                "specialization": specialization,
                "doctor_count": 1,
                "fastest_wait_time": wait_time,
            }
        else:
            existing = specialization_map[key]
            existing["doctor_count"] += 1
            existing["fastest_wait_time"] = min(existing["fastest_wait_time"], wait_time)

    return list(specialization_map.values())


# =========================
# Get Doctors by Hospital
# =========================

@router.get(
    "/hospital/{hospital_id}",
    response_model=list[DoctorResponse]
)
def get_doctors_by_hospital(
    hospital_id: int,
):
    hospitals = _all_hospitals_map()
    appointments = _all_appointments()
    doctors = filter_documents(
        DOCTORS_COLLECTION,
        lambda item: item.get("hospital_id") == hospital_id and bool(item.get("is_available", True)),
    )
    return [_enrich_doctor(doctor, hospitals, appointments) for doctor in doctors]


# =========================
# Get Doctors by Specialization
# =========================

@router.get(
    "/specialization/{specialization}",
    response_model=list[DoctorResponse]
)
def get_doctors_by_specialization(
    specialization: str,
    lat: float | None = None,
    lon: float | None = None,
    city: str | None = None,
):
    normalized_specialization = _normalize(specialization)
    hospitals = _all_hospitals_map()
    appointments = _all_appointments()
    doctors = [
        doctor for doctor in list_documents(DOCTORS_COLLECTION)
        if normalized_specialization in _normalize(doctor.get("specialization")) and bool(doctor.get("is_available", True))
    ]

    if city:
        normalized_city = city.strip()
        exact_matches = [
            doctor for doctor in doctors
            if hospital_matches_location_exact_filter(hospitals.get(doctor.get("hospital_id")), normalized_city)
        ]
        doctors = exact_matches or [
            doctor for doctor in doctors
            if hospital_matches_location_fuzzy_filter(hospitals.get(doctor.get("hospital_id")), normalized_city)
        ]

    nearby_doctors = [_enrich_doctor(doctor, hospitals, appointments, lat, lon) for doctor in doctors]
    nearby_doctors.sort(key=lambda item: (item.get("estimated_wait_time") or 999, item.get("distance_km") or 999))
    return nearby_doctors


@router.get(
    "/{doctor_id}",
    response_model=DoctorResponse
)
def get_doctor(
    doctor_id: int,
):
    doctor = get_document(DOCTORS_COLLECTION, doctor_id)

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    return _enrich_doctor(doctor, _all_hospitals_map(), _all_appointments())


@router.put(
    "/{doctor_id}",
    response_model=DoctorResponse
)
def update_doctor(
    doctor_id: int,
    doctor_update: DoctorUpdate,
):
    doctor = get_document(DOCTORS_COLLECTION, doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    update_data = doctor_update.dict(exclude_unset=True)
    doctor_updates = {
        key: value
        for key, value in update_data.items()
        if key in {
            "name",
            "specialization",
            "qualification",
            "experience",
            "phone",
            "email",
            "consultation_fee",
            "available_from",
            "available_to",
            "lunch_break_start",
            "lunch_break_end",
            "average_consultation_time",
            "state",
        }
    }
    hospital_updates = {}
    if "city" in update_data:
        hospital_updates["city"] = update_data["city"]
    if "state" in update_data:
        hospital_updates["state"] = update_data["state"]
    if "address" in update_data:
        hospital_updates["address"] = update_data["address"]
    if "hospital_name" in update_data:
        hospital_updates["name"] = update_data["hospital_name"]
    if "hospital_phone" in update_data:
        hospital_updates["phone"] = update_data["hospital_phone"]
    if "hospital_email" in update_data:
        hospital_updates["email"] = update_data["hospital_email"]

    if doctor_updates:
        update_document(DOCTORS_COLLECTION, doctor_id, doctor_updates)

    hospital_id = doctor.get("hospital_id")
    if hospital_updates and hospital_id:
        update_document(HOSPITALS_COLLECTION, hospital_id, hospital_updates)

    updated_doctor = get_document(DOCTORS_COLLECTION, doctor_id)
    return _enrich_doctor(updated_doctor, _all_hospitals_map(), _all_appointments())


# =========================
# Nearby Doctors
# =========================

@router.get(
    "/nearby",
    response_model=list[DoctorResponse]
)
def get_nearby_doctors(
    lat: float,
    lon: float,
    max_distance: float = 50.0,
):
    hospitals = _all_hospitals_map()
    appointments = _all_appointments()
    doctors = filter_documents(
        DOCTORS_COLLECTION,
        lambda item: bool(item.get("is_available", True)) and item.get("hospital_id") is not None,
    )
    nearby_doctors = []
    for doctor in doctors:
        enriched = _enrich_doctor(doctor, hospitals, appointments, lat, lon)
        if enriched.get("distance_km") is None or enriched["distance_km"] > max_distance:
            continue
        nearby_doctors.append(enriched)

    nearby_doctors.sort(key=lambda item: item.get("distance_km") or 999)
    return nearby_doctors


# =========================
# Search Doctors
# =========================

@router.get("/search")
def search_doctors(
    specialization: str,
):
    hospitals = _all_hospitals_map()
    appointments = _all_appointments()
    doctors = [
        doctor for doctor in list_documents(DOCTORS_COLLECTION)
        if _normalize(specialization) in _normalize(doctor.get("specialization"))
    ]
    return [_enrich_doctor(doctor, hospitals, appointments) for doctor in doctors]


# =========================
# Get Available Slots
# =========================

@router.get(
    "/available-slots/{doctor_id}"
)
def get_available_slots(
    doctor_id: int,
    appointment_date: str,
):
    doctor = get_document(DOCTORS_COLLECTION, doctor_id)

    if not doctor or not doctor.get("is_available", True):
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    default_start = time(hour=9, minute=0)
    default_end = time(hour=17, minute=0)

    start_time = datetime.combine(
        datetime.today(),
        _parse_time_value(doctor.get("available_from"), default_start) or default_start,
    )
    end_time = datetime.combine(
        datetime.today(),
        _parse_time_value(doctor.get("available_to"), default_end) or default_end,
    )
    slot_duration = resolve_slot_duration(None, doctor.get("average_consultation_time"))

    slots = build_slot_times(start_time, end_time, slot_duration)

    booked_appointments = [
        appointment for appointment in list_documents(APPOINTMENTS_COLLECTION)
        if appointment.get("doctor_id") == doctor_id
        and str(appointment.get("appointment_date")) == appointment_date
        and appointment.get("status") in {"pending", "confirmed"}
    ]
    booked_times = {
        (_parse_time_value(appointment.get("appointment_time")) or time.min).strftime("%H:%M")
        for appointment in booked_appointments
    }

    return [
        {
            "time": slot,
            "status": "booked" if slot in booked_times else "available",
        }
        for slot in slots
    ]
