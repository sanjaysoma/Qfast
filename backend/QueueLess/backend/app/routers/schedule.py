from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.doctor_schedule import DoctorSchedule

router = APIRouter(
    tags=["Schedule"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Create Doctor Schedule
@router.post("/create")
def create_schedule(
    schedule_data: dict,
    db: Session = Depends(get_db)
):

    schedule = DoctorSchedule(**schedule_data)

    db.add(schedule)

    db.commit()

    db.refresh(schedule)

    return schedule


# Get Doctor Schedules
@router.get("/doctor/{doctor_id}")
def get_doctor_schedule(
    doctor_id: int,
    db: Session = Depends(get_db)
):

    schedules = db.query(
        DoctorSchedule
    ).filter(
        DoctorSchedule.doctor_id == doctor_id
    ).all()

    return schedules