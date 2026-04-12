from fastapi.testclient import TestClient

from app.main import app
from app.routes import projects as projects_module


client = TestClient(app)


def _create_project(name: str, description: str, owner_id: int) -> dict:
    resp = client.post(
        "/api/projects",
        json={"name": name, "description": description, "ownerId": owner_id},
    )
    assert resp.status_code == 201
    return resp.json()["data"]


def setup_function() -> None:
    projects_module._projects.clear()
    projects_module._next_id = 1


def test_create_project_success() -> None:
    created = _create_project("项目A", "描述A", 1)

    assert created["id"] == 1
    assert created["name"] == "项目A"
    assert created["description"] == "描述A"
    assert created["ownerId"] == 1


def test_list_projects_with_pagination() -> None:
    _create_project("项目1", "描述1", 1)
    _create_project("项目2", "描述2", 1)
    _create_project("项目3", "描述3", 2)

    resp = client.get("/api/projects?page=1&pageSize=2")

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["data"]["total"] == 3
    assert body["data"]["page"] == 1
    assert body["data"]["pageSize"] == 2
    assert len(body["data"]["items"]) == 2


def test_list_projects_filter_by_owner_id() -> None:
    _create_project("项目1", "描述1", 1)
    _create_project("项目2", "描述2", 2)
    _create_project("项目3", "描述3", 2)

    resp = client.get("/api/projects?ownerId=2&page=1&pageSize=10")

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["data"]["total"] == 2
    assert all(item["ownerId"] == 2 for item in body["data"]["items"])


def test_get_put_patch_delete_project_flow() -> None:
    created = _create_project("项目A", "描述A", 1)

    get_resp = client.get(f"/api/projects/{created['id']}")
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["name"] == "项目A"

    put_resp = client.put(
        f"/api/projects/{created['id']}",
        json={"name": "项目B", "description": "描述B", "ownerId": 2},
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["data"]["name"] == "项目B"
    assert put_resp.json()["data"]["ownerId"] == 2

    patch_resp = client.patch(
        f"/api/projects/{created['id']}",
        json={"description": "描述C"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["description"] == "描述C"

    delete_resp = client.delete(f"/api/projects/{created['id']}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["data"] is None

    get_deleted_resp = client.get(f"/api/projects/{created['id']}")
    assert get_deleted_resp.status_code == 404
    assert get_deleted_resp.json()["detail"] == "项目不存在"


def test_get_project_not_found() -> None:
    resp = client.get("/api/projects/999")

    assert resp.status_code == 404
    assert resp.json()["detail"] == "项目不存在"


def test_patch_without_fields_should_fail() -> None:
    created = _create_project("项目A", "描述A", 1)

    resp = client.patch(f"/api/projects/{created['id']}", json={})

    assert resp.status_code == 400
    assert resp.json()["detail"] == "至少提供一个可更新字段"
