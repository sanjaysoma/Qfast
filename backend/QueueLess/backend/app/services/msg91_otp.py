import json
import socket
from datetime import datetime, timedelta
from http.client import HTTPSConnection
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import HTTPSHandler, Request, build_opener, urlopen

from fastapi import HTTPException
from jose import JWTError, jwt

from app.config import (
    ALGORITHM,
    MSG91_AUTH_KEY,
    MSG91_COUNTRY_CODE,
    MSG91_FORCE_IPV4,
    MSG91_TEMPLATE_ID,
    OTP_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
)


MSG91_BASE_URL = "https://control.msg91.com/api/v5/otp"


class IPv4HTTPSConnection(HTTPSConnection):
    def connect(self):
        addresses = socket.getaddrinfo(
            self.host,
            self.port,
            family=socket.AF_INET,
            type=socket.SOCK_STREAM,
        )
        if not addresses:
            raise OSError(f"Could not resolve IPv4 address for {self.host}")

        last_error = None
        for family, socktype, proto, _, sockaddr in addresses:
            sock = None
            try:
                sock = socket.socket(family, socktype, proto)
                if self.timeout is not socket._GLOBAL_DEFAULT_TIMEOUT:
                    sock.settimeout(self.timeout)
                sock.connect(sockaddr)
                if self._tunnel_host:
                    self.sock = sock
                    self._tunnel()
                self.sock = self._context.wrap_socket(sock, server_hostname=self.host)
                return
            except OSError as exc:
                last_error = exc
                if sock is not None:
                    sock.close()

        if last_error is not None:
            raise last_error


class IPv4HTTPSHandler(HTTPSHandler):
    def https_open(self, request):
        return self.do_open(IPv4HTTPSConnection, request)


def normalize_phone_digits(phone: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    return digits[-10:]


def format_msg91_mobile(phone: str) -> str:
    digits = normalize_phone_digits(phone)
    if len(digits) != 10:
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit mobile number")

    return f"{MSG91_COUNTRY_CODE}{digits}"


def _require_msg91_config() -> None:
    if not MSG91_AUTH_KEY:
        raise HTTPException(
            status_code=500,
            detail="MSG91 OTP is not configured. Set MSG91_AUTH_KEY."
        )


def _read_json_response(request: Request) -> dict:
    try:
        opener = build_opener(IPv4HTTPSHandler()) if MSG91_FORCE_IPV4 else None
        open_request = opener.open if opener else urlopen
        with open_request(request, timeout=15) as response:
            raw_body = response.read().decode("utf-8")
    except HTTPError as exc:
        raw_body = exc.read().decode("utf-8", errors="ignore")
        detail = raw_body or "MSG91 request failed"
        raise HTTPException(status_code=502, detail=detail) from exc
    except URLError as exc:
        raise HTTPException(status_code=502, detail="Unable to reach MSG91 OTP service") from exc

    if not raw_body:
        return {}

    try:
        return json.loads(raw_body)
    except json.JSONDecodeError:
        return {"message": raw_body}


def _extract_message(payload: dict, fallback: str) -> str:
    for key in ("message", "msg", "error", "details"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return fallback


def _msg91_failed(payload: dict) -> bool:
    payload_type = str(payload.get("type", "")).lower()
    message = _extract_message(payload, "").lower()

    if payload_type == "success":
        return False
    if payload_type == "error":
        return True
    return any(fragment in message for fragment in [
        "invalid otp",
        "otp expired",
        "max retry",
        "wrong number",
        "no number",
        "error",
        "failed",
    ])


def send_otp(phone: str) -> dict:
    _require_msg91_config()

    mobile = format_msg91_mobile(phone)
    params_dict = {
        "authkey": MSG91_AUTH_KEY,
        "mobile": mobile,
    }

    # Some MSG91 OTP flows allow authkey + mobile without template_id.
    if MSG91_TEMPLATE_ID:
        params_dict["template_id"] = MSG91_TEMPLATE_ID

    params = urlencode(params_dict)
    request = Request(
        f"{MSG91_BASE_URL}?{params}",
        data=b"{}",
        headers={"content-type": "application/json"},
        method="POST",
    )

    payload = _read_json_response(request)
    if _msg91_failed(payload):
        raise HTTPException(status_code=400, detail=_extract_message(payload, "Unable to send OTP"))

    response = {
        "message": _extract_message(payload, "OTP sent successfully"),
    }

    request_id = payload.get("request_id")
    if isinstance(request_id, str) and request_id.strip():
        response["request_id"] = request_id.strip()

    provider_type = payload.get("type")
    if isinstance(provider_type, str) and provider_type.strip():
        response["provider_type"] = provider_type.strip()

    return response


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


def verify_otp(phone: str, otp: str) -> dict:
    _require_msg91_config()

    mobile = format_msg91_mobile(phone)
    code = otp.strip()
    if len(code) != 6 or not code.isdigit():
        raise HTTPException(status_code=400, detail="Enter the 6-digit OTP")

    params = urlencode({
        "otp": code,
        "mobile": mobile,
    })
    request = Request(
        f"{MSG91_BASE_URL}/verify?{params}",
        headers={"authkey": MSG91_AUTH_KEY},
        method="GET",
    )

    payload = _read_json_response(request)
    if _msg91_failed(payload):
        raise HTTPException(status_code=400, detail=_extract_message(payload, "OTP verification failed"))

    return {
        "message": _extract_message(payload, "Mobile number verified successfully"),
        "otp_token": create_otp_token(phone),
    }


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