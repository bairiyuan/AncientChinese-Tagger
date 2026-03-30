from fastapi import FastAPI

from .database import fetch_sample_data


app = FastAPI(title="AncientChinese Backend")


@app.get("/")
async def root():
    return {"message": "AncientChinese backend is running"}


@app.get("/db-sample")
async def db_sample():
    data = fetch_sample_data()
    return {"message": "Database sample data", "data": data}
