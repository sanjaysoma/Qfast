from datetime import datetime, timedelta

from fastapi import HTTPException
from jose import JWTError, jwt

from app.config import ALGORITHM, OTP_TOKEN_EXPIRE_MINUTES, SECRET_KEY


def normalize_phone_digits(phone: str) -> str:
    digits = "".join(ch for ch in str(phone) if ch.isdigit())
    return digits[-10:]


def create_otp_token(phone: str) -> str:
    digits = normalize_phone_digits(phone)
    if len(digits) != 10:
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit mobile number")

    return jwt.encode(
        {
            "mobile": digits,
            "purpose": "otp_verified",
            "exp": datetime.utcnow() + timedelta(minutes=OTP_TOKEN_EXPIRE_MINUTES),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def verify_otp_token(otp_token: str) -> dict:
    try:
        payload = jwt.decode(otp_token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP token") from exc

    if payload.get("purpose") != "otp_verified":
        raise HTTPException(status_code=401, detail="Invalid OTP token purpose")

    mobile = normalize_phone_digits(payload.get("mobile", ""))
    if len(mobile) != 10:
        raise HTTPException(status_code=401, detail="OTP token is missing a valid mobile number")

    return payload
