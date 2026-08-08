from pydantic import BaseModel
import pydantic as _pydantic

# Detect Pydantic major version at runtime
IS_PYDANTIC_V2 = int(_pydantic.__version__.split(".")[0]) >= 2
from typing import Optional
from datetime import date, time


# =========================
# Patient Response Schema (nested)
# =========================

class PatientBasicResponse(BaseModel):

    id: int

    name: str

    mobile: Optional[str] = None

    age: Optional[int] = None

    gender: Optional[str] = None

    if IS_PYDANTIC_V2:
        model_config = {"from_attributes": True}
    else:
        class Config:
            orm_mode = True


# =========================
# Doctor Response Schema (nested)
# =========================

class DoctorBasicResponse(BaseModel):

    id: int

    name: str

    specialization: Optional[str] = None

    if IS_PYDANTIC_V2:
        model_config = {"from_attributes": True}
    else:
        class Config:
            orm_mode = True


# =========================
# Create Appointment Schema
# =========================

class AppointmentCreate(BaseModel):

    patient_id: int

    doctor_id: int

    appointment_date: date

    appointment_time: time

    symptoms: Optional[str] = None


# =========================
# Appointment Response Schema
# =========================

class AppointmentResponse(BaseModel):

    id: int

    patient_id: int

    doctor_id: int

    appointment_date: date

    appointment_time: time

    token_number: Optional[int]

    estimated_wait_time: Optional[int]

    queue_position: Optional[int]

    status: str

    symptoms: Optional[str]

    notes: Optional[str]

    rating: Optional[int] = None

    patient: Optional[PatientBasicResponse] = None

    doctor: Optional[DoctorBasicResponse] = None

    if IS_PYDANTIC_V2:
        model_config = {"from_attributes": True}
    else:
        class Config:
            orm_mode = True