from fastapi import HTTPException
from firebase_admin import auth as firebase_auth
from app.services.firebase_app import get_firebase_app
from app.services.otp_token import create_otp_token, normalize_phone_digits


def verify_firebase_phone_token(phone: str, firebase_id_token: str) -> dict:
    clean_mobile = normalize_phone_digits(phone)
    clean_token = firebase_id_token.strip()

    if len(clean_mobile) != 10:
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit mobile number")

    if not clean_token:
        raise HTTPException(status_code=400, detail="Missing Firebase ID token")

    get_firebase_app()

    try:
        decoded_token = firebase_auth.verify_id_token(clean_token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid Firebase phone verification token") from exc

    firebase_phone = normalize_phone_digits(decoded_token.get("phone_number", ""))
    sign_in_provider = decoded_token.get("firebase", {}).get("sign_in_provider")

    if sign_in_provider != "phone":
        raise HTTPException(status_code=401, detail="Firebase token is not from phone authentication")

    if firebase_phone != clean_mobile:
        raise HTTPException(status_code=400, detail="Verified phone number does not match the requested mobile")

    return {
        "message": "Mobile number verified successfully",
        "otp_token": create_otp_token(clean_mobile),
    }