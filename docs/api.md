# AncientChinese —— API 设计

本文件根据 `docs/AncientChinese API.openapi.yaml` 同步整理。

接口基础地址：

```text
http://localhost:8000
```

统一响应结构：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

---

## 1 Users 用户接口

### 1.1 获取用户列表

```http
GET /api/users
```

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | integer | 否 | 页码，默认 1，最小 1 |
| pageSize | integer | 否 | 每页数量，默认 20，范围 1~100 |

返回：`data.items`（用户数组）+ `data.total`（总数）

### 1.2 创建用户

```http
POST /api/users
```

Body 参数（JSON）：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| username | string | 是 | 用户名，最大 50 |
| password | string | 是 | 密码，最小 6 |

### 1.3 获取用户详情

```http
GET /api/users/{userId}
```

Path 参数：`userId`（integer）

### 1.4 完全更新用户

```http
PUT /api/users/{userId}
```

Path 参数：`userId`（integer）  
Body：同创建用户

### 1.5 部分更新用户

```http
PATCH /api/users/{userId}
```

Path 参数：`userId`（integer）  
Body：`username`、`password`（可选）

### 1.6 删除用户

```http
DELETE /api/users/{userId}
```

Path 参数：`userId`（integer）

### 1.7 用户登录

```http
POST /api/users/login
```

Body 参数（JSON）：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

成功返回 `data` 字段包含：`id`、`username`、`token`

---

## 2 Projects 项目接口

### 2.1 获取项目列表

```http
GET /api/projects
```

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| ownerId | integer | 否 | 按所有者过滤 |

### 2.2 创建项目

```http
POST /api/projects
```

Body 参数（JSON）：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | string | 是 | 项目名称，最大 100 |
| description | string | 否 | 项目描述 |
| ownerId | integer | 是 | 所有者用户 ID |

### 2.3 获取项目详情

```http
GET /api/projects/{projectId}
```

Path 参数：`projectId`（integer）

### 2.4 完全更新项目

```http
PUT /api/projects/{projectId}
```

Path 参数：`projectId`（integer）  
Body：同创建项目

### 2.5 部分更新项目

```http
PATCH /api/projects/{projectId}
```

Path 参数：`projectId`（integer）  
Body：`name`、`description`、`ownerId`（可选）

### 2.6 删除项目

```http
DELETE /api/projects/{projectId}
```

Path 参数：`projectId`（integer）

---

## 3 Documents 文档接口

### 3.1 获取项目下文档列表

```http
GET /api/projects/{projectId}/documents
```

Path 参数：`projectId`（integer）

### 3.2 在项目下创建文档

```http
POST /api/projects/{projectId}/documents
```

Path 参数：`projectId`（integer）

Body 参数（JSON）：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | 是 | 文档标题，最大 200 |
| content | string | 是 | 文档内容 |

### 3.3 全局搜索文档

```http
GET /api/documents
```

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| projectId | integer | 否 | 按项目过滤 |
| keyword | string | 否 | 标题/内容关键字 |

### 3.4 获取文档详情

```http
GET /api/documents/{documentId}
```

Path 参数：`documentId`（integer）

### 3.5 完整更新文档

```http
PUT /api/documents/{documentId}
```

Path 参数：`documentId`（integer）  
Body：`title`、`content`（必填）

### 3.6 部分更新文档

```http
PATCH /api/documents/{documentId}
```

Path 参数：`documentId`（integer）  
Body：`title`、`content`（可选）

### 3.7 删除文档

```http
DELETE /api/documents/{documentId}
```

Path 参数：`documentId`（integer）

---

## 4 Annotations 标注接口

### 4.1 获取文档下标注列表

```http
GET /api/documents/{documentId}/annotations
```

Path 参数：`documentId`（integer）

### 4.2 在文档下创建标注

```http
POST /api/documents/{documentId}/annotations
```

Path 参数：`documentId`（integer）

Body 参数（JSON）：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| entity | string | 是 | 实体内容，最大 100 |
| entityType | string | 是 | 枚举：person/location/time/other |
| startPos | integer | 是 | 起始位置 |
| endPos | integer | 是 | 结束位置 |

### 4.3 全局搜索标注

```http
GET /api/annotations
```

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| projectId | integer | 否 | 按项目过滤 |
| documentId | integer | 否 | 按文档过滤 |
| entityType | string | 否 | 枚举：person/location/time/other |

### 4.4 获取标注详情

```http
GET /api/annotations/{annotationId}
```

Path 参数：`annotationId`（integer）

### 4.5 完整更新标注

```http
PUT /api/annotations/{annotationId}
```

Path 参数：`annotationId`（integer）  
Body：`entity`、`entityType`、`startPos`、`endPos`（必填）

### 4.6 部分更新标注

```http
PATCH /api/annotations/{annotationId}
```

Path 参数：`annotationId`（integer）  
Body：`entity`、`entityType`、`startPos`、`endPos`（可选）

### 4.7 删除标注

```http
DELETE /api/annotations/{annotationId}
```

Path 参数：`annotationId`（integer）

---

## 5 通用状态码

| 状态码 | 含义 |
| --- | --- |
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败（登录接口） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
