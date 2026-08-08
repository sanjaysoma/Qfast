from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime
)

from sqlalchemy.orm import relationship

from datetime import datetime

from app.database import Base


class Patient(Base):

    __tablename__ = "patients"

    # =========================
    # Primary Key
    # =========================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =========================
    # Basic Information
    # =========================

    name = Column(
        String,
        nullable=False
    )

    mobile = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    # =========================
    # Optional Information
    # =========================

    age = Column(
        Integer,
        nullable=True
    )

    gender = Column(
        String,
        nullable=True
    )

    address = Column(
        String,
        nullable=True
    )

    state = Column(
        String,
        nullable=True
    )

    district = Column(
        String,
        nullable=True
    )

    # =========================
    # Account Status
    # =========================

    is_active = Column(
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

    appointments = relationship(
        "Appointment",
        back_populates="patient",
        cascade="all, delete"
    )