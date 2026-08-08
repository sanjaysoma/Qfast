from pydantic import BaseModel
import pydantic as _pydantic

# Detect Pydantic major version at runtime
IS_PYDANTIC_V2 = int(_pydantic.__version__.split(".")[0]) >= 2
from typing import Optional


# =========================
# Doctor Create Schema
# =========================

from datetime import time as Time

class DoctorCreate(BaseModel):

    # =========================
    # Doctor Information
    # =========================

    name: str

    specialization: str

    qualification: Optional[str] = None

    experience: Optional[int] = None

    phone: Optional[str] = None

    email: Optional[str] = None

    consultation_fee: Optional[float] = None

    # =========================
    # Availability Timings
    # =========================

    available_from: Optional[Time] = None

    available_to: Optional[Time] = None

    lunch_break_start: Optional[Time] = None

    lunch_break_end: Optional[Time] = None

    # =========================
    # Hospital Information
    # =========================

    hospital_name: str

    address: str

    city: Optional[str] = None

    state: Optional[str] = None

    hospital_phone: Optional[str] = None

    hospital_email: Optional[str] = None

    latitude: float

    longitude: float


# =========================
# Doctor Response Schema
# =========================

class DoctorResponse(BaseModel):

    id: int

    hospital_id: int | None = None

    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    hospital_city: Optional[str] = None
    hospital_google_maps_link: Optional[str] = None
    distance_km: Optional[float] = None
    state: Optional[str] = None
    city: Optional[str] = None
    average_consultation_time: Optional[int] = None

    name: str

    specialization: str

    qualification: Optional[str]

    medical_council_registration_number: Optional[str]

    experience: Optional[int]

    phone: Optional[str]

    email: Optional[str]

    consultation_fee: Optional[float]

    available_from: Optional[Time]

    available_to: Optional[Time]

    lunch_break_start: Optional[Time]

    lunch_break_end: Optional[Time]

    queue_count: Optional[int] = None

    estimated_wait_time: Optional[int] = None

    average_rating: Optional[float] = None

    rating_count: Optional[int] = None

    if IS_PYDANTIC_V2:
        model_config = {"from_attributes": True}
    else:
        class Config:
            orm_mode = True