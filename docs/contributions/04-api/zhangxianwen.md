# API 设计与文档贡献说明

姓名：张贤文

学号：2312190210

日期：2026-3-29


## 我完成的工作

### 1. 编写 OpenAPI YAML 接口定义

- 完成 API 接口规范文件 [AncientChinese API.openapi.yaml](../../../docs/AncientChinese%20API.openapi.yaml) 的设计与整理。
- 按 RESTful 风格组织接口，覆盖 Users / Projects / Documents / Annotations 四类资源。
- 在接口定义中补充了：
  - 常用请求方法：GET、POST、PUT、PATCH、DELETE；
  - 路径参数、查询参数、请求体、响应体结构；
  - 统一响应格式：`code`、`message`、`data`；
  - 常见状态码（200/201/400/401/404/500）。

### 2. 同步更新 API 文档

- 根据 YAML 规范同步重写 [api.md](../../../docs/api.md)。
- 将文档中的旧接口路径统一为 `/api/*` 风格。
- 补充用户登录接口 `/api/users/login`，并完善各模块参数说明，保证文档与接口规范一致，方便前后端联调和 Apifox 导入使用。

### 3. Git 提交与版本管理

- 本周完成并推送 API 文档相关提交，提交信息为：
  - `docs(api): add OpenAPI YAML and sync API documentation`
- 本次提交主要包含：
  - 新增 YAML 规范文件；
  - 更新 API 文档内容与结构。


## 心得体会

通过本周的工作，我更清楚了 API 规范文件和文档同步的重要性。先用 OpenAPI 定义接口，再同步到说明文档，能显著减少前后端理解偏差，也更方便在 Apifox 中做接口调试和测试用例生成。
