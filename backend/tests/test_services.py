from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.models.document import Document
from app.models.user import User
from app.services import annotations_service, llm_service, projects_service, users_service


def _make_query(first_value=None, all_value=None):
    query = MagicMock()
    query.filter.return_value = query
    query.order_by.return_value = query
    query.first.return_value = first_value
    query.all.return_value = all_value if all_value is not None else []
    return query


@patch("app.services.users_service._hash_password")
def test_create_user_success_mock_db(mock_hash_password):
    mock_hash_password.return_value = "hashed-password"

    db = MagicMock()
    db.query.side_effect = lambda model: _make_query(first_value=None)

    def refresh_side_effect(user):
        user.id = 1

    db.refresh.side_effect = refresh_side_effect

    result = users_service.create_user(db, "newuser", "password123")
    assert result["code"] == 0
    assert result["data"]["id"] == 1
    assert result["data"]["username"] == "newuser"
    # 安全修复：响应中不再包含密码字段
    assert "password" not in result["data"]
    db.add.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once()


def test_create_user_duplicate_username_mock_db():
    db = MagicMock()
    existing_user = SimpleNamespace(id=1, username="newuser", password="hashed", created_at=None, updated_at=None)
    db.query.side_effect = lambda model: _make_query(first_value=existing_user)

    with pytest.raises(HTTPException) as exc:
        users_service.create_user(db, "newuser", "password456")
    assert exc.value.status_code == 400
    assert "用户名已存在" in exc.value.detail


@patch("app.services.users_service.bcrypt.checkpw")
@patch("app.services.users_service._create_token")
def test_login_user_success_mock_db(mock_create_token, mock_checkpw):
    mock_create_token.return_value = "fake-token"
    mock_checkpw.return_value = True

    now = datetime.now(timezone.utc)
    user = SimpleNamespace(id=1, username="loginuser", password="hashed", created_at=now, updated_at=now)

    db = MagicMock()
    db.query.side_effect = lambda model: _make_query(first_value=user)

    result = users_service.login_user(db, "loginuser", "secret")
    assert result["code"] == 0
    assert result["data"]["token"] == "fake-token"
    assert result["data"]["user"]["id"] == 1
    assert result["data"]["user"]["username"] == "loginuser"


@patch("app.services.users_service.bcrypt.checkpw")
def test_login_user_wrong_password_mock_db(mock_checkpw):
    mock_checkpw.return_value = False

    now = datetime.now(timezone.utc)
    user = SimpleNamespace(id=1, username="loginuser", password="hashed", created_at=now, updated_at=now)

    db = MagicMock()
    db.query.side_effect = lambda model: _make_query(first_value=user)

    with pytest.raises(HTTPException) as exc:
        users_service.login_user(db, "loginuser", "wrong")
    assert exc.value.status_code == 401


def test_create_annotation_document_not_found_mock_db():
    db = MagicMock()

    def query_side_effect(model):
        if model is Document:
            return _make_query(first_value=None)
        return _make_query(first_value=None)

    db.query.side_effect = query_side_effect

    with pytest.raises(HTTPException) as exc:
        annotations_service.create_annotation(db, 999, "测试", "other", 0, 1, current_user_id=1)
    assert exc.value.status_code == 404
    assert "文档不存在" in exc.value.detail


def test_project_to_dict_with_stats_pure_unit():
    ann1 = SimpleNamespace(entity_type="person")
    ann2 = SimpleNamespace(entity_type="location")
    doc = SimpleNamespace(annotations=[ann1, ann2])
    project = SimpleNamespace(
        id=1,
        name="Stats Project",
        description="desc",
        owner_id=1,
        created_at=None,
        updated_at=None,
        documents=[doc],
    )

    result = projects_service._project_to_dict(project)
    assert result["documents_count"] == 1
    assert result["annotations_count"] == 2
    assert result["entity_distribution"]["person"] == 1
    assert result["entity_distribution"]["location"] == 1


@patch("app.services.llm_service.requests.post")
def test_call_deepseek_success_mock_http(mock_post):
    response = MagicMock()
    response.raise_for_status.return_value = None
    response.json.return_value = {"choices": [{"message": {"content": "ok"}}]}
    mock_post.return_value = response

    result = llm_service.call_deepseek([{"role": "user", "content": "hi"}], timeout=1)
    assert result == "ok"
    mock_post.assert_called_once()
