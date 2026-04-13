from enum import Enum
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session

from app.services import annotations_service
from app.utils import segment_text_with_jieba

try:
    from app.database import get_db
except ImportError:
    # 兼容当前工程尚未提供 get_db 的情况；实际运行时应由统一数据库模块提供。
    def get_db():
        raise RuntimeError("get_db 未配置，请在 app.database 中提供 SQLAlchemy Session 依赖")


router = APIRouter(tags=["annotations"])


class EntityType(str, Enum):
    person = "person"
    location = "location"
    time = "time"
    other = "other"


class AnnotationCreate(BaseModel):
    entity: str = Field(..., min_length=1)
    entity_type: EntityType
    start_pos: int = Field(..., ge=0)
    end_pos: int = Field(..., ge=0)

    @model_validator(mode="after")
    def validate_span(self):
        if self.end_pos < self.start_pos:
            raise ValueError("end_pos 不能小于 start_pos")
        return self


class AnnotationUpdate(BaseModel):
    entity: str = Field(..., min_length=1)
    entity_type: EntityType
    start_pos: int = Field(..., ge=0)
    end_pos: int = Field(..., ge=0)

    @model_validator(mode="after")
    def validate_span(self):
        if self.end_pos < self.start_pos:
            raise ValueError("end_pos 不能小于 start_pos")
        return self


class AnnotationPatch(BaseModel):
    entity: Optional[str] = Field(None, min_length=1)
    entity_type: Optional[EntityType] = None
    start_pos: Optional[int] = Field(None, ge=0)
    end_pos: Optional[int] = Field(None, ge=0)


class JiebaSegmentRequest(BaseModel):
    text: str = Field(..., min_length=1, description="待分词文本")


class JiebaSegmentResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: List[str]


def _to_api_annotation(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": item.get("id"),
        "document_id": item.get("document_id"),
        "entity": item.get("entity"),
        "entity_type": item.get("entity_type"),
        "start_pos": item.get("start_pos"),
        "end_pos": item.get("end_pos"),
        "created_at": item.get("created_at"),
        "updated_at": item.get("updated_at"),
    }


def _normalize_service_response(result: Dict[str, Any]) -> Dict[str, Any]:
    data = result.get("data")

    if isinstance(data, list):
        normalized_data: Any = [_to_api_annotation(item) for item in data]
    elif isinstance(data, dict):
        normalized_data = _to_api_annotation(data)
    else:
        normalized_data = data

    return {
        "code": result.get("code", 0),
        "message": result.get("message", "success"),
        "data": normalized_data,
    }


@router.post("/api/annotations/jieba-segment", response_model=JiebaSegmentResponse)
async def jieba_segment_text(body: JiebaSegmentRequest):
    tokens = segment_text_with_jieba(body.text)
    return {"code": 0, "message": "success", "data": tokens}


@router.get("/api/documents/{document_id}/annotations")
async def list_annotations_by_document(document_id: int, db: Session = Depends(get_db)):
    result = annotations_service.list_annotations_by_document(db=db, document_id=document_id)
    return _normalize_service_response(result)


@router.post("/api/documents/{document_id}/annotations", status_code=201)
async def create_annotation_in_document(
    document_id: int,
    body: AnnotationCreate,
    db: Session = Depends(get_db),
):
    result = annotations_service.create_annotation(
        db=db,
        document_id=document_id,
        entity=body.entity,
        entity_type=body.entity_type.value,
        start_pos=body.start_pos,
        end_pos=body.end_pos,
    )
    return _normalize_service_response(result)


@router.get("/api/annotations")
async def list_annotations(
    project_id: Optional[int] = Query(None, ge=1),
    document_id: Optional[int] = Query(None, ge=1),
    entity_type: Optional[EntityType] = Query(None),
    db: Session = Depends(get_db),
):
    result = annotations_service.search_annotations(
        db=db,
        project_id=project_id,
        document_id=document_id,
        entity_type=entity_type.value if entity_type is not None else None,
    )
    return _normalize_service_response(result)


@router.get("/api/annotations/{annotation_id}")
async def get_annotation(annotation_id: int, db: Session = Depends(get_db)):
    result = annotations_service.get_annotation_by_id(db=db, annotation_id=annotation_id)
    return _normalize_service_response(result)


@router.put("/api/annotations/{annotation_id}")
async def update_annotation(
    annotation_id: int,
    body: AnnotationUpdate,
    db: Session = Depends(get_db),
):
    result = annotations_service.update_annotation(
        db=db,
        annotation_id=annotation_id,
        entity=body.entity,
        entity_type=body.entity_type.value,
        start_pos=body.start_pos,
        end_pos=body.end_pos,
    )
    return _normalize_service_response(result)


@router.patch("/api/annotations/{annotation_id}")
async def patch_annotation(
    annotation_id: int,
    body: AnnotationPatch,
    db: Session = Depends(get_db),
):
    result = annotations_service.patch_annotation(
        db=db,
        annotation_id=annotation_id,
        entity=body.entity,
        entity_type=body.entity_type.value if body.entity_type is not None else None,
        start_pos=body.start_pos,
        end_pos=body.end_pos,
    )
    return _normalize_service_response(result)


@router.delete("/api/annotations/{annotation_id}")
async def delete_annotation(annotation_id: int, db: Session = Depends(get_db)):
    result = annotations_service.delete_annotation(db=db, annotation_id=annotation_id)
    return _normalize_service_response(result)
