from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services import projects_service

try:
    from app.database import get_db
except ImportError:
    def get_db():
        raise RuntimeError("get_db 未配置，请在 app.database 中提供 SQLAlchemy Session 依赖")


router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    ownerId: int = Field(..., ge=1)


class ProjectUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    ownerId: int = Field(..., ge=1)


class ProjectPatch(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = Field(None, min_length=1)
    ownerId: Optional[int] = Field(None, ge=1)


def _to_api_project(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": item.get("id"),
        "name": item.get("name"),
        "description": item.get("description"),
        "ownerId": item.get("owner_id"),
        "created_at": item.get("created_at"),
        "updated_at": item.get("updated_at"),
        "documentsCount": item.get("documents_count", 0),
        "annotationsCount": item.get("annotations_count", 0),
        "entityDistribution": item.get("entity_distribution", {}),
    }


def _success(code: int, message: str, data: Any) -> Dict[str, Any]:
    return {
        "code": code,
        "message": message,
        "data": data,
    }


@router.get("")
async def list_projects(
    ownerId: Optional[int] = Query(None, ge=1, description="按所有者过滤"),
    page: int = Query(1, ge=1, description="页码"),
    pageSize: int = Query(10, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = projects_service.list_projects(db=db, owner_id=ownerId, current_user_id=current_user.id)
    items = [_to_api_project(item) for item in result.get("data", [])]

    total = len(items)
    start = (page - 1) * pageSize
    end = start + pageSize

    return _success(
        code=result.get("code", 0),
        message=result.get("message", "success"),
        data={
            "items": items[start:end],
            "total": total,
            "page": page,
            "pageSize": pageSize,
        },
    )


@router.post("", status_code=201)
async def create_project(body: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = projects_service.create_project(
        db=db,
        name=body.name,
        description=body.description,
        owner_id=current_user.id,
    )
    return _success(
        code=result.get("code", 0),
        message=result.get("message", "success"),
        data=_to_api_project(result.get("data")) if result.get("data") else None,
    )


@router.get("/{projectId}")
async def get_project(projectId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = projects_service.get_project_by_id(db=db, project_id=projectId, current_user_id=current_user.id)
    return _success(
        code=result.get("code", 0),
        message=result.get("message", "success"),
        data=_to_api_project(result.get("data")) if result.get("data") else None,
    )


@router.put("/{projectId}")
async def update_project(projectId: int, body: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = projects_service.update_project(
        db=db,
        project_id=projectId,
        name=body.name,
        description=body.description,
        owner_id=body.ownerId,
        current_user_id=current_user.id,
    )
    return _success(
        code=result.get("code", 0),
        message=result.get("message", "success"),
        data=_to_api_project(result.get("data")) if result.get("data") else None,
    )


@router.patch("/{projectId}")
async def patch_project(projectId: int, body: ProjectPatch, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = projects_service.patch_project(
        db=db,
        project_id=projectId,
        name=body.name,
        description=body.description,
        owner_id=body.ownerId,
        current_user_id=current_user.id,
    )
    return _success(
        code=result.get("code", 0),
        message=result.get("message", "success"),
        data=_to_api_project(result.get("data")) if result.get("data") else None,
    )


@router.delete("/{projectId}")
async def delete_project(projectId: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = projects_service.delete_project(db=db, project_id=projectId, current_user_id=current_user.id)
    return _success(
        code=result.get("code", 0),
        message=result.get("message", "success"),
        data=result.get("data"),
    )
