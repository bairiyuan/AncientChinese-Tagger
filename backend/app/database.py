import os

import pymysql


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


def fetch_sample_data():
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, name, description, owner_id, created_at FROM projects ORDER BY id LIMIT 5"
            )
            projects = cursor.fetchall()

            cursor.execute(
                "SELECT id, project_id, title, created_at FROM documents ORDER BY id LIMIT 5"
            )
            documents = cursor.fetchall()

        return {"projects": projects, "documents": documents}
    finally:
        connection.close()

