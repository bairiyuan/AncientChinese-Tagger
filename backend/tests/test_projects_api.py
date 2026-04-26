import pytest

def _create_project(client, name: str, description: str, owner_id: int, headers: dict) -> dict:
    resp = client.post(
        "/api/projects",
        json={"name": name, "description": description, "ownerId": owner_id},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()["data"]

def test_create_project_success(client, test_user, auth_headers) -> None:
    created = _create_project(client, "项目A", "描述A", test_user["id"], auth_headers)

    assert created["name"] == "项目A"
    assert created["description"] == "描述A"
    assert created["ownerId"] == test_user["id"]

def test_list_projects_with_pagination(client, test_user, auth_headers) -> None:
    for i in range(5):
        _create_project(client, f"项目{i}", f"描述{i}", test_user["id"], auth_headers)

    # 这里参数名是 pageSize
    resp = client.get("/api/projects?page=1&pageSize=3", headers=auth_headers)

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["data"]["total"] == 5
    assert len(body["data"]["items"]) == 3

def test_list_projects_filter_by_owner_id(client, test_user, auth_headers) -> None:
    _create_project(client, "我的项目", "描述", test_user["id"], auth_headers)
    
    resp = client.get(f"/api/projects?ownerId={test_user['id']}", headers=auth_headers)

    assert resp.status_code == 200
    body = resp.json()
    assert any(p["ownerId"] == test_user["id"] for p in body["data"]["items"])

def test_get_put_patch_delete_project_flow(client, test_user, auth_headers) -> None:
    created = _create_project(client, "原始项目", "原始描述", test_user["id"], auth_headers)
    project_id = created["id"]

    get_resp = client.get(f"/api/projects/{project_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["name"] == "原始项目"

    put_resp = client.put(
        f"/api/projects/{project_id}",
        json={"name": "修改后项目", "description": "修改后描述", "ownerId": test_user["id"]},
        headers=auth_headers,
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["data"]["name"] == "修改后项目"

    patch_resp = client.patch(
        f"/api/projects/{project_id}",
        json={"name": "补丁后项目"},
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["name"] == "补丁后项目"

    del_resp = client.delete(f"/api/projects/{project_id}", headers=auth_headers)
    assert del_resp.status_code == 200  # API 返回 200 success

    get_deleted_resp = client.get(f"/api/projects/{project_id}", headers=auth_headers)
    assert get_deleted_resp.status_code == 404

def test_get_project_not_found(client, auth_headers) -> None:
    resp = client.get("/api/projects/999", headers=auth_headers)
    assert resp.status_code == 404

def test_patch_without_fields_should_fail(client, test_user, auth_headers) -> None:
    created = _create_project(client, "项目A", "描述A", test_user["id"], auth_headers)

    resp = client.patch(f"/api/projects/{created['id']}", json={}, headers=auth_headers)
    assert resp.status_code == 400
    assert "至少提供一个" in resp.json()["detail"]
