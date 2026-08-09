import urllib.parse
from sqlalchemy import create_engine, text

db_url = "postgresql+psycopg2://postgres:sanjaySOMA%40136@db.iocikrgacnyhfflzhyjl.supabase.co:5432/postgres?sslmode=require"

print("Connecting to:", db_url)
try:
    engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 10})
    with engine.connect() as conn:
        res = conn.execute(text("SELECT count(*) FROM users;"))
        print("SUCCESS! User count:", res.scalar())
except Exception as e:
    import traceback
    print("DIRECT FAILED:")
    traceback.print_exc()

# Also test pooler url
pooler_url = "postgresql+psycopg2://postgres.iocikrgacnyhfflzhyjl:sanjaySOMA%40136@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
print("\nTesting Pooler URL:", pooler_url)
try:
    engine2 = create_engine(pooler_url, pool_pre_ping=True, connect_args={"connect_timeout": 10})
    with engine2.connect() as conn:
        res = conn.execute(text("SELECT count(*) FROM users;"))
        print("SUCCESS POOLER! User count:", res.scalar())
except Exception as e:
    import traceback
    print("POOLER FAILED:")
    traceback.print_exc()
