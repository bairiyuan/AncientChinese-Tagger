# 软件测试贡献说明

姓名：张贤文  学号：2312190210 角色：后端 / CI  日期：2026-04-26

## 完成的测试工作

### 测试文件

- 后端（pytest）
  - `backend/tests/test_users_api.py`
  - `backend/tests/test_projects_api.py`
  - `backend/tests/test_documents_api.py`
  - `backend/tests/test_annotations_api.py`
  - `backend/tests/test_services.py`
  - `backend/tests/conftest.py`

### 测试清单

- [ ] 正常情况测试（后端约 33 个用例）
- [ ] 边界 / 异常情况测试（登录失败、重复用户名、缺少必填字段、无鉴权访问等）
- [ ] Mock 使用（数据库 / API / 组件外部依赖）
  - 后端：使用 SQLite 内存库替代真实数据库依赖（测试隔离），避免 CI 连接外部 MySQL

### 覆盖率

- 核心模块覆盖率：以 CI 生成的覆盖率报告 / Codecov 页面为准
  - 后端：`pytest backend/tests --cov=app --cov-report=xml:backend/coverage.xml --cov-report=term-missing`

### CI / Codecov 集成

- GitHub Actions：`.github/workflows/test.yml`
  - push 到 `main` / `develop` 或 PR 时执行 pytest，并上传 `backend/coverage.xml` 到 Codecov（flag：`backend`）

## 遇到的问题和解决

1. 问题：SQLite 内存库在多连接/多会话下出现“表丢失/数据不一致” → 解决：在测试引擎中使用 `StaticPool` 复用连接，并在 session 结束时 `engine.dispose()` 释放资源，确保用例稳定执行。
2. 问题：Codecov 徽章在目标分支（如 develop）无数据时无法显示 → 解决：确保目标分支存在一次 “push 触发” 的 CI 上传记录；同时工作流触发分支与 README 徽章分支保持一致。

## 心得体会

通过将测试与 CI、覆盖率上传联动（pytest-cov + Codecov），可以让团队在 PR 阶段就获得质量反馈；同时在 CI 环境尽量移除外部依赖（如真实数据库）能显著提升测试稳定性与可复现性。
