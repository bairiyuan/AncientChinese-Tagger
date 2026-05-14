# Docker 部署贡献说明

姓名：张贤文
学号：2312190210
日期：2026-05-14

## 我完成的工作

### 1. Dockerfile 编写
- [x] 前端 Dockerfile（多阶段构建）
  - 使用 `node:22-alpine` 构建，`nginxinc/nginx-unprivileged:1.29-alpine` 运行。
  - 镜像体积优化，非 root 用户运行，包含健康检查。
- [x] 后端 Dockerfile（多阶段构建）
  - 使用 `python:3.12-slim` 作为基础镜像，多阶段构建减少体积。
  - 非 root 用户 (`appuser`) 运行，暴露端口 8000，包含 `/health` 健康检查。
- [x] .dockerignore 文件
  - 排除 `node_modules`、`.git`、`.env` 等无关文件，提高构建效率。

### 2. Compose 配置
- [x] 开发环境 compose.yaml
  - 支持前端代码热重载，集成 MySQL 数据库，配置依赖管理和健康检查。
- [x] 生产环境 compose.prod.yaml
  - 设置资源限制（内存/CPU），使用 Docker Secrets 管理数据库密钥，配置 GHCR 镜像路径。
- [x] 健康检查配置
  - 前后端及数据库均配置了完善的 `healthcheck`。

### 3. 自动化部署
- 选择了选项 A：GitHub Actions 自动化构建与推送
- 具体内容：
  - 创建了 `.github/workflows/docker.yml`，在推送到 `main` 分支时自动构建前后端镜像并推送到 GHCR。
  - 集成了 `aquasecurity/trivy-action` 进行镜像安全漏洞扫描。
- 同时也编写了 `deploy.sh` 本地一键部署脚本作为备选方案。

## PR 链接
- PR #11: `https://github.com/AncientChinese-Tagger/AncientChinese-Tagger/pull/11` (示例)

## 遇到的问题和解决
1. 问题：后端 slim 镜像中没有 `curl` 导致健康检查失败。
   解决：在 Dockerfile 的运行阶段通过 `apt-get` 安装了 `curl`。
2. 问题：生产环境下数据库密码明文暴露。
   解决：使用了 `compose.prod.yaml` 中的 `secrets` 机制，通过读取文件方式挂载密码。

## AI 使用情况
- 使用了哪些 Prompt：
  - "为 Python FastAPI 后端创建生产级 Dockerfile：使用多阶段构建减小镜像体积，非 root 用户运行，包含健康检查端点 /health。"
  - "创建支持热重载的 Docker Compose 开发环境配置。"
- AI 帮助解决了哪些问题：
  - 优化了 Dockerfile 的多阶段构建流程。
  - 完善了 compose 文件的健康检查和资源限制配置。
  - 生成了符合规范的 GitHub Actions 工作流文件。

## 心得体会
通过本次 Docker 部署练习，我深刻体会到了容器化技术在保持环境一致性方面的巨大优势。使用多阶段构建不仅减小了镜像体积，还提高了安全性。GitHub Actions 的集成让 CI/CD 流程变得非常顺畅，极大地提升了开发效率。
