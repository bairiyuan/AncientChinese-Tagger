import os
import time
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# 智能加载 .env 文件：优先当前目录，其次向上查找
env_path = Path('.') / '.env'
if not env_path.exists():
    env_path = Path('..') / '.env'

load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from .database import fetch_sample_data, engine  # noqa: E402
from .models.base import Base  # noqa: E402
from .models import user, project, document, annotation  # noqa: F401, E402
from .utils.logger import logger  # noqa: E402

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

# 指标统计 (内存中简易版)
metrics = {
    "total_requests": 0,
    "error_requests": 0,
    "start_time": datetime.now().isoformat()
}

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    请求中间件：收集指标并记录日志
    """
    start_time = time.time()
    metrics["total_requests"] += 1
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    
    if response.status_code >= 400:
        metrics["error_requests"] += 1
        
    # 记录结构化请求日志
    logger.info(
        f"Request: {request.method} {request.url.path} "
        f"Status: {response.status_code} Time: {process_time:.4f}s"
    )
    
    return response

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
    """
    增强版健康检查端点
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "uptime": metrics["start_time"]
    }


@app.get("/metrics")
async def get_metrics():
    """
    基础指标收集端点
    """
    error_rate = 0
    if metrics["total_requests"] > 0:
        error_rate = (metrics["error_requests"] / metrics["total_requests"]) * 100
        
    return {
        "total_requests": metrics["total_requests"],
        "error_requests": metrics["error_requests"],
        "error_rate": f"{error_rate:.2f}%",
        "server_time": datetime.now().isoformat()
    }


@app.get("/db-sample")
async def db_sample():
    data = fetch_sample_data()
    return {"message": "Database sample data", "data": data}


app.include_router(projects_router)
app.include_router(documents_router)
app.include_router(annotations_router)
app.include_router(users_router)
app.include_router(ai_router)
