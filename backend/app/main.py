import os
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from .database import fetch_sample_data, engine  # noqa: E402
from .models.base import Base  # noqa: E402
from .models import user, project, document, annotation  # noqa: F401, E402

# 仅在非测试环境下自动创建数据库表
if os.getenv("TESTING") != "true":
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"⚠️ 自动创建表失败 (这在 CI 测试环境下是正常的): {e}")

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


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/db-sample")
async def db_sample():
    data = fetch_sample_data()
    return {"message": "Database sample data", "data": data}


app.include_router(projects_router)
app.include_router(documents_router)
app.include_router(annotations_router)
app.include_router(users_router)
app.include_router(ai_router)
