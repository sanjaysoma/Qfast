from fastapi import HTTPException, status
from app.utils.password_handler import verify_password
from app.utils.jwt_handler import create_access_token
from app.schemas.user import UserInDB

# Mock database (replace with real database queries)
# fake_users_db = {
#     "testuser": {
#         "username": "testuser",
#         "email": "testuser@example.com",
#         "hashed_password": "$2b$12$Mmx4hRrpyJc3Vlk6w1mnUubDPe2CTWasNgj7B1Zn9kOXG5AVeHo/m",  # bcrypt hash of "password"
#         "is_active": True,
#     }
# }
fake_users_db = {
    "testuser": {
        "id": 1,
        "name": "Test User",
        "username": "testuser",
        "email": "test@test.com",
        "hashed_password": "$2b$12$Mmx4hRrpyJc3Vlk6w1mnUubDPe2CTWasNgj7B1Zn9kOXG5AVeHo/m",
        "is_active": True,
        "is_admin": False
    }
}
# Authenticate user
def authenticate_user(username: str, password: str) -> UserInDB:
    user = fake_users_db.get(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    if not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    return UserInDB(**user)

# Login and generate token
def login_for_access_token(username: str, password: str) -> str:
    user = authenticate_user(username, password)
    access_token = create_access_token(data={"sub": user.username})
    return access_token