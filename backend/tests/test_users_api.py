from fastapi.testclient import TestClient

from app.main import app
from app.routes import users as users_module


client = TestClient(app)


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _create_user(username: str, password: str) -> dict:
    resp = client.post(
        "/api/users",
        json={"username": username, "password": password},
    )
    assert resp.status_code == 201
    return resp.json()["data"]


def _login(username: str, password: str) -> str:
    resp = client.post(
        "/api/users/login",
        json={"username": username, "password": password},
    )
    assert resp.status_code == 200
    return resp.json()["data"]["token"]


def setup_function() -> None:
    users_module._users.clear()
    users_module._next_id = 1


def test_create_user_and_login_success() -> None:
    created = _create_user("alice", "password123")

    assert created["id"] == 1
    assert created["username"] == "alice"
    assert created["password"] != "password123"

    token = _login("alice", "password123")
    assert token


def test_login_fail_with_wrong_password() -> None:
    _create_user("alice", "password123")

    resp = client.post(
        "/api/users/login",
        json={"username": "alice", "password": "wrong"},
    )

    assert resp.status_code == 401
    assert resp.json()["detail"] == "用户名或密码错误"


def test_protected_endpoints_require_authorization() -> None:
    _create_user("alice", "password123")

    resp = client.get("/api/users")

    assert resp.status_code == 401
    assert "Authorization" in resp.json()["detail"]


def test_list_users_with_token() -> None:
    _create_user("alice", "password123")
    _create_user("bob", "password456")
    token = _login("alice", "password123")

    resp = client.get("/api/users?page=1&pageSize=10", headers=_auth_headers(token))

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["data"]["total"] == 2
    assert len(body["data"]["items"]) == 2


def test_get_put_patch_delete_user_flow() -> None:
    alice = _create_user("alice", "password123")
    token = _login("alice", "password123")

    get_resp = client.get(f"/api/users/{alice['id']}", headers=_auth_headers(token))
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["username"] == "alice"

    put_resp = client.put(
        f"/api/users/{alice['id']}",
        json={"username": "alice_new", "password": "new_password"},
        headers=_auth_headers(token),
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["data"]["username"] == "alice_new"

    patch_resp = client.patch(
        f"/api/users/{alice['id']}",
        json={"username": "alice_patch"},
        headers=_auth_headers(token),
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["username"] == "alice_patch"

    delete_resp = client.delete(f"/api/users/{alice['id']}", headers=_auth_headers(token))
    assert delete_resp.status_code == 200
    assert delete_resp.json()["data"] is None

    get_deleted_resp = client.get(f"/api/users/{alice['id']}", headers=_auth_headers(token))
    assert get_deleted_resp.status_code == 404


def test_duplicate_username_should_fail() -> None:
    _create_user("alice", "password123")

    resp = client.post(
        "/api/users",
        json={"username": "alice", "password": "password456"},
    )

    assert resp.status_code == 400
    assert resp.json()["detail"] == "用户名已存在"


def test_patch_without_fields_should_fail() -> None:
    alice = _create_user("alice", "password123")
    token = _login("alice", "password123")

    resp = client.patch(
        f"/api/users/{alice['id']}",
        json={},
        headers=_auth_headers(token),
    )

    assert resp.status_code == 400
    assert resp.json()["detail"] == "至少提供一个可更新字段"
