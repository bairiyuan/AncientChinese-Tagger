from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

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


_projects: Dict[int, dict] = {}
_next_id: int = 1


def _get_next_id() -> int:
    global _next_id
    current = _next_id
    _next_id += 1
    return current


def _find_project_or_404(project_id: int) -> dict:
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return project


@router.get("")
async def list_projects(
    ownerId: Optional[int] = Query(None, ge=1, description="按所有者过滤"),
    page: int = Query(1, ge=1, description="页码"),
    pageSize: int = Query(10, ge=1, le=100, description="每页数量"),
):
    projects = list(_projects.values())

    if ownerId is not None:
        projects = [project for project in projects if project["ownerId"] == ownerId]

    total = len(projects)
    start = (page - 1) * pageSize
    end = start + pageSize
    items = projects[start:end]

    return {
        "code": 0,
        "message": "success",
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "pageSize": pageSize,
        },
    }


@router.post("", status_code=201)
async def create_project(body: ProjectCreate):
    project_id = _get_next_id()
    now = datetime.now(timezone.utc).isoformat()

    project = {
        "id": project_id,
        "name": body.name,
        "description": body.description,
        "ownerId": body.ownerId,
        "createdAt": now,
        "updatedAt": now,
    }

    _projects[project_id] = project
    return {"code": 0, "message": "success", "data": project}


@router.get("/{projectId}")
async def get_project(projectId: int):
    project = _find_project_or_404(projectId)
    return {"code": 0, "message": "success", "data": project}


@router.put("/{projectId}")
async def update_project(projectId: int, body: ProjectUpdate):
    project = _find_project_or_404(projectId)

    project["name"] = body.name
    project["description"] = body.description
    project["ownerId"] = body.ownerId
    project["updatedAt"] = datetime.now(timezone.utc).isoformat()

    return {"code": 0, "message": "success", "data": project}


@router.patch("/{projectId}")
async def patch_project(projectId: int, body: ProjectPatch):
    project = _find_project_or_404(projectId)

    if body.name is None and body.description is None and body.ownerId is None:
        raise HTTPException(status_code=400, detail="至少提供一个可更新字段")

    if body.name is not None:
        project["name"] = body.name
    if body.description is not None:
        project["description"] = body.description
    if body.ownerId is not None:
        project["ownerId"] = body.ownerId

    project["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"code": 0, "message": "success", "data": project}


@router.delete("/{projectId}")
async def delete_project(projectId: int):
    _find_project_or_404(projectId)
    del _projects[projectId]
    return {"code": 0, "message": "success", "data": None}
