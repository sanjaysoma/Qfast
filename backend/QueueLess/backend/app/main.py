import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import DB_INIT_ON_STARTUP, DB_REQUIRED_ON_STARTUP, USE_FIREBASE_DATABASE
from app.routers.appointment import router as appointment_router
from app.routers.area import router as area_router
from app.routers.auth import router as auth_router
from app.routers.doctor import router as doctor_router
from app.routers.hospital import router as hospital_router
from app.routers.notification import router as notification_router
from app.routers.patient import router as patient_router

if USE_FIREBASE_DATABASE:
    from app.services.firebase_app import get_realtime_db_root
else:
    from sqlalchemy import text
    from sqlalchemy.exc import OperationalError

    from app.database import Base, engine

    from app.models.appointment import Appointment
    from app.models.doctor import Doctor
    from app.models.doctor_schedule import DoctorSchedule
    from app.models.hospital import Hospital
    from app.models.notification import Notification
    from app.models.patient import Patient
    from app.models.user import User
    from app.routers.protected import router as protected_router
    from app.routers.schedule import router as schedule_router


    def _initialize_database() -> None:
        print("Creating database tables...")

        Base.metadata.create_all(bind=engine)

        if engine.dialect.name != "sqlite":
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS google_maps_link VARCHAR(1024);"))
                conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS district VARCHAR(255);"))
                conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS pincode VARCHAR(32);"))
                conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;"))
                conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;"))
                conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS dmho_certificate_path VARCHAR(1024);"))
                conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS rating INTEGER;"))
                conn.execute(text("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS medical_council_registration_number VARCHAR(255);"))

        print("Tables created successfully!")


# =========================
# INITIALIZE FASTAPI APP
# =========================

app = FastAPI(

    title="VDocQ API",

    version="1.0.0"
)


@app.on_event("startup")
def startup_database_init() -> None:
    if USE_FIREBASE_DATABASE:
        try:
            client = get_realtime_db_root()
            client.get()
            print("Firebase database mode enabled.")
            return
        except Exception as exc:
            raise RuntimeError(
                "Firebase database mode is enabled, but Firebase Realtime Database is unavailable for this project. "
                "Verify FIREBASE_DATABASE_URL, Realtime Database setup, and Firebase Admin permissions, then retry."
            ) from exc

    if not DB_INIT_ON_STARTUP:
        print("DB_INIT_ON_STARTUP=false, skipping startup schema initialization.")
        return

    try:
        _initialize_database()
    except Exception as exc:
        print(f"Database startup initialization notice: {exc}")
        print("Web server startup continuing normally...")


# =========================
# CORS MIDDLEWARE
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# =========================
# INCLUDE ROUTERS
# =========================

# Authentication
app.include_router(

    auth_router,

    prefix="/auth",

    tags=["Authentication"]
)

# Hospitals
app.include_router(

    hospital_router,

    prefix="/hospital",

    tags=["Hospital"]
)

# Doctors
app.include_router(

    doctor_router,

    prefix="/doctor",

    tags=["Doctor"]
)

# Patients
app.include_router(

    patient_router,

    prefix="/patient",

    tags=["Patient"]
)

# Appointments
app.include_router(

    appointment_router,

    prefix="/appointment",

    tags=["Appointment"]
)

# Notifications
app.include_router(

    notification_router,

    prefix="/notification",

    tags=["Notification"]
)

# Area-based routes
app.include_router(
    area_router,
)

if not USE_FIREBASE_DATABASE:
    app.include_router(
        schedule_router,
        prefix="/schedule",
        tags=["Schedule"]
    )

    app.include_router(
        protected_router,
        prefix="/protected",
        tags=["Protected"]
    )


# =========================
# ROOT ENDPOINT
# =========================

@app.get("/")
async def root():

    return {"message": "Welcome to VDocQ API"}


@app.get("/db-test")
def db_test():
    if USE_FIREBASE_DATABASE:
        try:
            get_realtime_db_root().child("_healthcheck").get()
            return {"ok": True, "database": "firebase"}
        except Exception as exc:
            return {"ok": False, "error": str(exc), "database": "firebase"}

    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            return {"ok": True, "result": result.scalar()}
    except OperationalError as exc:
        return {"ok": False, "error": str(exc)}

