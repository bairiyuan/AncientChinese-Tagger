import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.database import get_db
from app.models.base import Base
from app.models.user import User
from app.models.project import Project
from app.models.document import Document
from app.models.annotation import Annotation

from sqlalchemy.pool import StaticPool

# 使用内存中的 SQLite 数据库进行测试
# connect_args={"check_same_thread": False} 和 StaticPool 配合使用可以确保在同一个线程/进程中共享内存数据库
SQLALCHEMY_DATABASE_URL = "sqlite://"

@pytest.fixture(scope="session")
def engine():
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()

@pytest.fixture
def db_session(engine):
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        # 清理所有表中的数据，确保测试独立性
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        session.commit()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db_session):
    from app.services.users_service import create_user
    user_data = create_user(db_session, "testuser", "testpassword")
    return user_data["data"]

@pytest.fixture
def auth_headers(client, test_user):
    _ = test_user  # 确保用户已创建
    response = client.post(
        "/api/users/login",
        json={"username": "testuser", "password": "testpassword"}
    )
    if response.status_code != 200:
        raise RuntimeError(f"Login failed in auth_headers fixture: {response.text}")
    token = response.json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}
