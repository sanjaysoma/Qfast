from pydantic import BaseModel, EmailStr
import pydantic as _pydantic

# Detect Pydantic major version at runtime
IS_PYDANTIC_V2 = int(_pydantic.__version__.split(".")[0]) >= 2
from typing import Optional

# Schema for creating a new user
class UserCreate(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str


# Schema for returning user data (without password)
class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    email: EmailStr
    is_active: bool
    is_admin: bool

    if IS_PYDANTIC_V2:
        model_config = {"from_attributes": True}
    else:
        class Config:
            orm_mode = True


# Schema representing a user stored in DB
class UserInDB(BaseModel):
    id: int
    name: str
    username: str
    email: EmailStr
    hashed_password: str
    is_active: bool
    is_admin: bool

    if IS_PYDANTIC_V2:
        model_config = {"from_attributes": True}
    else:
        class Config:
            orm_mode = True