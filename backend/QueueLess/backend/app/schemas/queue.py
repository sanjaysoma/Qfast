from pydantic import BaseModel
import pydantic as _pydantic

# Detect Pydantic major version at runtime
IS_PYDANTIC_V2 = int(_pydantic.__version__.split(".")[0]) >= 2
from typing import Optional
from datetime import datetime

# Schema for creating a new queue
class QueueCreate(BaseModel):
    hospital_id: int
    user_id: int
    token_number: int
    status: Optional[str] = "waiting"  # Default status is "waiting"

# Schema for updating a queue
class QueueUpdate(BaseModel):
    status: Optional[str]

# Schema for returning queue data
class QueueResponse(QueueCreate):
    id: int
    created_at: datetime
    updated_at: datetime
    if IS_PYDANTIC_V2:
        model_config = {"from_attributes": True}
    else:
        class Config:
            orm_mode = True