from fastapi.testclient import TestClient

from app.main import app
from app.routes import annotations as annotations_module
from app.routes import documents as documents_module


client = TestClient(app)


def _create_document(project_id: int, title: str, content: str) -> dict:
    resp = client.post(
        f"/api/projects/{project_id}/documents",
        json={"title": title, "content": content},
    )
    assert resp.status_code == 201
    return resp.json()["data"]


def _create_annotation(
    document_id: int,
    entity: str,
    entity_type: str,
    start_pos: int,
    end_pos: int,
) -> dict:
    resp = client.post(
        f"/api/documents/{document_id}/annotations",
        json={
            "entity": entity,
            "entityType": entity_type,
            "startPos": start_pos,
            "endPos": end_pos,
        },
    )
    assert resp.status_code == 201
    return resp.json()["data"]


def setup_function() -> None:
    annotations_module._annotations.clear()
    annotations_module._next_id = 1
    documents_module._documents.clear()
    documents_module._next_id = 1


def test_create_annotation_in_document_success() -> None:
    doc = _create_document(1, "文档A", "张三在长安。")
    created = _create_annotation(doc["id"], "张三", "person", 0, 1)

    assert created["id"] == 1
    assert created["documentId"] == doc["id"]
    assert created["entity"] == "张三"
    assert created["entityType"] == "person"
    assert created["startPos"] == 0
    assert created["endPos"] == 1


def test_list_annotations_by_document() -> None:
    doc1 = _create_document(1, "文档A", "张三在长安。")
    doc2 = _create_document(2, "文档B", "李四在洛阳。")

    _create_annotation(doc1["id"], "张三", "person", 0, 1)
    _create_annotation(doc1["id"], "长安", "location", 3, 4)
    _create_annotation(doc2["id"], "李四", "person", 0, 1)

    resp = client.get(f"/api/documents/{doc1['id']}/annotations")

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert len(body["data"]) == 2
    assert all(item["documentId"] == doc1["id"] for item in body["data"])


def test_list_annotations_global_with_filters() -> None:
    doc1 = _create_document(1, "文档A", "张三在长安。")
    doc2 = _create_document(2, "文档B", "李四在洛阳。")

    _create_annotation(doc1["id"], "张三", "person", 0, 1)
    _create_annotation(doc1["id"], "长安", "location", 3, 4)
    _create_annotation(doc2["id"], "李四", "person", 0, 1)

    resp = client.get("/api/annotations?projectId=1&entityType=person")

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert len(body["data"]) == 1
    assert body["data"][0]["entity"] == "张三"


def test_get_put_patch_delete_annotation_flow() -> None:
    doc = _create_document(1, "文档A", "张三在长安。")
    created = _create_annotation(doc["id"], "张三", "person", 0, 1)

    get_resp = client.get(f"/api/annotations/{created['id']}")
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["entity"] == "张三"

    put_resp = client.put(
        f"/api/annotations/{created['id']}",
        json={
            "entity": "李四",
            "entityType": "person",
            "startPos": 1,
            "endPos": 2,
        },
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["data"]["entity"] == "李四"
    assert put_resp.json()["data"]["startPos"] == 1

    patch_resp = client.patch(
        f"/api/annotations/{created['id']}",
        json={"entityType": "other"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["entityType"] == "other"

    delete_resp = client.delete(f"/api/annotations/{created['id']}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["data"] is None

    get_deleted_resp = client.get(f"/api/annotations/{created['id']}")
    assert get_deleted_resp.status_code == 404
    assert get_deleted_resp.json()["detail"] == "标注不存在"


def test_create_annotation_document_not_found() -> None:
    resp = client.post(
        "/api/documents/999/annotations",
        json={
            "entity": "张三",
            "entityType": "person",
            "startPos": 0,
            "endPos": 1,
        },
    )

    assert resp.status_code == 404
    assert resp.json()["detail"] == "文档不存在"


def test_patch_without_fields_should_fail() -> None:
    doc = _create_document(1, "文档A", "张三在长安。")
    created = _create_annotation(doc["id"], "张三", "person", 0, 1)

    resp = client.patch(f"/api/annotations/{created['id']}", json={})

    assert resp.status_code == 400
    assert resp.json()["detail"] == "至少提供一个可更新字段"


def test_patch_with_invalid_span_should_fail() -> None:
    doc = _create_document(1, "文档A", "张三在长安。")
    created = _create_annotation(doc["id"], "张三", "person", 0, 1)

    resp = client.patch(
        f"/api/annotations/{created['id']}",
        json={"startPos": 5, "endPos": 2},
    )

    assert resp.status_code == 400
    assert resp.json()["detail"] == "endPos 不能小于 startPos"
