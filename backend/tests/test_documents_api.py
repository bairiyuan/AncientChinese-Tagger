import pytest

def _create_project(client, name: str, owner_id: int, headers: dict) -> int:
    resp = client.post(
        "/api/projects",
        json={"name": name, "description": "desc", "ownerId": owner_id},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()["data"]["id"]

def _create_document(client, project_id: int, title: str, content: str, headers: dict) -> dict:
    resp = client.post(
        f"/api/projects/{project_id}/documents",
        json={"title": title, "content": content},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()["data"]

def test_create_document_in_project_success(client, test_user, auth_headers) -> None:
    project_id = _create_project(client, "项目A", test_user["id"], auth_headers)
    created = _create_document(client, project_id, "文档A", "内容A", auth_headers)

    assert created["title"] == "文档A"
    assert created["content"] == "内容A"
    assert created["project_id"] == project_id

def test_list_documents_by_project_with_pagination(client, test_user, auth_headers) -> None:
    project_id = _create_project(client, "项目A", test_user["id"], auth_headers)
    for i in range(5):
        _create_document(client, project_id, f"文档{i}", f"内容{i}", auth_headers)

    # 注意：这里参数名是 page_size 而不是 pageSize
    resp = client.get(f"/api/projects/{project_id}/documents?page=1&page_size=3", headers=auth_headers)

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["data"]["total"] == 5
    assert len(body["data"]["items"]) == 3

def test_list_documents_global_with_filters_and_pagination(client, test_user, auth_headers) -> None:
    project_id = _create_project(client, "项目A", test_user["id"], auth_headers)
    _create_document(client, project_id, "特定标题", "内容", auth_headers)
    _create_document(client, project_id, "其他文档", "内容", auth_headers)

    # 全局搜索接口
    resp = client.get(f"/api/documents?keyword=特定标题", headers=auth_headers)

    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["total"] == 1
    assert body["data"]["items"][0]["title"] == "特定标题"

def test_get_put_patch_delete_document_flow(client, test_user, auth_headers) -> None:
    project_id = _create_project(client, "项目A", test_user["id"], auth_headers)
    created = _create_document(client, project_id, "原始文档", "原始内容", auth_headers)
    doc_id = created["id"]

    get_resp = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["title"] == "原始文档"

    put_resp = client.put(
        f"/api/documents/{doc_id}",
        json={"title": "修改后文档", "content": "修改后内容"},
        headers=auth_headers,
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["data"]["title"] == "修改后文档"

    patch_resp = client.patch(
        f"/api/documents/{doc_id}",
        json={"title": "补丁后文档"},
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["title"] == "补丁后文档"

    del_resp = client.delete(f"/api/documents/{doc_id}", headers=auth_headers)
    assert del_resp.status_code == 200  # API 返回 200 success

    get_deleted_resp = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
    assert get_deleted_resp.status_code == 404

def test_get_document_not_found(client, auth_headers) -> None:
    resp = client.get("/api/documents/999", headers=auth_headers)
    assert resp.status_code == 404

def test_patch_without_fields_should_fail(client, test_user, auth_headers) -> None:
    project_id = _create_project(client, "项目A", test_user["id"], auth_headers)
    created = _create_document(client, project_id, "文档A", "内容A", auth_headers)

    resp = client.patch(f"/api/documents/{created['id']}", json={}, headers=auth_headers)
    assert resp.status_code == 400
    assert "至少提供一个" in resp.json()["detail"]
