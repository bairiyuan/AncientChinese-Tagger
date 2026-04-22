from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.annotation import Annotation
from app.models.document import Document


ALLOWED_ENTITY_TYPES = {"person", "location", "time", "other"}


def _success(data: Any) -> Dict[str, Any]:
    return {
        "code": 0,
        "message": "success",
        "data": data,
    }


def _annotation_to_dict(annotation: Annotation) -> Dict[str, Any]:
    return {
        "id": annotation.id,
        "document_id": annotation.document_id,
        "entity": annotation.entity,
        "entity_type": annotation.entity_type,
        "start_pos": annotation.start_pos,
        "end_pos": annotation.end_pos,
        "created_at": annotation.created_at.isoformat() if annotation.created_at else None,
        "updated_at": annotation.updated_at.isoformat() if annotation.updated_at else None,
    }


def _validate_entity_type(entity_type: str) -> None:
    if entity_type not in ALLOWED_ENTITY_TYPES:
        raise HTTPException(status_code=400, detail="entity_type 参数错误")


def _validate_span(start_pos: int, end_pos: int) -> None:
    if start_pos < 0 or end_pos < 0 or end_pos < start_pos:
        raise HTTPException(status_code=400, detail="start_pos/end_pos 参数错误")


def create_annotation(
    db: Session,
    document_id: int,
    entity: str,
    entity_type: str,
    start_pos: int,
    end_pos: int,
):
    if document_id is None or not entity:
        raise HTTPException(status_code=400, detail="请求参数错误")

    # 检查文档是否存在
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")

    _validate_entity_type(entity_type)
    _validate_span(start_pos, end_pos)

    now = datetime.utcnow()
    annotation = Annotation(
        document_id=document_id,
        entity=entity,
        entity_type=entity_type,
        start_pos=start_pos,
        end_pos=end_pos,
        created_at=now,
        updated_at=now,
    )

    db.add(annotation)
    db.commit()
    db.refresh(annotation)

    return _success(_annotation_to_dict(annotation))


def create_annotations_bulk(
    db: Session,
    document_id: int,
    annotations_data: list
):
    if document_id is None or not annotations_data:
        raise HTTPException(status_code=400, detail="请求参数错误")

    # 检查文档是否存在
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")

    now = datetime.utcnow()
    created_annotations = []

    for data in annotations_data:
        entity = data.get("entity")
        entity_type = data.get("entity_type")
        start_pos = data.get("start_pos")
        end_pos = data.get("end_pos")

        if not entity:
            continue

        _validate_entity_type(entity_type)
        _validate_span(start_pos, end_pos)

        annotation = Annotation(
            document_id=document_id,
            entity=entity,
            entity_type=entity_type,
            start_pos=start_pos,
            end_pos=end_pos,
            created_at=now,
            updated_at=now,
        )
        db.add(annotation)
        created_annotations.append(annotation)

    db.commit()
    for ann in created_annotations:
        db.refresh(ann)

    return _success([_annotation_to_dict(item) for item in created_annotations])


def get_annotation_by_id(db: Session, annotation_id: int):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="标注不存在")

    return _success(_annotation_to_dict(annotation))


def list_annotations_by_document(db: Session, document_id: int):
    if document_id is None:
        raise HTTPException(status_code=400, detail="请求参数错误")

    annotations = (
        db.query(Annotation)
        .filter(Annotation.document_id == document_id)
        .order_by(Annotation.id)
        .all()
    )

    return _success([_annotation_to_dict(item) for item in annotations])


def search_annotations(
    db: Session,
    project_id: Optional[int] = None,
    document_id: Optional[int] = None,
    entity_type: Optional[str] = None,
):
    query = db.query(Annotation)

    if project_id is not None:
        query = query.join(Document, Annotation.document_id == Document.id).filter(
            Document.project_id == project_id
        )

    if document_id is not None:
        query = query.filter(Annotation.document_id == document_id)

    if entity_type is not None:
        _validate_entity_type(entity_type)
        query = query.filter(Annotation.entity_type == entity_type)

    annotations = query.order_by(Annotation.id).all()
    return _success([_annotation_to_dict(item) for item in annotations])


def update_annotation(
    db: Session,
    annotation_id: int,
    entity: str,
    entity_type: str,
    start_pos: int,
    end_pos: int,
):
    if not entity:
        raise HTTPException(status_code=400, detail="请求参数错误")

    _validate_entity_type(entity_type)
    _validate_span(start_pos, end_pos)

    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="标注不存在")

    annotation.entity = entity
    annotation.entity_type = entity_type
    annotation.start_pos = start_pos
    annotation.end_pos = end_pos
    annotation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(annotation)

    return _success(_annotation_to_dict(annotation))


def patch_annotation(
    db: Session,
    annotation_id: int,
    entity: Optional[str] = None,
    entity_type: Optional[str] = None,
    start_pos: Optional[int] = None,
    end_pos: Optional[int] = None,
):
    if entity is None and entity_type is None and start_pos is None and end_pos is None:
        raise HTTPException(status_code=400, detail="至少提供一个可更新字段")

    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="标注不存在")

    if entity is not None:
        if not entity:
            raise HTTPException(status_code=400, detail="请求参数错误")
        annotation.entity = entity

    if entity_type is not None:
        _validate_entity_type(entity_type)
        annotation.entity_type = entity_type

    new_start = annotation.start_pos if start_pos is None else start_pos
    new_end = annotation.end_pos if end_pos is None else end_pos
    _validate_span(new_start, new_end)

    if start_pos is not None:
        annotation.start_pos = start_pos

    if end_pos is not None:
        annotation.end_pos = end_pos

    annotation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(annotation)

    return _success(_annotation_to_dict(annotation))


def delete_annotation(db: Session, annotation_id: int):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="标注不存在")

    db.delete(annotation)
    db.commit()

    return _success(None)
