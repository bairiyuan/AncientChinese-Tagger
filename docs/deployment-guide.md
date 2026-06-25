# AncientChinese-Tagger 系统部署与运行指南

本指南详细说明了如何在不同环境下运行 AncientChinese-Tagger 项目，包括 **Docker 容器化部署** 和 **Windows 本地开发环境部署**。

---

## 📋 前置要求

### 通用要求
- 已获取 `DEEPSEEK_API_KEY`（用于 AI 解析功能）。
- 网络环境能够访问远程数据库（默认配置）或已准备好本地数据库。

### Docker 部署要求
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) 或 Docker Engine (Linux)。
- (Windows 用户) 推荐使用 WSL2 后端。

### Windows 本地部署要求
- [Python 3.12+](https://www.python.org/)。
- [Node.js 20+](https://nodejs.org/)。
- Git Bash 或 PowerShell。

---

## 🛠️ 环境准备 (所有部署方式通用)

### 1. 配置文件
项目根目录下包含 `.env.example`，请将其复制并重命名为 `.env`：
```powershell
cp .env.example .env
```
修改其中的 `DEEPSEEK_API_KEY`。

### 2. 数据库选择
修改根目录 `.env` 文件中的数据库配置：

- **场景 A：使用远程云数据库 (默认)**
  ```env
  DB_HOST=121.196.168.115
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=...
  DB_NAME=ancient
  ```
- **场景 B：使用 Docker 内部数据库 (仅限 Docker 部署)**
  ```env
  DB_HOST=db
  DB_PORT=3306
  DB_USER=admin
  DB_PASSWORD=dev123
  DB_NAME=ancientchinese
  ```

---

## 🚀 方式一：Docker 快速部署 (推荐)

Docker 部署支持代码热重载，你在本地修改代码后容器会自动同步，无需重新构建。

### 启动服务
```bash
# 启动所有服务（后台运行）
docker compose up -d

# 如果修改了依赖（如 requirements.txt），请强制重新构建：
docker compose up -d --build
```

### 访问地址
- **前端界面**: [http://localhost:5173](http://localhost:5173)
- **后端 API**: [http://localhost:8080](http://localhost:8080)
- **健康检查**: [http://localhost:8080/health](http://localhost:8080/health)

### 状态查看与调试
```bash
# 查看所有服务的运行状态（检查是否为 Up 或 healthy）
docker compose ps

# 查看后端实时日志（排查启动错误、数据库连接等）
docker compose logs -f backend

# 查看前端实时日志
docker compose logs -f frontend

# 停止并删除所有容器（清理环境）
docker compose down

# 仅停止容器（保留容器，可快速恢复）
docker compose stop

# 重新启动已停止的容器
docker compose start
```

---

## 💻 方式二：Windows 本地部署 (开发调试首选)

本地部署无需启动 Docker 引擎，响应速度最快，适合频繁的代码调试。

### 1. 启动后端 (FastAPI)
1. 进入 `backend` 目录并创建虚拟环境：
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   ```
2. 安装依赖：
   ```powershell
   pip install -r requirements.txt
   ```
3. 运行服务：
   ```powershell
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### 2. 启动前端 (Vite)
1. 进入 `frontend` 目录：
   ```powershell
   cd frontend
   ```
2. 安装依赖并启动：
   ```powershell
   npm install
   npm run dev
   ```

### 访问地址
- **前端界面**: [http://localhost:5173](http://localhost:5173)
- **后端 API**: [http://localhost:8000](http://localhost:8000) (本地默认端口)

---

## 🏗️ 生产环境部署

如果你需要模拟生产环境（带资源限制和端口优化）：

```bash
# 设置镜像变量 (PowerShell)
$env:GITHUB_REPOSITORY="your-username/AncientChinese-Tagger"

# 启动生产配置
docker compose -f compose.prod.yaml up -d --build
```
生产环境下前端将映射到 **80** 端口。

---

## ❓ 常见问题 (FAQ)

**Q: 修改了代码 Docker 没反应？**
A: 检查 `compose.yaml` 中的 `volumes` 挂载是否正确。通常保存文件后后端会自动 reload。

**Q: 本地运行提示找不到环境变量？**
A: 确保你在项目根目录下有 `.env` 文件，或者在启动后端前已手动设置了相关变量。

**Q: 数据库连接超时？**
A: 请检查网络是否可以 ping 通云服务器 `121.196.168.115`，或尝试切换到场景 B 使用本地容器数据库。
