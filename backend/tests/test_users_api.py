import pytest

def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}

def _create_user(client, username: str, password: str) -> dict:
    resp = client.post(
        "/api/users",
        json={"username": username, "password": password},
    )
    assert resp.status_code == 201
    return resp.json()["data"]

def _login(client, username: str, password: str) -> str:
    resp = client.post(
        "/api/users/login",
        json={"username": username, "password": password},
    )
    assert resp.status_code == 200
    return resp.json()["data"]["token"]

def test_create_user_and_login_success(client) -> None:
    created = _create_user(client, "alice", "password123")

    assert created["username"] == "alice"
    # 后端返回的数据中不应包含明文密码
    assert "password" not in created or created["password"] != "password123"

    token = _login(client, "alice", "password123")
    assert token

def test_login_fail_with_wrong_password(client) -> None:
    _create_user(client, "alice", "password123")

    resp = client.post(
        "/api/users/login",
        json={"username": "alice", "password": "wrong"},
    )

    assert resp.status_code == 401
    assert resp.json()["detail"] == "用户名或密码错误"

def test_protected_endpoints_require_authorization(client) -> None:
    _create_user(client, "alice", "password123")

    # 尝试无 token 访问用户列表
    resp = client.get("/api/users")

    assert resp.status_code == 401
    assert "认证令牌" in resp.json()["detail"]

def test_list_users_with_token(client) -> None:
    _create_user(client, "alice", "password123")
    token = _login(client, "alice", "password123")

    resp = client.get("/api/users", headers=_auth_headers(token))

    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert any(u["username"] == "alice" for u in body["data"]["items"])

def test_get_put_patch_delete_user_flow(client) -> None:
    created = _create_user(client, "bob", "password123")
    user_id = created["id"]
    token = _login(client, "bob", "password123")
    headers = _auth_headers(token)

    get_resp = client.get(f"/api/users/{user_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["username"] == "bob"

    put_resp = client.put(
        f"/api/users/{user_id}",
        json={"username": "bob_new", "password": "new_password"},
        headers=headers,
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["data"]["username"] == "bob_new"

    # 用新密码重新登录
    new_token = _login(client, "bob_new", "new_password")
    assert new_token

    patch_resp = client.patch(
        f"/api/users/{user_id}",
        json={"username": "bob_final"},
        headers=_auth_headers(new_token),
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["username"] == "bob_final"

    del_resp = client.delete(f"/api/users/{user_id}", headers=_auth_headers(new_token))
    assert del_resp.status_code == 200  # API 返回 200 success

    get_deleted_resp = client.get(f"/api/users/{user_id}", headers=_auth_headers(new_token))
    # 用户被删除后，当前的 token 对应的用户已不存在，get_current_user 会返回 401
    assert get_deleted_resp.status_code in [401, 404]

def test_duplicate_username_should_fail(client) -> None:
    _create_user(client, "alice", "password123")
    
    resp = client.post(
        "/api/users",
        json={"username": "alice", "password": "password456"},
    )
    assert resp.status_code == 400
    assert "已存在" in resp.json()["detail"]

def test_patch_without_fields_should_fail(client) -> None:
    alice = _create_user(client, "alice", "password123")
    token = _login(client, "alice", "password123")

    resp = client.patch(f"/api/users/{alice['id']}", json={}, headers=_auth_headers(token))
    assert resp.status_code == 400
    assert "至少提供一个" in resp.json()["detail"]
