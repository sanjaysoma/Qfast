## Backend

Location: `backend/QFast/backend`

### Run

```powershell
cd D:\backup\OneDrive\Desktop\QFast\backend\QFast\backend
uvicorn app.main:app --reload
```

### Firebase-only mode

This backend is now configured to use Firebase as the primary database layer when `USE_FIREBASE_DATABASE=true` in `.env`.

Required before startup succeeds:

1. `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON` must point to a valid Firebase Admin credential.
2. `FIREBASE_DATABASE_URL` must point to your Firebase Realtime Database endpoint.
3. Firebase Realtime Database must be created and reachable for the project.

If Realtime Database is unavailable or misconfigured, startup will fail with a clear error instead of silently falling back to the old PostgreSQL flow.


