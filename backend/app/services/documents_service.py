from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.document import Document


def _success(data: Any) -> Dict[str, Any]:
    return {
        "code": 0,
        "message": "success",
        "data": data,
    }


def _document_to_dict(document: Document) -> Dict[str, Any]:
    return {
        "id": document.id,
        "project_id": document.project_id,
        "title": document.title,
        "content": document.content,
        "created_at": document.created_at.isoformat() if document.created_at else None,
        "updated_at": document.updated_at.isoformat() if document.updated_at else None,
    }


def create_document(db: Session, project_id: int, title: str, content: str):
    if project_id is None or not title:
        raise HTTPException(status_code=400, detail="请求参数错误")

    now = datetime.utcnow()
    document = Document(
        project_id=project_id,
        title=title,
        content=content,
        created_at=now,
        updated_at=now,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return _success(_document_to_dict(document))


def get_document_by_id(db: Session, document_id: int):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")

    return _success(_document_to_dict(document))


def list_documents_by_project(db: Session, project_id: int):
    if project_id is None:
        raise HTTPException(status_code=400, detail="请求参数错误")

    documents = (
        db.query(Document)
        .filter(Document.project_id == project_id)
        .order_by(Document.id)
        .all()
    )
    return _success([_document_to_dict(document) for document in documents])


def search_documents(db: Session, project_id: Optional[int] = None, keyword: Optional[str] = None):
    query = db.query(Document)

    if project_id is not None:
        query = query.filter(Document.project_id == project_id)

    if keyword is not None and keyword != "":
        pattern = f"%{keyword}%"
        query = query.filter(
            or_(
                Document.title.like(pattern),
                Document.content.like(pattern),
            )
        )

    documents = query.order_by(Document.id).all()
    return _success([_document_to_dict(document) for document in documents])


def update_document(db: Session, document_id: int, title: str, content: str):
    if not title:
        raise HTTPException(status_code=400, detail="请求参数错误")

    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")

    document.title = title
    document.content = content
    document.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(document)

    return _success(_document_to_dict(document))


def patch_document(db: Session, document_id: int, title: Optional[str] = None, content: Optional[str] = None):
    if title is None and content is None:
        raise HTTPException(status_code=400, detail="至少提供一个可更新字段")

    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")

    if title is not None:
        if not title:
            raise HTTPException(status_code=400, detail="请求参数错误")
        document.title = title

    if content is not None:
        document.content = content

    document.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(document)

    return _success(_document_to_dict(document))


def delete_document(db: Session, document_id: int):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")

    db.delete(document)
    db.commit()

    return _success(None)
