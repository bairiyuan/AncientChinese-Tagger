import pytest

def _create_project(client, name: str, owner_id: int, headers: dict) -> int:
    resp = client.post(
        "/api/projects",
        json={"name": name, "description": "desc", "ownerId": owner_id},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()["data"]["id"]

def _create_document(client, project_id: int, title: str, content: str, headers: dict) -> int:
    resp = client.post(
        f"/api/projects/{project_id}/documents",
        json={"title": title, "content": content},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()["data"]["id"]

def _create_annotation(client, document_id: int, entity: str, entity_type: str, start: int, end: int, headers: dict) -> dict:
    resp = client.post(
        f"/api/documents/{document_id}/annotations",
        json={"entity": entity, "entity_type": entity_type, "start_pos": start, "end_pos": end},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()["data"]

def test_create_annotation_in_document_success(client, test_user, auth_headers) -> None:
    project_id = _create_project(client, "项目A", test_user["id"], auth_headers)
    doc_id = _create_document(client, project_id, "文档A", "项羽名籍", auth_headers)
    
    created = _create_annotation(client, doc_id, "项羽", "person", 0, 2, auth_headers)

    assert created["entity"] == "项羽"
    assert created["entity_type"] == "person"
    assert created["document_id"] == doc_id

def test_list_annotations_by_document(client, test_user, auth_headers) -> None:
    project_id = _create_project(client, "项目A", test_user["id"], auth_headers)
    doc_id = _create_document(client, project_id, "文档A", "项羽名籍", auth_headers)
    
    _create_annotation(client, doc_id, "项羽", "person", 0, 2, auth_headers)
    _create_annotation(client, doc_id, "名籍", "other", 2, 4, auth_headers)

    resp = client.get(f"/api/documents/{doc_id}/annotations", headers=auth_headers)

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert len(body["data"]) == 2

def test_get_put_patch_delete_annotation_flow(client, test_user, auth_headers) -> None:
    project_id = _create_project(client, "项目A", test_user["id"], auth_headers)
    doc_id = _create_document(client, project_id, "文档A", "项羽名籍", auth_headers)
    
    created = _create_annotation(client, doc_id, "项羽", "person", 0, 2, auth_headers)
    ann_id = created["id"]

    get_resp = client.get(f"/api/annotations/{ann_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["entity"] == "项羽"

    put_resp = client.put(
        f"/api/annotations/{ann_id}",
        json={"entity": "霸王", "entity_type": "person", "start_pos": 0, "end_pos": 2},
        headers=auth_headers,
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["data"]["entity"] == "霸王"

    patch_resp = client.patch(
        f"/api/annotations/{ann_id}",
        json={"entity_type": "other"},
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["entity_type"] == "other"

    del_resp = client.delete(f"/api/annotations/{ann_id}", headers=auth_headers)
    assert del_resp.status_code == 200  # API 返回 200 success

    get_deleted_resp = client.get(f"/api/annotations/{ann_id}", headers=auth_headers)
    assert get_deleted_resp.status_code == 404

def test_create_annotation_document_not_found(client, auth_headers) -> None:
    resp = client.post(
        "/api/documents/999/annotations",
        json={"entity": "X", "entity_type": "other", "start_pos": 0, "end_pos": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 404

def test_patch_without_fields_should_fail(client, test_user, auth_headers) -> None:
    project_id = _create_project(client, "项目A", test_user["id"], auth_headers)
    doc_id = _create_document(client, project_id, "文档A", "内容", auth_headers)
    created = _create_annotation(client, doc_id, "内", "other", 0, 1, auth_headers)

    resp = client.patch(f"/api/annotations/{created['id']}", json={}, headers=auth_headers)
    assert resp.status_code == 400
    assert "至少提供一个" in resp.json()["detail"]

def test_patch_with_invalid_span_should_fail(client, test_user, auth_headers) -> None:
    project_id = _create_project(client, "项目A", test_user["id"], auth_headers)
    doc_id = _create_document(client, project_id, "文档A", "内容", auth_headers)
    created = _create_annotation(client, doc_id, "内", "other", 0, 1, auth_headers)

    resp = client.patch(f"/api/annotations/{created['id']}", json={"start_pos": 5, "end_pos": 2}, headers=auth_headers)
    assert resp.status_code == 400
    assert "参数错误" in resp.json()["detail"]


def test_jieba_segment_text(client) -> None:
    resp = client.post(
        "/api/annotations/jieba-segment",
        json={"text": "项羽名籍"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert isinstance(body["data"], list)
    assert len(body["data"]) > 0


def test_create_annotations_bulk_success(client, test_user, auth_headers) -> None:
    project_id = _create_project(client, "项目A", test_user["id"], auth_headers)
    doc_id = _create_document(client, project_id, "文档A", "项羽名籍", auth_headers)

    resp = client.post(
        f"/api/documents/{doc_id}/annotations/bulk",
        json=[
            {"entity": "项羽", "entity_type": "person", "start_pos": 0, "end_pos": 2},
            {"entity": "名籍", "entity_type": "other", "start_pos": 2, "end_pos": 4},
        ],
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["code"] == 0
    assert len(body["data"]) == 2


def test_search_annotations_by_project(client, test_user, auth_headers) -> None:
    project_id = _create_project(client, "项目A", test_user["id"], auth_headers)
    doc_id = _create_document(client, project_id, "文档A", "项羽名籍", auth_headers)
    
    _create_annotation(client, doc_id, "项羽", "person", 0, 2, auth_headers)
    _create_annotation(client, doc_id, "名籍", "other", 2, 4, auth_headers)

    resp = client.get(f"/api/annotations?project_id={project_id}", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert len(body["data"]) == 2


def test_search_annotations_by_entity_type(client, test_user, auth_headers) -> None:
    project_id = _create_project(client, "项目A", test_user["id"], auth_headers)
    doc_id = _create_document(client, project_id, "文档A", "项羽名籍", auth_headers)
    
    _create_annotation(client, doc_id, "项羽", "person", 0, 2, auth_headers)
    _create_annotation(client, doc_id, "名籍", "other", 2, 4, auth_headers)

    resp = client.get("/api/annotations?entity_type=person", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert len(body["data"]) == 1
    assert body["data"][0]["entity_type"] == "person"
