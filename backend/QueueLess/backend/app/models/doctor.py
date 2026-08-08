from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    Time,
    Boolean,
    DateTime
)

from sqlalchemy.orm import relationship

from datetime import datetime

from app.database import Base


class Doctor(Base):

    __tablename__ = "doctors"

    # =========================
    # Primary Key
    # =========================

    id = Column(Integer, primary_key=True, index=True)

    # =========================
    # Hospital Relationship
    # =========================

    hospital_id = Column(
        Integer,
        ForeignKey("hospitals.id"),
        nullable=True
    )

    # =========================
    # Doctor Information
    # =========================

    name = Column(String, nullable=False)

    specialization = Column(
        String,
        nullable=False
    )

    qualification = Column(
        String,
        nullable=True
    )

    medical_council_registration_number = Column(
        String,
        nullable=True
    )

    experience = Column(
        Integer,
        nullable=True
    )

    phone = Column(
        String,
        nullable=True
    )

    email = Column(
        String,
        nullable=True,
        unique=True
    )

    consultation_fee = Column(
        Float,
        nullable=True
    )

    # =========================
    # Availability
    # =========================

    available_from = Column(
        Time,
        nullable=True
    )

    available_to = Column(
        Time,
        nullable=True
    )

    lunch_break_start = Column(
        Time,
        nullable=True
    )

    lunch_break_end = Column(
        Time,
        nullable=True
    )

    average_consultation_time = Column(
        Integer,
        default=30
    )

    max_patients_per_day = Column(
        Integer,
        default=50
    )

    is_available = Column(
        Boolean,
        default=True
    )

    # =========================
    # Timestamp
    # =========================

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # =========================
    # Relationships
    # =========================

    hospital = relationship(
        "Hospital",
        back_populates="doctors"
    )

    schedules = relationship(
        "DoctorSchedule",
        back_populates="doctor",
        cascade="all, delete"
    )

    appointments = relationship(
        "Appointment",
        back_populates="doctor",
        cascade="all, delete"
    )

    @property
    def hospital_name(self):
        return self.hospital.name if self.hospital else None

    @property
    def hospital_address(self):
        return self.hospital.address if self.hospital else None

    @property
    def hospital_city(self):
        return self.hospital.city if self.hospital else None

    @property
    def hospital_google_maps_link(self):
        return self.hospital.google_maps_link if self.hospital else None