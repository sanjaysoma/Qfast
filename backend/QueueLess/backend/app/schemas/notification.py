from pydantic import BaseModel
import pydantic as _pydantic

# Detect Pydantic major version at runtime
IS_PYDANTIC_V2 = int(_pydantic.__version__.split(".")[0]) >= 2

from typing import Optional
from datetime import datetime


class NotificationResponse(BaseModel):
    id: int
    user_role: str
    user_id: int
    appointment_id: Optional[int] = None
    message: str
    is_read: bool
    created_at: datetime

    if IS_PYDANTIC_V2:
        model_config = {"from_attributes": True}
    else:
        class Config:
            orm_mode = True
