# AncientChinese 本地开发启动指南

本文档介绍如何在本地环境（Windows/macOS/Linux）启动 AncientChinese 项目的前后端，并实现联调。

## 1. 启动前准备

- **代码根目录**：`D:\桌面\大三下\移动计算\AncientChinese-Tagger`
- **基础环境**：
  - Python 3.9+（建议使用 3.10）
  - Node.js 18+ (建议使用 LTS 版本)
  - MySQL 8.0+ 或使用提供的云数据库

---

## 2. 后端启动 (backend)

### 2.1 环境配置

1. 进入后端目录：
   ```powershell
   cd backend
   ```
2. 创建并激活虚拟环境：
   ```powershell
   python -m venv .venv
   # Windows:
   .\.venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. 安装依赖：
   ```powershell
   pip install -r requirements.txt
   ```

### 2.2 环境变量设置

后端使用 `.env` 文件来管理数据库凭据和安全密钥。这可以确保你的敏感信息（如密码）不会被提交到代码仓库中。

1. **创建配置文件**：
   在 `backend` 目录下创建一个名为 `.env` 的文件。

2. **配置内容**：
   将以下内容复制到 `.env` 文件中。项目已经配置了自动加载此文件。

   ```env
   # 数据库配置（使用云服务器）
   DB_HOST=121.196.168.115
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=Ancient10086.
   DB_NAME=ancient

   # 安全配置
   JWT_SECRET=AncientTaggerSecret2024
   JWT_ALGORITHM=HS256
   JWT_EXPIRE_MINUTES=1440

   # AI 配置 (可选)
   DEEPSEEK_API_KEY=your_key_here
   ```

> **安全提示**：`.env` 文件已被包含在 `.gitignore` 中，因此它不会被提交到 Git。当你分享项目时，其他人需要根据 `backend/.env.example` 模板自行创建自己的 `.env` 文件。

### 2.3 启动服务

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **验证地址**：
  - API 文档：[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
  - 数据库连通测试：[http://127.0.0.1:8000/db-sample](http://127.0.0.1:8000/db-sample)

---

## 3. 前端启动 (frontend)

### 3.1 环境配置

1. 新开一个终端窗口并进入前端目录：
   ```powershell
   cd frontend
   ```
2. 安装依赖：
   ```powershell
   npm install
   ```

### 3.2 环境变量设置

前端需要知道后端的 API 地址。在 `frontend` 目录下创建 `.env.local` 文件：

```env
# 关闭 Mock 模式，连接真实后端
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 3.3 启动服务

```powershell
npm run dev
```

- **访问地址**：通常为 [http://127.0.0.1:5173](http://127.0.0.1:5173)

---

## 4. 核心功能验证清单

启动成功后，请按顺序验证以下功能：

1. **注册/登录**：确保能够连接数据库并正确读写用户数据。
2. **项目管理**：进入主页，能够创建、查看项目列表。
3. **编辑器**：进入项目详情，能够上传文档或创建文档。
4. **AI 标注**：若配置了 `DEEPSEEK_API_KEY`，可测试 AI 自动标注功能。

## 5. 常见问题排查

- **跨域问题 (CORS)**：后端已配置允许 `localhost:5173` 访问，请确保前端端口一致。
- **数据库连接超时**：请检查网络是否能够访问云服务器 IP（121.196.168.115），或联系管理员确认数据库权限。
- **模块缺失**：若启动报错 `No module named 'xxx'`，请再次运行 `pip install -r requirements.txt`。
