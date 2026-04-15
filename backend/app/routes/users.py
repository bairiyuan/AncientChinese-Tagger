from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services import users_service

try:
    from app.database import get_db
except ImportError:
    def get_db():
        raise RuntimeError("get_db 未配置，请在 app.database 中提供 SQLAlchemy Session 依赖")


router = APIRouter(prefix="/api/users", tags=["users"])


class UserCreate(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class UserUpdate(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class UserPatch(BaseModel):
    username: Optional[str] = Field(None, min_length=1)
    password: Optional[str] = Field(None, min_length=1)


class LoginBody(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


def _success(result: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "code": result.get("code", 0),
        "message": result.get("message", "success"),
        "data": result.get("data"),
    }


@router.get("")
async def list_users(
    page: int = Query(1, ge=1, description="页码"),
    pageSize: int = Query(10, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    result = users_service.list_users(db=db, page=page, page_size=pageSize)
    return _success(result)


@router.post("", status_code=201)
async def create_user(body: UserCreate, db: Session = Depends(get_db)):
    result = users_service.create_user(db=db, username=body.username, password=body.password)
    return _success(result)


@router.post("/login")
async def user_login(body: LoginBody, db: Session = Depends(get_db)):
    result = users_service.login_user(db=db, username=body.username, password=body.password)
    data = result.get("data", {})
    user = data.get("user", {}) if isinstance(data, dict) else {}

    return {
        "code": 200,
        "message": "登录成功",
        "data": {
            "id": user.get("id"),
            "username": user.get("username"),
            "token": data.get("token") if isinstance(data, dict) else None,
        },
    }


@router.get("/{userId}")
async def get_user(
    userId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    result = users_service.get_user_by_id(db=db, user_id=userId)
    return _success(result)


@router.put("/{userId}")
async def update_user(
    userId: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    result = users_service.update_user(
        db=db,
        user_id=userId,
        username=body.username,
        password=body.password,
    )
    return _success(result)


@router.patch("/{userId}")
async def patch_user(
    userId: int,
    body: UserPatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    result = users_service.patch_user(
        db=db,
        user_id=userId,
        username=body.username,
        password=body.password,
    )
    return _success(result)


@router.delete("/{userId}")
async def delete_user(
    userId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    result = users_service.delete_user(db=db, user_id=userId)
    return _success(result)
