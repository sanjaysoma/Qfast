from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile

from app.schemas.hospital import HospitalNearbyResponse, HospitalResponse
from app.services.firebase_db import create_document, find_first, get_document, list_documents
from app.services.firebase_storage import upload_dmho_certificate
from app.services.location_parser import extract_coordinates_from_google_maps
from app.utils.location import calculate_distance

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads" / "dmho_certificates"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

HOSPITALS_COLLECTION = "hospitals"


def _list_hospitals() -> list[dict]:
    hospitals = list_documents(HOSPITALS_COLLECTION)
    hospitals.sort(key=lambda item: int(item.get("id", 0)))
    return hospitals


def _get_hospital_by_id(hospital_id: int) -> dict | None:
    return get_document(HOSPITALS_COLLECTION, hospital_id)


def _normalize(value: str | None) -> str:
    return (value or "").strip().lower()


def hospital_matches_location_exact(hospital: dict, location: str) -> bool:
    normalized = _normalize(location)
    return normalized in {
        _normalize(hospital.get("city")),
        _normalize(hospital.get("district")),
        _normalize(hospital.get("state")),
        _normalize(hospital.get("pincode")),
    }


def hospital_matches_location_fuzzy(hospital: dict, location: str) -> bool:
    normalized = _normalize(location)
    values = [
        hospital.get("city"),
        hospital.get("district"),
        hospital.get("address"),
        hospital.get("state"),
        hospital.get("pincode"),
    ]
    return any(normalized in _normalize(value) for value in values)


# =========================
# Search Hospitals
# =========================

@router.get(
    "/search",
    response_model=list[HospitalResponse]
)
def search_hospitals(
    query: str,
):
    normalized_query = _normalize(query)
    return [
        hospital
        for hospital in _list_hospitals()
        if normalized_query in _normalize(hospital.get("name"))
    ]


# =========================
# Get All Hospitals
# =========================

@router.get(
    "/all",
    response_model=list[HospitalResponse]
)
def get_hospitals(
    
):
    return _list_hospitals()


# =========================
# Nearby Hospitals
# =========================

@router.get(
    "/nearby",
    response_model=list[HospitalNearbyResponse]
)
def get_nearby_hospitals(
    lat: float | None = Query(default=None),
    lon: float | None = Query(default=None),
    max_distance: float = 50.0,
):

    if lat is None or lon is None:
        return []

    hospitals = _list_hospitals()

    hospital_list = []

    for hospital in hospitals:
        latitude = hospital.get("latitude")
        longitude = hospital.get("longitude")
        if latitude is None or longitude is None:
            continue

        distance = calculate_distance(
            lat,
            lon,
            latitude,
            longitude
        )

        if distance > max_distance:
            continue

        hospital_list.append({
            "hospital_id": hospital.get("id"),
            "name": hospital.get("name"),
            "address": hospital.get("address"),
            "city": hospital.get("city"),
            "district": hospital.get("district"),
            "pincode": hospital.get("pincode"),
            "google_maps_link": hospital.get("google_maps_link"),
            "average_consultation_time": hospital.get("average_consultation_time"),
            "distance_km": round(distance, 2),
            "latitude": latitude,
            "longitude": longitude,
        })

    hospital_list.sort(key=lambda item: item["distance_km"])

    return hospital_list


# =========================
# Hospitals by City
# =========================

@router.get(
    "/city/{city}",
    response_model=list[HospitalResponse]
)
def get_hospitals_by_city(
    city: str,
):
    normalized_city = city.strip()
    hospitals = [
        hospital for hospital in _list_hospitals()
        if hospital_matches_location_exact(hospital, normalized_city)
    ]

    if not hospitals:
        hospitals = [
            hospital for hospital in _list_hospitals()
            if hospital_matches_location_fuzzy(hospital, normalized_city)
        ]

    return hospitals


# =========================
# Hospitals by District
# =========================

@router.get(
    "/district/{district}",
    response_model=list[HospitalResponse]
)
def get_hospitals_by_district(
    district: str,
):

    normalized_district = district.strip()
    hospitals = [
        hospital for hospital in _list_hospitals()
        if hospital_matches_location_exact(hospital, normalized_district)
    ]

    if not hospitals:
        hospitals = [
            hospital for hospital in _list_hospitals()
            if hospital_matches_location_fuzzy(hospital, normalized_district)
        ]

    return hospitals


# =========================
# Get Hospital By ID
# =========================

@router.get(
    "/{hospital_id}",
    response_model=HospitalResponse
)
def get_hospital(
    hospital_id: int,
):
    hospital = _get_hospital_by_id(hospital_id)

    if not hospital:

        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    return hospital


# =========================
# Register Hospital
# =========================

@router.post(
    "/register",
    response_model=HospitalResponse
)
def create_hospital(
    name: str = Form(...),
    address: str = Form(...),
    city: str | None = Form(default=None),
    state: str | None = Form(default=None),
    district: str | None = Form(default=None),
    pincode: str | None = Form(default=None),
    google_maps_link: str = Form(...),
    phone: str | None = Form(default=None),
    email: str | None = Form(default=None),
    dmho_certificate: UploadFile = File(...),
):

    # =========================
    # Check Existing Hospital
    # =========================

    existing_hospital = find_first(
        HOSPITALS_COLLECTION,
        lambda item: _normalize(item.get("name")) == _normalize(name)
        and _normalize(item.get("address")) == _normalize(address),
    )

    if existing_hospital:

        raise HTTPException(
            status_code=400,
            detail="Hospital already exists"
        )

    # =========================
    # Extract coordinates from Google Maps link when present
    # =========================

    file_name = (dmho_certificate.filename or "").lower()
    if not (file_name.endswith(".jpg") or file_name.endswith(".jpeg")):
        raise HTTPException(
            status_code=400,
            detail="DMHO certificate must be in JPG format"
        )

    content_type = (dmho_certificate.content_type or "").lower()
    if content_type not in {"image/jpeg", "image/jpg", "application/octet-stream"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid DMHO certificate file type"
        )

    file_bytes = dmho_certificate.file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="DMHO certificate file is empty")

    certificate_reference = None
    try:
        certificate_reference = upload_dmho_certificate(
            file_bytes=file_bytes,
            original_filename=file_name,
            content_type="image/jpeg" if content_type == "application/octet-stream" else content_type,
        )
    except Exception as exc:
        certificate_reference = None

    if not certificate_reference:
        certificate_extension = ".jpg" if file_name.endswith(".jpg") else ".jpeg"
        safe_file_name = f"dmho_{uuid4().hex}{certificate_extension}"
        certificate_path = UPLOAD_DIR / safe_file_name
        certificate_path.write_bytes(file_bytes)
        certificate_reference = str(certificate_path)

    coordinates = extract_coordinates_from_google_maps(google_maps_link)

    if coordinates:
        latitude = coordinates["latitude"]
        longitude = coordinates["longitude"]
    else:
        latitude = None
        longitude = None

    # =========================
    # Create Hospital
    # =========================

    new_hospital = create_document(
        HOSPITALS_COLLECTION,
        {
            "name": name.strip(),
            "address": address.strip(),
            "city": city.strip() if city else None,
            "state": state.strip() if state else None,
            "district": district.strip() if district else None,
            "pincode": pincode.strip() if pincode else None,
            "google_maps_link": google_maps_link.strip(),
            "phone": phone.strip() if phone else None,
            "email": email.strip() if email else None,
            "latitude": latitude,
            "longitude": longitude,
            "dmho_certificate_path": certificate_reference,
            "average_consultation_time": 15,
            "created_at": datetime.utcnow(),
        },
    )
    return new_hospital