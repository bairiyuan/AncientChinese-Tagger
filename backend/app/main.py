from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from .database import fetch_sample_data  # noqa: E402
from .routes.annotations import router as annotations_router  # noqa: E402
from .routes.documents import router as documents_router  # noqa: E402
from .routes.projects import router as projects_router  # noqa: E402
from .routes.users import router as users_router  # noqa: E402
from .routes.ai import router as ai_router  # noqa: E402


app = FastAPI(title="AncientChinese Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
app.include_router(ai_router)
