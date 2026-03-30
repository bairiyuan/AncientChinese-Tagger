## AncientChinese 后端使用指南（FastAPI + MySQL）

本指南说明如何在本地启动 AncientChinese 项目的后端服务，并连接到远程 MySQL 数据库进行初始化数据展示。

后端技术栈：
- 框架：FastAPI
- 运行服务：Uvicorn
- 语言：Python 3
- 数据库：MySQL（云服务器）

目录结构（后端相关）：

```bash
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI 入口
│   └── database.py      # 数据库连接与示例查询
└── BACKEND_GUIDE.md     # 本指南
```

---

## 1. 环境准备

### 1.1 进入后端目录

在 PowerShell 中执行：

```powershell
cd "D:\桌面\大三下\移动计算\AncientChinese-Tagger\backend"
```

### 1.2 创建并激活虚拟环境（推荐）

```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

如果 `python` 命令不可用，也可以尝试：

```powershell
py -m venv .venv
.\.venv\Scripts\activate
```

激活成功后，命令行前面通常会出现类似 `(.venv)` 的提示。

### 1.3 安装依赖

在虚拟环境激活的情况下执行：

```powershell
pip install fastapi "uvicorn[standard]" pymysql
```

---

## 2. 数据库配置

后端通过环境变量读取数据库配置信息，避免在代码中硬编码密码。

当前数据库信息（示例）：
- 数据库类型：MySQL
- 云服务器 IP：`121.196.168.115`
- 端口：`3306`
- 数据库名：`ancient`
- 用户名：`root`
- 密码：请按实际配置填写

### 2.1 在 PowerShell 中设置环境变量（当前终端有效）

在启动 Uvicorn 的同一个 PowerShell 终端中执行：

```powershell
$env:DB_HOST = "121.196.168.115"
$env:DB_PORT = "3306"
$env:DB_USER = "root"
$env:DB_PASSWORD = "<你的数据库密码>"
$env:DB_NAME = "ancient"
```

> 注意：  
> - 请将 `<你的数据库密码>` 替换为真实密码。  
> - 上述命令只在当前终端会话内有效，关闭窗口后需要重新设置。  
> - 密码不应写入仓库中的代码文件或提交到 Git。

### 2.2 数据库初始化数据

项目提供了数据库初始化 SQL 文件：

- 路径：`docs/ancient.sql`

该文件包含以下表及示例数据：
- `users`：用户信息
- `projects`：项目
- `documents`：文档
- `annotations`：标注

可以在云服务器或本地 MySQL 中执行此 SQL，完成数据库初始化。

---

## 3. 启动后端服务

确保已完成以下准备：
- 虚拟环境已激活
- 已安装必要依赖
- 已在当前终端设置数据库相关环境变量

然后在 `backend` 目录下执行：

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

参数说明：
- `app.main:app`：表示从 `backend/app/main.py` 中的 `app = FastAPI(...)` 作为入口。
- `--reload`：代码变更时自动重载（开发环境使用）。
- `--host 0.0.0.0`：对所有网络接口开放（在本机开发时可保留）。
- `--port 8000`：服务监听的端口号。

启动成功后终端会显示类似：

```text
Uvicorn running on http://0.0.0.0:8000
Application startup complete.
```

---

## 4. 已提供的接口说明

后端入口文件：[app/main.py](./app/main.py)

### 4.1 健康检查接口

- 路径：`GET /`
- 作用：确认后端服务是否正常启动。

示例响应：

```json
{
  "message": "AncientChinese backend is running"
}
```

### 4.2 数据库示例数据接口

- 路径：`GET /db-sample`
- 作用：连接远程 MySQL 数据库，查询部分示例数据用于初始化验证。
- 数据来源：
  - `projects` 表：返回项目信息前若干条
  - `documents` 表：返回文档信息前若干条

接口逻辑位于：
- 查询函数：[app/database.py](./app/database.py) 中的 `fetch_sample_data`
- 路由定义：[app/main.py](./app/main.py) 中的 `db_sample` 视图函数

示例响应结构：

```json
{
  "message": "Database sample data",
  "data": {
    "projects": [
      {
        "id": 1,
        "name": "古文标注项目A",
        "description": "用于标注史记文本",
        "owner_id": 1,
        "created_at": "2026-03-22T15:27:25"
      }
    ],
    "documents": [
      {
        "id": 1,
        "project_id": 1,
        "title": "史记·项羽本纪",
        "created_at": "2026-03-22T15:27:31"
      }
    ]
  }
}
```

如果访问该接口时返回 `Internal Server Error`，请首先检查：
1. 是否在当前终端设置了所有数据库环境变量。
2. 是否可以从本机访问云服务器的 MySQL（网络、防火墙、权限）。
3. 数据库中是否存在 `ancient` 库以及上述数据表。

---

## 5. 常见问题排查

### 5.1 访问接口时出现 `Internal Server Error`

请查看运行 Uvicorn 的终端窗口中的错误堆栈。常见原因包括：
- 环境变量未设置或拼写错误；
- 无法连接到 MySQL（端口未开放、防火墙限制、服务未启动）；
- 数据库中缺少需要访问的表；
- 依赖库未安装（如 `pymysql`）。

### 5.2 修改代码后接口没有更新

确保启动命令中带有 `--reload` 参数，例如：

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

如仍未更新，可以尝试停止服务（Ctrl + C）后重新启动。

### 5.3 端口被占用

如果 8000 端口已被占用，可以更换端口号：

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

然后在浏览器中访问 http://127.0.0.1:8001/。

---

## 6. 后续扩展建议

在当前简单版本基础上，可逐步扩展：
- 使用 Pydantic 定义请求与响应模型（schemas）；
- 按模块拆分路由，例如 `projects`、`documents`、`annotations` 等；
- 引入配置文件或 `.env` 管理环境变量；
- 增加日志记录、中间件、异常处理等。

在扩展过程中，建议保持与现有数据库设计文档（如 `docs/database.md`、`docs/api.md`）的一致性，并结合项目的 AI 使用规范（`CLAUDE.md`）进行协作开发。

