import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "QueueLess" / "backend"))

from app.database import SessionLocal
from app.routers.auth import login, LoginRequest

db = SessionLocal()
try:
    req = LoginRequest(mobile="9296600679", role="patient")
    res = login(req, db)
    print("SUCCESS:", res)
except Exception as e:
    import traceback
    print("ERROR TRACEBACK:")
    traceback.print_exc()
