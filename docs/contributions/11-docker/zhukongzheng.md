# Docker 部署贡献说明



姓名：朱孔峥

学号：2312190231

日期：2026-5-17



## 我完成的工作

1. ### Dockerfile 编写

   后端 Dockerfile（多阶段构建）

   .dockerignore 文件

2. ### Compose 配置

​      开发环境 compose.yaml

​      生产环境 compose.prod.yaml

​      健康检查配置



## AI 使用情况

使用的Prompt：

1.我现在要为后端编写多阶段构建的 Dockerfile。为 Python FastAPI 后端创建生产级 Dockerfile：-使用多阶段构建减小镜像体积（目标 < 200MB），基础镜像使用 Alpine 或 slim 变体，非 root 用户运行，健康检查端点 /health，暴露端口，包含 .dockerignore 文件。

2.创建包含资源限制和密钥管理的生产配置