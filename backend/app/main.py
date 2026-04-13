from fastapi import FastAPI

from .database import fetch_sample_data
from .routes.annotations import router as annotations_router
from .routes.documents import router as documents_router
from .routes.projects import router as projects_router
from .routes.users import router as users_router


app = FastAPI(title="AncientChinese Backend")


@app.get("/")
async def root():
    return {"message": "AncientChinese backend is running"}


@app.get("/db-sample")
async def db_sample():
    data = fetch_sample_data()
    return {"message": "Database sample data", "data": data}


app.include_router(projects_router)
app.include_router(documents_router)
app.include_router(annotations_router)
app.include_router(users_router)
