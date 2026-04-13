from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.users_service import decode_token

try:
    from app.database import get_db
except ImportError:
    def get_db():
        raise RuntimeError("get_db 未配置，请在 app.database 中提供 SQLAlchemy Session 依赖")


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="未提供认证令牌")

    payload = decode_token(credentials.credentials)
    user_id = payload.get("userId")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在或令牌失效")

    return user
