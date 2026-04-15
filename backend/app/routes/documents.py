from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.services import annotations_service, documents_service
from app.services.xunzi_service import call_xunzi_model
from app.utils.document_utils import export_document_with_annotations, import_document

try:
    from app.database import get_db
except ImportError:
    def get_db():
        raise RuntimeError("get_db 未配置，请在 app.database 中提供 SQLAlchemy Session 依赖")


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


class XunziGenerateRequest(BaseModel):
    text: str = Field(..., min_length=1)


def _success(code: int, message: str, data: Any) -> Dict[str, Any]:
    return {
        "code": code,
        "message": message,
        "data": data,
    }


def _annotation_to_api(item: dict) -> dict:
    return {
        "entity": item.get("entity"),
        "entityType": item.get("entity_type", item.get("entityType")),
        "startPos": item.get("start_pos", item.get("startPos")),
        "endPos": item.get("end_pos", item.get("endPos")),
    }


@router.get("/api/projects/{project_id}/documents")
async def list_documents_by_project(
    project_id: int,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
):
    result = documents_service.list_documents_by_project(db=db, project_id=project_id)
    items = result.get("data", [])

    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size

    return _success(
        code=result.get("code", 0),
        message=result.get("message", "success"),
        data={
            "items": items[start:end],
            "total": total,
            "page": page,
            "page_size": page_size,
        },
    )


@router.post("/api/projects/{project_id}/documents", status_code=201)
async def create_document_in_project(project_id: int, body: DocumentCreate, db: Session = Depends(get_db)):
    result = documents_service.create_document(
        db=db,
        project_id=project_id,
        title=body.title,
        content=body.content,
    )
    return _success(result.get("code", 0), result.get("message", "success"), result.get("data"))


@router.get("/api/documents")
async def list_documents(
    project_id: Optional[int] = Query(None, ge=1, description="按项目过滤"),
    keyword: Optional[str] = Query(None, description="按标题或内容关键字模糊搜索"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
):
    result = documents_service.search_documents(db=db, project_id=project_id, keyword=keyword)
    items = result.get("data", [])

    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size

    return _success(
        code=result.get("code", 0),
        message=result.get("message", "success"),
        data={
            "items": items[start:end],
            "total": total,
            "page": page,
            "page_size": page_size,
        },
    )


@router.post("/api/projects/{project_id}/documents/import", status_code=201)
async def import_document_api(project_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename or ""
    if not filename.lower().endswith(".txt"):
        raise HTTPException(status_code=400, detail="仅支持 txt 文件导入")

    suffix = Path(filename).suffix or ".txt"
    temp_path: Optional[str] = None

    try:
        with NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            temp.write(await file.read())
            temp_path = temp.name

        imported = import_document(temp_path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except UnicodeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        if temp_path:
            try:
                Path(temp_path).unlink(missing_ok=True)
            except Exception:
                pass

    result = documents_service.create_document(
        db=db,
        project_id=project_id,
        title=imported["title"],
        content=imported["content"],
    )
    data = result.get("data") or {}
    data.setdefault("annotations", [])
    return _success(result.get("code", 0), result.get("message", "success"), data)


@router.get("/api/documents/{document_id}/export")
async def export_document_api(document_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    doc_result = documents_service.get_document_by_id(db=db, document_id=document_id)
    document = doc_result.get("data")

    anno_result = annotations_service.search_annotations(db=db, document_id=document_id)
    annotations: List[dict] = [
        _annotation_to_api(item) for item in anno_result.get("data", []) if isinstance(item, dict)
    ]

    with NamedTemporaryFile(delete=False, suffix=".json") as temp:
        temp_path = temp.name

    export_document_with_annotations(document, annotations, temp_path, format="json")

    filename = f"{document['title']}.json"
    background_tasks.add_task(Path(temp_path).unlink, missing_ok=True)

    return FileResponse(
        path=temp_path,
        media_type="application/json",
        filename=filename,
        background=background_tasks,
    )


@router.post("/api/documents/xunzi/generate")
async def generate_with_xunzi(body: XunziGenerateRequest):
    result = call_xunzi_model(body.text)
    return _success(0, "success", {"result": result})


@router.get("/api/documents/{document_id}")
async def get_document(document_id: int, db: Session = Depends(get_db)):
    result = documents_service.get_document_by_id(db=db, document_id=document_id)
    return _success(result.get("code", 0), result.get("message", "success"), result.get("data"))


@router.put("/api/documents/{document_id}")
async def update_document(document_id: int, body: DocumentUpdate, db: Session = Depends(get_db)):
    result = documents_service.update_document(
        db=db,
        document_id=document_id,
        title=body.title,
        content=body.content,
    )
    return _success(result.get("code", 0), result.get("message", "success"), result.get("data"))


@router.patch("/api/documents/{document_id}")
async def patch_document(document_id: int, body: DocumentPatch, db: Session = Depends(get_db)):
    result = documents_service.patch_document(
        db=db,
        document_id=document_id,
        title=body.title,
        content=body.content,
    )
    return _success(result.get("code", 0), result.get("message", "success"), result.get("data"))


@router.delete("/api/documents/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    result = documents_service.delete_document(db=db, document_id=document_id)
    return _success(result.get("code", 0), result.get("message", "success"), result.get("data"))
