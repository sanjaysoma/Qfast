from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime
)

from sqlalchemy.orm import relationship

from datetime import datetime

from app.database import Base


class Hospital(Base):

    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    address = Column(String, nullable=False)

    city = Column(String, nullable=True)

    state = Column(String, nullable=True)

    phone = Column(String, nullable=True)

    email = Column(String, nullable=True)

    latitude = Column(Float, nullable=True)

    longitude = Column(Float, nullable=True)

    google_maps_link = Column(String, nullable=True)

    district = Column(String, nullable=True)

    pincode = Column(String, nullable=True)

    dmho_certificate_path = Column(String, nullable=True)

    average_consultation_time = Column(
        Integer,
        default=30
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # Relationships
    doctors = relationship(
        "Doctor",
        back_populates="hospital",
        cascade="all, delete"
    )