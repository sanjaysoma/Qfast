from pydantic import BaseModel, EmailStr
import pydantic as _pydantic

# Detect Pydantic major version at runtime
IS_PYDANTIC_V2 = int(_pydantic.__version__.split(".")[0]) >= 2
from typing import Optional


# =========================
# Create Patient Schema
# =========================

class PatientCreate(BaseModel):

    name: str

    mobile: str

    age: Optional[int] = None

    gender: Optional[str] = None

    state: Optional[str] = None

    district: Optional[str] = None

    address: Optional[str] = None


# =========================
# Patient Response Schema
# =========================

class PatientResponse(BaseModel):

    id: int

    name: str

    mobile: str

    age: Optional[int]

    gender: Optional[str]

    state: Optional[str]

    district: Optional[str]

    address: Optional[str]

    is_active: bool

    if IS_PYDANTIC_V2:
        model_config = {"from_attributes": True}
    else:
        class Config:
            orm_mode = True