from datetime import datetime, timedelta
from typing import Union
from jose import JWTError, jwt
from app.schemas.token import TokenData

# Load environment variables
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# Create access token
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Verify access token
def verify_access_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        mobile = payload.get("mobile")
        role = payload.get("role")

        if mobile is None:
            return None

        return {
            "mobile": mobile,
            "role": role
        }

    except JWTError:
        return None
    
def verify_access_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        print("PAYLOAD:", payload)

        mobile = payload.get("mobile")
        role = payload.get("role")

        if mobile is None:
            return None

        return {
            "mobile": mobile,
            "role": role
        }

    except JWTError as e:
        print("JWT ERROR:", e)
        return None