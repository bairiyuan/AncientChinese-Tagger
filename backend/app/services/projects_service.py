from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.project import Project


def _success(data: Any) -> Dict[str, Any]:
    return {
        "code": 0,
        "message": "success",
        "data": data,
    }


def _project_to_dict(project: Project) -> Dict[str, Any]:
    # 统计该项目下所有文档的所有标注
    total_annotations = 0
    entity_distribution = {
        "person": 0,
        "location": 0,
        "time": 0,
        "other": 0
    }
    
    if hasattr(project, 'documents'):
        for doc in project.documents:
            if hasattr(doc, 'annotations'):
                total_annotations += len(doc.annotations)
                for ann in doc.annotations:
                    etype = ann.entity_type
                    if etype in entity_distribution:
                        entity_distribution[etype] += 1
                    else:
                        entity_distribution["other"] += 1

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "owner_id": project.owner_id,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
        "documents_count": len(project.documents) if hasattr(project, 'documents') else 0,
        "annotations_count": total_annotations,
        "entity_distribution": entity_distribution,
    }


def create_project(db: Session, name: str, description: str, owner_id: int):
    if not name or owner_id is None:
        raise HTTPException(status_code=400, detail="请求参数错误")

    now = datetime.utcnow()
    project = Project(
        name=name,
        description=description,
        owner_id=owner_id,
        created_at=now,
        updated_at=now,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return _success(_project_to_dict(project))


def _verify_project_ownership(db: Session, project_id: int, current_user_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    if project.owner_id != current_user_id:
        raise HTTPException(status_code=403, detail="无权操作该项目")
    return project


def get_project_by_id(db: Session, project_id: int, current_user_id: int):
    project = _verify_project_ownership(db, project_id, current_user_id)
    return _success(_project_to_dict(project))


def list_projects(db: Session, owner_id: Optional[int] = None, current_user_id: Optional[int] = None):
    query = db.query(Project)
    if owner_id is not None:
        query = query.filter(Project.owner_id == owner_id)
    # 移除强制按当前用户过滤的逻辑，允许查看所有项目
    # 如果未来需要实现私有项目，可以在这里添加权限检查

    projects = query.order_by(Project.id.desc()).all()
    return _success([_project_to_dict(project) for project in projects])


def update_project(db: Session, project_id: int, name: str, description: str, owner_id: int, current_user_id: int):
    if not name or owner_id is None:
        raise HTTPException(status_code=400, detail="请求参数错误")

    project = _verify_project_ownership(db, project_id, current_user_id)

    project.name = name
    project.description = description
    project.owner_id = owner_id
    project.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(project)

    return _success(_project_to_dict(project))


def patch_project(
    db: Session,
    project_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    owner_id: Optional[int] = None,
    current_user_id: Optional[int] = None,
):
    if name is None and description is None and owner_id is None:
        raise HTTPException(status_code=400, detail="至少提供一个可更新字段")

    project = _verify_project_ownership(db, project_id, current_user_id)

    if name is not None:
        if not name:
            raise HTTPException(status_code=400, detail="请求参数错误")
        project.name = name

    if description is not None:
        project.description = description

    if owner_id is not None:
        project.owner_id = owner_id

    project.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(project)

    return _success(_project_to_dict(project))


def delete_project(db: Session, project_id: int, current_user_id: int):
    project = _verify_project_ownership(db, project_id, current_user_id)

    db.delete(project)
    db.commit()

    return _success(None)
