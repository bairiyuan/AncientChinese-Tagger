import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User


JWT_SECRET = os.getenv("JWT_SECRET", "replace-with-env-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))


def _success(data: Any) -> Dict[str, Any]:
    return {
        "code": 0,
        "message": "success",
        "data": data,
    }


def _user_to_dict(user: User) -> Dict[str, Any]:
    return {
        "id": user.id,
        "username": user.username,
        "password": user.password,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


def _hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _create_token(user_id: int) -> str:
    expire_at = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {
        "userId": user_id,
        "exp": expire_at,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="登录已过期，请重新登录") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="无效的认证令牌") from exc

    user_id = payload.get("userId")
    if not isinstance(user_id, int):
        raise HTTPException(status_code=401, detail="无效的认证令牌")

    return payload


def create_user(db: Session, username: str, password: str):
    if not username or not password:
        raise HTTPException(status_code=400, detail="用户名和密码不能为空")

    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="用户名已存在")

    now = datetime.now(timezone.utc)
    user = User(
        username=username,
        password=_hash_password(password),
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _success(_user_to_dict(user))


def login_user(db: Session, username: str, password: str):
    if not username or not password:
        raise HTTPException(status_code=400, detail="用户名和密码不能为空")

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    if not bcrypt.checkpw(password.encode("utf-8"), user.password.encode("utf-8")):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = _create_token(user.id)

    return _success(
        {
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            },
        }
    )


def get_user_by_id(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    return _success(_user_to_dict(user))


def list_users(db: Session, page: int, page_size: int):
    if page < 1 or page_size < 1:
        raise HTTPException(status_code=400, detail="分页参数错误")

    query = db.query(User)
    total = query.count()

    items = (
        query.order_by(User.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return _success(
        {
            "items": [_user_to_dict(item) for item in items],
            "total": total,
        }
    )


def update_user(db: Session, user_id: int, username: str, password: str):
    if not username or not password:
        raise HTTPException(status_code=400, detail="用户名和密码不能为空")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    username_conflict = (
        db.query(User)
        .filter(User.username == username, User.id != user_id)
        .first()
    )
    if username_conflict:
        raise HTTPException(status_code=400, detail="用户名已存在")

    user.username = username
    user.password = _hash_password(password)
    user.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)

    return _success(_user_to_dict(user))


def patch_user(db: Session, user_id: int, username: Optional[str] = None, password: Optional[str] = None):
    if username is None and password is None:
        raise HTTPException(status_code=400, detail="至少提供一个可更新字段")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if username is not None:
        if not username:
            raise HTTPException(status_code=400, detail="用户名不能为空")
        username_conflict = (
            db.query(User)
            .filter(User.username == username, User.id != user_id)
            .first()
        )
        if username_conflict:
            raise HTTPException(status_code=400, detail="用户名已存在")
        user.username = username

    if password is not None:
        if not password:
            raise HTTPException(status_code=400, detail="密码不能为空")
        user.password = _hash_password(password)

    user.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)

    return _success(_user_to_dict(user))


def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    db.delete(user)
    db.commit()

    return _success(None)
