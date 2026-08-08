from datetime import datetime, time, timedelta

from fastapi import APIRouter, HTTPException
from jose import jwt
from pydantic import BaseModel

from app.config import SECRET_KEY
from app.services.firebase_db import (
    create_document,
    delete_document,
    find_first,
    filter_documents,
    get_document,
    set_document,
)
from app.services.firebase_otp import verify_firebase_phone_token
from app.services.otp_token import verify_otp_token

router = APIRouter()

USERS_COLLECTION = "users"
PATIENTS_COLLECTION = "patients"
DOCTORS_COLLECTION = "doctors"




# =========================
# HOME
# =========================

@router.get("/login")
async def get_login_page():

    return {
        "message": "Login endpoint"
    }


# =========================
# REGISTER REQUEST MODEL
# =========================

class RegisterRequest(BaseModel):

    name: str

    mobile: str

    role: str

    otp_token: str | None = None

    hospital_id: int | None = None

    specialization: str | None = None

    qualification: str | None = None

    medical_council_registration_number: str | None = None

    experience: int | None = None

    consultation_fee: float | None = None

    available_from: time | None = None

    available_to: time | None = None

    lunch_break_start: time | None = None

    lunch_break_end: time | None = None

    # Patient specific
    age: int | None = None
    gender: str | None = None
    state: str | None = None
    district: str | None = None


# =========================
# REGISTER
# =========================

@router.post("/register")
def register(data: RegisterRequest):

    clean_name = data.name.strip()
    clean_mobile = data.mobile.strip()
    clean_role = data.role.strip().lower()
    otp_token = (data.otp_token or "").strip()
    clean_medical_council_registration_number = (
        data.medical_council_registration_number.strip()
        if data.medical_council_registration_number
        else ""
    )

    if otp_token:
        otp_claims = verify_otp_token(otp_token)
        verified_phone_digits = "".join(ch for ch in str(otp_claims.get("mobile", "")) if ch.isdigit())[-10:]

        if verified_phone_digits != clean_mobile[-10:]:
            raise HTTPException(
                status_code=400,
                detail="Verified phone number does not match the registration mobile"
            )

    # =========================
    # Check Existing User
    # =========================

    existing_user = find_first(
        USERS_COLLECTION,
        lambda user: str(user.get("mobile", "")).strip() == clean_mobile,
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Mobile already registered"
        )

    # =========================
    # Create User
    # =========================

    if clean_role not in {"patient", "doctor"}:
        raise HTTPException(status_code=400, detail="Unsupported role")

    new_user = create_document(
        USERS_COLLECTION,
        {
            "name": clean_name,
            "mobile": clean_mobile,
            "role": clean_role,
            "created_at": datetime.utcnow(),
        },
    )

    # =========================
    # Create Patient Record
    # =========================

    if clean_role == "patient":

        set_document(
            PATIENTS_COLLECTION,
            new_user["id"],
            {
                "name": clean_name,
                "mobile": clean_mobile,
                "age": data.age,
                "gender": data.gender,
                "state": data.state,
                "district": data.district,
                "address": None,
                "is_active": True,
                "created_at": datetime.utcnow(),
            },
        )

    # =========================
    # Create Doctor Record
    # =========================

    elif clean_role == "doctor":

        if not clean_medical_council_registration_number:
            raise HTTPException(
                status_code=400,
                detail="Medical Council registration number is required"
            )

        # Hospital association is optional during registration; it can be assigned later
        set_document(
            DOCTORS_COLLECTION,
            new_user["id"],
            {
                "hospital_id": data.hospital_id if data.hospital_id else None,
                "name": clean_name,
                "phone": clean_mobile,
                "specialization": data.specialization or "General",
                "qualification": data.qualification or "MBBS",
                "medical_council_registration_number": clean_medical_council_registration_number,
                "experience": data.experience or 1,
                "consultation_fee": data.consultation_fee or 100,
                "available_from": data.available_from,
                "available_to": data.available_to,
                "lunch_break_start": data.lunch_break_start,
                "lunch_break_end": data.lunch_break_end,
                "average_consultation_time": 10,
                "max_patients_per_day": 50,
                "is_available": True,
                "state": data.state,
                "district": data.district,
                "created_at": datetime.utcnow(),
            },
        )

    return {
        "message": "User registered successfully"
    }


