from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, model_validator

from app.routes import documents as documents_module

router = APIRouter(tags=["annotations"])


class EntityType(str, Enum):
    person = "person"
    location = "location"
    time = "time"
    other = "other"


class AnnotationCreate(BaseModel):
    entity: str = Field(..., min_length=1)
    entityType: EntityType
    startPos: int = Field(..., ge=0)
    endPos: int = Field(..., ge=0)

    @model_validator(mode="after")
    def validate_span(self):
        if self.endPos < self.startPos:
            raise ValueError("endPos 不能小于 startPos")
        return self


class AnnotationUpdate(BaseModel):
    entity: str = Field(..., min_length=1)
    entityType: EntityType
    startPos: int = Field(..., ge=0)
    endPos: int = Field(..., ge=0)

    @model_validator(mode="after")
    def validate_span(self):
        if self.endPos < self.startPos:
            raise ValueError("endPos 不能小于 startPos")
        return self


class AnnotationPatch(BaseModel):
    entity: Optional[str] = Field(None, min_length=1)
    entityType: Optional[EntityType] = None
    startPos: Optional[int] = Field(None, ge=0)
    endPos: Optional[int] = Field(None, ge=0)


_annotations: Dict[int, dict] = {}
_next_id: int = 1


def _get_next_id() -> int:
    global _next_id
    current = _next_id
    _next_id += 1
    return current


def _find_annotation_or_404(annotation_id: int) -> dict:
    annotation = _annotations.get(annotation_id)
    if not annotation:
        raise HTTPException(status_code=404, detail="标注不存在")
    return annotation


def _ensure_document_exists(document_id: int) -> None:
    if document_id not in documents_module._documents:
        raise HTTPException(status_code=404, detail="文档不存在")


def _validate_span(start_pos: int, end_pos: int) -> None:
    if end_pos < start_pos:
        raise HTTPException(status_code=400, detail="endPos 不能小于 startPos")


@router.get("/api/documents/{documentId}/annotations")
async def list_annotations_by_document(documentId: int):
    _ensure_document_exists(documentId)
    items = [anno for anno in _annotations.values() if anno["documentId"] == documentId]
    return {"code": 0, "message": "success", "data": items}


@router.post("/api/documents/{documentId}/annotations", status_code=201)
async def create_annotation_in_document(documentId: int, body: AnnotationCreate):
    _ensure_document_exists(documentId)

    annotation_id = _get_next_id()
    now = datetime.now(timezone.utc).isoformat()
    annotation = {
        "id": annotation_id,
        "documentId": documentId,
        "entity": body.entity,
        "entityType": body.entityType.value,
        "startPos": body.startPos,
        "endPos": body.endPos,
        "createdAt": now,
        "updatedAt": now,
    }
    _annotations[annotation_id] = annotation

    return {"code": 0, "message": "success", "data": annotation}


@router.get("/api/annotations")
async def list_annotations(
    projectId: Optional[int] = Query(None, ge=1),
    documentId: Optional[int] = Query(None, ge=1),
    entityType: Optional[EntityType] = Query(None),
):
    items = list(_annotations.values())

    if documentId is not None:
        items = [anno for anno in items if anno["documentId"] == documentId]

    if projectId is not None:
        items = [
            anno
            for anno in items
            if documents_module._documents.get(anno["documentId"], {}).get("projectId") == projectId
        ]

    if entityType is not None:
        items = [anno for anno in items if anno["entityType"] == entityType.value]

    return {"code": 0, "message": "success", "data": items}


@router.get("/api/annotations/{annotationId}")
async def get_annotation(annotationId: int):
    annotation = _find_annotation_or_404(annotationId)
    return {"code": 0, "message": "success", "data": annotation}


@router.put("/api/annotations/{annotationId}")
async def update_annotation(annotationId: int, body: AnnotationUpdate):
    annotation = _find_annotation_or_404(annotationId)

    annotation["entity"] = body.entity
    annotation["entityType"] = body.entityType.value
    annotation["startPos"] = body.startPos
    annotation["endPos"] = body.endPos
    annotation["updatedAt"] = datetime.now(timezone.utc).isoformat()

    return {"code": 0, "message": "success", "data": annotation}


@router.patch("/api/annotations/{annotationId}")
async def patch_annotation(annotationId: int, body: AnnotationPatch):
    annotation = _find_annotation_or_404(annotationId)

    if (
        body.entity is None
        and body.entityType is None
        and body.startPos is None
        and body.endPos is None
    ):
        raise HTTPException(status_code=400, detail="至少提供一个可更新字段")

    start_pos = body.startPos if body.startPos is not None else annotation["startPos"]
    end_pos = body.endPos if body.endPos is not None else annotation["endPos"]
    _validate_span(start_pos, end_pos)

    if body.entity is not None:
        annotation["entity"] = body.entity
    if body.entityType is not None:
        annotation["entityType"] = body.entityType.value
    if body.startPos is not None:
        annotation["startPos"] = body.startPos
    if body.endPos is not None:
        annotation["endPos"] = body.endPos

    annotation["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"code": 0, "message": "success", "data": annotation}


@router.delete("/api/annotations/{annotationId}")
async def delete_annotation(annotationId: int):
    _find_annotation_or_404(annotationId)
    del _annotations[annotationId]
    return {"code": 0, "message": "success", "data": None}
