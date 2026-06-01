# AncientChinese-Tagger 监控配置说明

本文档详细介绍了本项目如何实现可观测性（监控与日志管理）。

## 1. 日志管理

项目采用了**结构化日志 (Structured Logging)** 方案，以便于在分布式环境下进行日志聚合与搜索。

### 1.1 日志格式
日志以 **JSON** 格式输出到控制台。
- **配置位置**: `backend/app/utils/logger.py`
- **示例输出**:
```json
{
  "time": "2026-05-14T10:00:00.123456",
  "level": "INFO",
  "message": "Request: POST /api/users/login Status: 200 Time: 0.0452s",
  "module": "main",
  "name": "ancient-chinese-tagger"
}
```

### 1.2 日志收集
在 Docker 环境下，所有服务的标准输出（stdout）均会被 Docker Daemon 捕获，可以通过以下命令查看：
```bash
docker compose logs -f backend
```

---

## 2. 健康检查

系统提供了标准的健康检查接口，用于负载均衡器或监控平台判断服务状态。

- **端点地址**: `/health`
- **返回内容**:
    - `status`: 服务状态（healthy）
    - `timestamp`: 当前服务器时间
    - `version`: 应用版本号
    - `uptime`: 系统最后启动时间

---

## 3. 指标收集 (Metrics)

项目内置了一个轻量级的指标收集器，通过 FastAPI 中间件自动统计请求数据。

- **端点地址**: `/metrics`
- **收集指标**:
    - `total_requests`: 总请求次数
    - `error_requests`: 失败请求次数 (HTTP 4xx/5xx)
    - `error_rate`: 实时错误率
    - `server_time`: 当前统计时间

---

## 4. 运行时监控查看

你可以直接通过浏览器或 `curl` 命令查看实时监控数据：

```bash
# 查看健康状态
curl http://localhost:8080/health

# 查看业务指标
curl http://localhost:8080/metrics
```
