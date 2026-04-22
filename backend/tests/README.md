# 后端测试运行指南

本文档介绍如何运行 `AncientChinese-Tagger` 后端的自动化测试。

## 1. 测试环境说明

为了保证测试的独立性和运行速度，本项目在测试时使用了 **SQLite 内存数据库**。虽然代码在初始化时会检查 MySQL 的环境变量，但测试固件（Fixtures）会自动拦截请求并重定向到内存数据库，因此**测试运行不会影响您的生产数据**。

## 2. 准备工作

确保您已经安装了测试所需的依赖包：

```bash
pip install pytest httpx
```

## 3. 运行测试

由于后端代码在导入时会验证数据库配置，您需要提供基础的环境变量。请根据您的操作系统选择对应的命令。

### 在项目根目录下运行 (推荐)

如果您在 `AncientChinese-Tagger` 目录下，请运行：

**Windows (PowerShell):**

```powershell
# 设置临时环境变量（仅对本次测试有效）
$env:PYTHONPATH="backend"
$env:DB_HOST="121.196.168.115"
$env:DB_PORT="3306"
$env:DB_USER="root"
$env:DB_PASSWORD="Ancient10086."
$env:DB_NAME="ancient"

# 运行所有测试
pytest backend/tests
```

**Linux / macOS:**

```bash
PYTHONPATH=backend \
DB_HOST=121.196.168.115 \
DB_PORT=3306 \
DB_USER=root \
DB_PASSWORD=Ancient10086. \
DB_NAME=ancient \
pytest backend/tests
```

### 在 backend 目录下运行

如果您已经 `cd backend`，请运行：

**Windows (PowerShell):**

```powershell
$env:PYTHONPATH="."
$env:DB_HOST="121.196.168.115"
$env:DB_PORT="3306"
$env:DB_USER="root"
$env:DB_PASSWORD="Ancient10086."
$env:DB_NAME="ancient"

pytest tests/
```

## 4. 测试内容概览

- `test_services.py`: 核心业务逻辑单元测试（用户创建、登录、项目统计、批量标注等）。
- `test_users_api.py`: 用户模块接口测试。
- `test_projects_api.py`: 项目模块接口测试。
- `test_documents_api.py`: 文档模块接口测试。
- `test_annotations_api.py`: 标注模块接口测试。

## 5. 注意事项

- **环境变量**: 即使 `DB_HOST` 指向远程服务器，测试依然会在本地内存中进行，无需担心网络延迟或数据损坏。
- **独立性**: 每个测试函数运行前都会清空内存数据库，确保测试结果互不干扰。

<br />

覆盖率报告生成：

```
$env:PYTHONPATH="backend"
$env:DB_HOST="121.196.168.115"
$env:DB_PORT="3306"
$env:DB_USER="root"
$env:DB_PASSWORD="Ancient10086."
$env:DB_NAME="ancient"

pytest backend/tests --cov=app --cov-report=html --cov-report=term-missing
```

