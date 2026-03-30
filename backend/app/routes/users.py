from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

import bcrypt
import jwt
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/users", tags=["users"])

# 生产环境请改为环境变量
JWT_SECRET = "replace-with-env-secret"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24


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


_users: Dict[int, dict] = {}
_next_id: int = 1


def _get_next_id() -> int:
    global _next_id
    current = _next_id
    _next_id += 1
    return current


def _find_user_or_404(user_id: int) -> dict:
    user = _users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


def _find_user_by_username(username: str) -> Optional[dict]:
    for user in _users.values():
        if user["username"] == username:
            return user
    return None


def _hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def _create_token(user_id: int) -> str:
    expire_at = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {
        "userId": user_id,
        "exp": expire_at,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _extract_bearer_token(authorization: str) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="缺少或无效的 Authorization 头")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Token 不能为空")
    return token


def get_current_user(authorization: str = Header(default="")) -> dict:
    token = _extract_bearer_token(authorization)
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token 已过期") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Token 无效") from exc

    user_id = payload.get("userId")
    if not isinstance(user_id, int):
        raise HTTPException(status_code=401, detail="Token 缺少用户信息")

    return _find_user_or_404(user_id)


@router.get("")
async def list_users(
    page: int = Query(1, ge=1, description="页码"),
    pageSize: int = Query(10, ge=1, le=100, description="每页数量"),
    _current_user: dict = Depends(get_current_user),
):
    all_users = list(_users.values())
    total = len(all_users)
    start = (page - 1) * pageSize
    end = start + pageSize
    items = all_users[start:end]
    return {
        "code": 0,
        "message": "success",
        "data": {"items": items, "total": total},
    }


@router.post("", status_code=201)
async def create_user(body: UserCreate):
    existing_user = _find_user_by_username(body.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="用户名已存在")

    user_id = _get_next_id()
    now = datetime.now(timezone.utc).isoformat()
    user = {
        "id": user_id,
        "username": body.username,
        "password": _hash_password(body.password),
        "createdAt": now,
        "updatedAt": now,
    }
    _users[user_id] = user
    return {"code": 0, "message": "success", "data": user}


@router.post("/login")
async def user_login(body: LoginBody):
    user = _find_user_by_username(body.username)
    if user is None or not _verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = _create_token(user["id"])
    return {
        "code": 200,
        "message": "登录成功",
        "data": {
            "id": user["id"],
            "username": user["username"],
            "token": token,
        },
    }


@router.get("/{userId}")
async def get_user(userId: int, _current_user: dict = Depends(get_current_user)):
    user = _find_user_or_404(userId)
    return {"code": 0, "message": "success", "data": user}


@router.put("/{userId}")
async def update_user(
    userId: int,
    body: UserUpdate,
    _current_user: dict = Depends(get_current_user),
):
    user = _find_user_or_404(userId)

    existing_user = _find_user_by_username(body.username)
    if existing_user and existing_user["id"] != userId:
        raise HTTPException(status_code=400, detail="用户名已存在")

    user["username"] = body.username
    user["password"] = _hash_password(body.password)
    user["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"code": 0, "message": "success", "data": user}


@router.patch("/{userId}")
async def patch_user(
    userId: int,
    body: UserPatch,
    _current_user: dict = Depends(get_current_user),
):
    user = _find_user_or_404(userId)

    if body.username is None and body.password is None:
        raise HTTPException(status_code=400, detail="至少提供一个可更新字段")

    if body.username is not None:
        existing_user = _find_user_by_username(body.username)
        if existing_user and existing_user["id"] != userId:
            raise HTTPException(status_code=400, detail="用户名已存在")
        user["username"] = body.username

    if body.password is not None:
        user["password"] = _hash_password(body.password)

    user["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"code": 0, "message": "success", "data": user}


@router.delete("/{userId}")
async def delete_user(userId: int, _current_user: dict = Depends(get_current_user)):
    _find_user_or_404(userId)
    del _users[userId]
    return {"code": 0, "message": "success", "data": None}
