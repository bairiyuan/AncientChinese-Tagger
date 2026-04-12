from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(tags=["documents"])


class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)


class DocumentUpdate(BaseModel):
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)


class DocumentPatch(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    content: Optional[str] = Field(None, min_length=1)


_documents: Dict[int, dict] = {}
_next_id: int = 1


def _get_next_id() -> int:
    global _next_id
    current = _next_id
    _next_id += 1
    return current


def _find_document_or_404(document_id: int) -> dict:
    document = _documents.get(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")
    return document


@router.get("/api/projects/{projectId}/documents")
async def list_documents_by_project(
    projectId: int,
    page: int = Query(1, ge=1, description="页码"),
    pageSize: int = Query(10, ge=1, le=100, description="每页数量"),
):
    filtered = [doc for doc in _documents.values() if doc["projectId"] == projectId]
    total = len(filtered)
    start = (page - 1) * pageSize
    end = start + pageSize
    items = filtered[start:end]

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


@router.post("/api/projects/{projectId}/documents", status_code=201)
async def create_document_in_project(projectId: int, body: DocumentCreate):
    document_id = _get_next_id()
    now = datetime.now(timezone.utc).isoformat()

    document = {
        "id": document_id,
        "projectId": projectId,
        "title": body.title,
        "content": body.content,
        "createdAt": now,
        "updatedAt": now,
    }
    _documents[document_id] = document

    return {
        "code": 0,
        "message": "success",
        "data": document,
    }


@router.get("/api/documents")
async def list_documents(
    projectId: Optional[int] = Query(None, ge=1, description="按项目过滤"),
    keyword: Optional[str] = Query(None, description="按标题或内容关键字模糊搜索"),
    page: int = Query(1, ge=1, description="页码"),
    pageSize: int = Query(10, ge=1, le=100, description="每页数量"),
):
    docs = list(_documents.values())

    if projectId is not None:
        docs = [doc for doc in docs if doc["projectId"] == projectId]

    if keyword:
        keyword_lower = keyword.lower()
        docs = [
            doc
            for doc in docs
            if keyword_lower in doc["title"].lower() or keyword_lower in doc["content"].lower()
        ]

    total = len(docs)
    start = (page - 1) * pageSize
    end = start + pageSize
    items = docs[start:end]

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


@router.get("/api/documents/{documentId}")
async def get_document(documentId: int):
    document = _find_document_or_404(documentId)
    return {"code": 0, "message": "success", "data": document}


@router.put("/api/documents/{documentId}")
async def update_document(documentId: int, body: DocumentUpdate):
    document = _find_document_or_404(documentId)
    document["title"] = body.title
    document["content"] = body.content
    document["updatedAt"] = datetime.now(timezone.utc).isoformat()

    return {"code": 0, "message": "success", "data": document}


@router.patch("/api/documents/{documentId}")
async def patch_document(documentId: int, body: DocumentPatch):
    document = _find_document_or_404(documentId)

    if body.title is None and body.content is None:
        raise HTTPException(status_code=400, detail="至少提供一个可更新字段")

    if body.title is not None:
        document["title"] = body.title
    if body.content is not None:
        document["content"] = body.content

    document["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"code": 0, "message": "success", "data": document}


@router.delete("/api/documents/{documentId}")
async def delete_document(documentId: int):
    _find_document_or_404(documentId)
    del _documents[documentId]
    return {"code": 0, "message": "success", "data": None}
