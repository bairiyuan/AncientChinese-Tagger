from fastapi.testclient import TestClient

from app.main import app
from app.routes import documents as documents_module


client = TestClient(app)


def _create_document(project_id: int, title: str, content: str) -> dict:
    resp = client.post(
        f"/api/projects/{project_id}/documents",
        json={"title": title, "content": content},
    )
    assert resp.status_code == 201
    return resp.json()["data"]


def setup_function() -> None:
    documents_module._documents.clear()
    documents_module._next_id = 1


def test_create_document_in_project_success() -> None:
    created = _create_document(1, "文档A", "内容A")

    assert created["id"] == 1
    assert created["projectId"] == 1
    assert created["title"] == "文档A"
    assert created["content"] == "内容A"


def test_list_documents_by_project_with_pagination() -> None:
    _create_document(1, "文档1", "内容1")
    _create_document(1, "文档2", "内容2")
    _create_document(1, "文档3", "内容3")
    _create_document(2, "文档4", "内容4")

    resp = client.get("/api/projects/1/documents?page=1&pageSize=2")

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["data"]["total"] == 3
    assert body["data"]["page"] == 1
    assert body["data"]["pageSize"] == 2
    assert len(body["data"]["items"]) == 2
    assert all(item["projectId"] == 1 for item in body["data"]["items"])


def test_list_documents_global_with_filters_and_pagination() -> None:
    _create_document(1, "古文入门", "学习古文词法")
    _create_document(2, "现代汉语", "语法分析")
    _create_document(1, "古文进阶", "文言文断句")

    resp = client.get("/api/documents?projectId=1&keyword=古文&page=1&pageSize=10")

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["data"]["total"] == 2
    assert len(body["data"]["items"]) == 2
    assert all(item["projectId"] == 1 for item in body["data"]["items"])
    assert all("古文" in (item["title"] + item["content"]) for item in body["data"]["items"])


def test_get_put_patch_delete_document_flow() -> None:
    created = _create_document(1, "文档A", "内容A")

    get_resp = client.get(f"/api/documents/{created['id']}")
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["title"] == "文档A"

    put_resp = client.put(
        f"/api/documents/{created['id']}",
        json={"title": "文档B", "content": "内容B"},
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["data"]["title"] == "文档B"
    assert put_resp.json()["data"]["content"] == "内容B"

    patch_resp = client.patch(
        f"/api/documents/{created['id']}",
        json={"content": "内容C"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["content"] == "内容C"

    delete_resp = client.delete(f"/api/documents/{created['id']}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["data"] is None

    get_deleted_resp = client.get(f"/api/documents/{created['id']}")
    assert get_deleted_resp.status_code == 404
    assert get_deleted_resp.json()["detail"] == "文档不存在"


def test_get_document_not_found() -> None:
    resp = client.get("/api/documents/999")

    assert resp.status_code == 404
    assert resp.json()["detail"] == "文档不存在"


def test_patch_without_fields_should_fail() -> None:
    created = _create_document(1, "文档A", "内容A")

    resp = client.patch(f"/api/documents/{created['id']}", json={})

    assert resp.status_code == 400
    assert resp.json()["detail"] == "至少提供一个可更新字段"
