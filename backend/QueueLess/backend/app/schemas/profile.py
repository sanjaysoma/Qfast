from pydantic import BaseModel
import pydantic as _pydantic
from typing import Optional
from datetime import time as Time

IS_PYDANTIC_V2 = int(_pydantic.__version__.split(".")[0]) >= 2


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None


class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    consultation_fee: Optional[float] = None
    available_from: Optional[Time] = None
    available_to: Optional[Time] = None
    lunch_break_start: Optional[Time] = None
    lunch_break_end: Optional[Time] = None
    state: Optional[str] = None
    city: Optional[str] = None
    hospital_name: Optional[str] = None
    address: Optional[str] = None
    hospital_phone: Optional[str] = None
    hospital_email: Optional[str] = None
