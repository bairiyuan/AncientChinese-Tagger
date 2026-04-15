import os
from typing import Any, Dict, Generator

import pymysql
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker


def get_connection():
    host = os.getenv("DB_HOST")
    port = int(os.getenv("DB_PORT", "3306"))
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    database = os.getenv("DB_NAME")

    if not all([host, user, password, database]):
        raise RuntimeError("Database configuration is incomplete. Please set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME.")

    return pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        cursorclass=pymysql.cursors.DictCursor,
    )




def _build_sqlalchemy_url() -> str:
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT", "3306")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    database = os.getenv("DB_NAME")

    if not all([host, user, password, database]):
        raise RuntimeError("Database configuration is incomplete. Please set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME.")

    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"


DATABASE_URL = _build_sqlalchemy_url()
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def fetch_sample_data() -> Dict[str, Any]:
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT DATABASE() AS db_name, NOW() AS server_time")
            row = cursor.fetchone()
            return row or {}
    finally:
        conn.close()
