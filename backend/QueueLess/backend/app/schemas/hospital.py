from pydantic import BaseModel
import pydantic as _pydantic

# Detect Pydantic major version at runtime
IS_PYDANTIC_V2 = int(_pydantic.__version__.split(".")[0]) >= 2
from typing import Optional

# Shared schema fields for hospitals
class HospitalBase(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    google_maps_link: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    dmho_certificate_path: Optional[str] = None
    average_consultation_time: Optional[int] = 15  # Default is 15 minutes

# Schema for creating a new hospital
class HospitalCreate(HospitalBase):
    name: str
    address: str
    google_maps_link: str

# Schema for returning hospital data
class HospitalResponse(HospitalBase):
    id: int

    if IS_PYDANTIC_V2:
        model_config = {"from_attributes": True}
    else:
        class Config:
            orm_mode = True


class HospitalNearbyResponse(BaseModel):
    hospital_id: int
    name: str
    address: str
    city: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    google_maps_link: Optional[str] = None
    average_consultation_time: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_km: float

    if IS_PYDANTIC_V2:
        model_config = {"from_attributes": True}
    else:
        class Config:
            orm_mode = True