# =========================
# LOGIN REQUEST MODEL
# =========================

class LoginRequest(BaseModel):

    name: str | None = None

    mobile: str

    role: str

    otp_token: str | None = None


class SendOtpRequest(BaseModel):

    mobile: str


class VerifyOtpRequest(BaseModel):

    mobile: str

    otp: str


class FirebaseVerifyOtpRequest(BaseModel):

    mobile: str

    firebase_id_token: str


@router.post("/otp/send")
def request_otp(data: SendOtpRequest):
    raise HTTPException(
        status_code=410,
        detail="OTP sending is handled by Firebase client SDK. Use Firebase phone auth in frontend."
    )


@router.post("/otp/verify")
def confirm_otp(data: VerifyOtpRequest):
    raise HTTPException(
        status_code=410,
        detail="OTP verification is handled by /auth/otp/firebase/verify after Firebase client verification."
    )


@router.post("/otp/firebase/verify")
def confirm_firebase_otp(data: FirebaseVerifyOtpRequest):

    return verify_firebase_phone_token(data.mobile, data.firebase_id_token)


# =========================
# LOGIN
# =========================

@router.post("/login")
def login(data: LoginRequest):

    clean_mobile = data.mobile.strip()
    clean_role = data.role.strip().lower()
    otp_token = (data.otp_token or "").strip()

    if otp_token:
        otp_claims = verify_otp_token(otp_token)
        verified_phone_digits = "".join(ch for ch in str(otp_claims.get("mobile", "")) if ch.isdigit())[-10:]

        if verified_phone_digits != clean_mobile[-10:]:
            raise HTTPException(
                status_code=400,
                detail="Verified phone number does not match the login mobile"
            )

    user = find_first(
        USERS_COLLECTION,
        lambda item: str(item.get("mobile", "")).strip() == clean_mobile and item.get("role") == clean_role,
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found. Please register first."
        )

    token = jwt.encode(
        {
            "mobile": data.mobile,
            "role": clean_role,
            "exp": datetime.utcnow() + timedelta(days=1)
        },
        SECRET_KEY,
        algorithm="HS256"
    )

    response = {
        "access_token": token,
        "role": clean_role,
        "name": user.get("name")
    }

    if clean_role == "patient":
        response["patient_id"] = user["id"]
        patient = get_document(PATIENTS_COLLECTION, user["id"])
        if patient:
            response["age"] = patient.get("age")
            response["gender"] = patient.get("gender")
            response["state"] = patient.get("state")
            response["district"] = patient.get("district")
    elif clean_role == "doctor":
        doctor = get_document(DOCTORS_COLLECTION, user["id"])
        if not doctor:
            raise HTTPException(
                status_code=404,
                detail="Doctor profile not found"
            )
        response["doctor_id"] = user["id"]

    return response


# =========================
# DELETE ACCOUNT
# =========================


@router.delete('/delete/{user_id}')
def delete_account(user_id: int):
    user = get_document(USERS_COLLECTION, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    delete_document(PATIENTS_COLLECTION, user_id)
    delete_document(DOCTORS_COLLECTION, user_id)

    for appointment in filter_documents(
        "appointments",
        lambda item: item.get("patient_id") == user_id or item.get("doctor_id") == user_id,
    ):
        delete_document("appointments", appointment["id"])

    for notification in filter_documents(
        "notifications",
        lambda item: item.get("user_id") == user_id,
    ):
        delete_document("notifications", notification["id"])

    delete_document(USERS_COLLECTION, user_id)

    return {"message": "Account deleted successfully"}