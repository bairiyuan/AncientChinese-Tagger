# AncientChinese-Tagger Docker 部署指南

本指南详细说明了如何使用 Docker 容器化运行和部署 AncientChinese-Tagger 项目。

## 📋 前置要求

在开始之前，请确保你的机器已安装：
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) 或 Docker Engine (Linux)
- Docker Compose V2 (已包含在 Docker Desktop 中)
- (Windows 用户) 推荐使用 WSL2 后端以获得最佳性能

---

## 🛠️ 第一步：环境准备

### 1. 配置文件
项目根目录下包含 `.env.example`，请将其复制并重命名为 `.env`：
```bash
cp .env.example .env
```
根据你的需求修改其中的 `DEEPSEEK_API_KEY` 等关键配置。

### 2. 配置密钥 (Secrets)
生产环境部署需要配置数据库密码文件。请在 `secrets/` 目录下创建以下文件：
- `secrets/db_password.txt`: 数据库用户密码
- `secrets/db_root_password.txt`: 数据库 Root 密码

---

## 🚀 运行开发环境

开发环境支持 **热重载 (Hot Reload)**，你在本地修改代码，容器内会实时更新。

### 启动服务
```bash
# 启动所有服务（后台运行）
docker compose up -d

# 如果修改了代码、requirements.txt 或 package.json，需要重新构建：
docker compose up -d --build
```

### 访问地址
- **前端界面**: [http://localhost:5173](http://localhost:5173)
- **后端 API**: [http://localhost:8080](http://localhost:8080)
- **后端健康检查**: [http://localhost:8080/health](http://localhost:8080/health)

### 关闭服务
```bash
# 停止容器但保留数据
docker compose stop

# 停止并删除容器（常用）
docker compose down

# 停止并删除容器，同时删除所有挂载的数据卷（慎用，会清空数据库数据）
docker compose down -v
```

---

## 🏗️ 运行生产环境

生产环境使用了多阶段构建，镜像体积更小，且包含资源限制。

### 使用脚本部署 (推荐)
```bash
# Linux/macOS/Git Bash
chmod +x deploy.sh
./deploy.sh
```

### 手动部署步骤
1. 设置镜像仓库变量：
   ```bash
   # PowerShell
   $env:GITHUB_REPOSITORY="your-username/AncientChinese-Tagger"
   # Bash
   export GITHUB_REPOSITORY="your-username/AncientChinese-Tagger"
   ```
2. 启动服务：
   ```bash
   docker compose -f compose.prod.yaml up -d --build
   ```

### 生产环境特性
- **资源限制**: 后端限额 512M 内存，前端限额 128M。
- **端口映射**: 前端映射到标准 **80** 端口，可以直接通过 `http://localhost` 访问。
- **安全性**: 容器以非 root 用户运行，数据库密码通过 Docker Secrets 管理。

---

## 🧹 清理与维护

- **停止并删除所有容器及卷**:
  ```bash
  docker compose down -v
  ```
- **清理未使用的镜像以释放磁盘空间**:
  ```bash
  docker system prune -a
  ```
- **手动重新构建镜像**:
  ```bash
  docker compose build --no-cache
  ```

---

## ❓ 常见问题 (FAQ)

**Q: 为什么 C 盘空间占用很大？**
A: Docker 默认将镜像存储在 C 盘。你可以通过 Docker Desktop 的 `Settings > Resources > WSL Integration` 迁移数据目录，或参考本项目相关文档进行手动迁移。

**Q: 后端无法连接数据库？**
A: 请确保 `db` 服务的状态为 `healthy`。Docker Compose 会根据健康检查自动处理依赖顺序。

**Q: 修改了 requirements.txt 但没生效？**
A: 运行 `docker compose up -d --build` 强制重新构建镜像。
