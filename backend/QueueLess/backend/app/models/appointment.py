from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Date,
    Time,
    DateTime
)

from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign Keys
    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False
    )

    doctor_id = Column(
        Integer,
        ForeignKey("doctors.id"),
        nullable=False
    )

    # Appointment Details
    appointment_date = Column(
        Date,
        nullable=False
    )

    appointment_time = Column(
        Time,
        nullable=False
    )

    # Medvo Smart Queue
    token_number = Column(
        Integer,
        nullable=True
    )

    estimated_wait_time = Column(
        Integer,
        nullable=True
    )  # in minutes

    queue_position = Column(
        Integer,
        nullable=True
    )

    # Appointment Status
    status = Column(
        String,
        default="pending"
    )

    # Possible statuses:
    # booked
    # confirmed
    # completed
    # cancelled
    # missed

    symptoms = Column(
        String,
        nullable=True
    )

    notes = Column(
        String,
        nullable=True
    )

    rating = Column(
        Integer,
        nullable=True
    )

    # Timestamp
    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # =========================
    # Relationships
    # =========================

    patient = relationship(
        "Patient",
        back_populates="appointments"
    )

    doctor = relationship(
        "Doctor",
        back_populates="appointments"
    )
