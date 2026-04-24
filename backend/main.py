from fastapi import FastAPI
from sqlalchemy import text
from database import engine

app = FastAPI()

@app.get("/api/db-test")
def db_test():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"message": "MySQL connected successfully"}