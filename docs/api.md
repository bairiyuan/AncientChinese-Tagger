# AncientChinese —— API 设计

本系统采用 **前后端分离架构**，前端通过 HTTP 请求调用后端 API 获取数据。
 后端使用 **FastAPI** 框架开发，接口数据格式为 **JSON**。

接口基础地址：

```
http://localhost:8000
```

------

# 1 项目管理接口

用于管理古文研究项目。

### 1.1 创建项目

```
POST /projects
```

参数：

| 参数        | 类型   | 说明     |
| ----------- | ------ | -------- |
| name        | string | 项目名称 |
| description | string | 项目描述 |

------

### 1.2 获取项目列表

```
GET /projects
```

返回项目列表数据。

------

### 1.3 修改项目

```
PUT /projects/{project_id}
```

参数：

| 参数        | 类型   | 说明     |
| ----------- | ------ | -------- |
| name        | string | 项目名称 |
| description | string | 项目描述 |

------

### 1.4 删除项目

```
DELETE /projects/{project_id}
```

删除指定项目。

------

# 2 文档管理接口

用于管理项目中的古文文档。

### 2.1 新建文档

```
POST /documents
```

参数：

| 参数       | 类型   | 说明     |
| ---------- | ------ | -------- |
| project_id | int    | 项目ID   |
| title      | string | 文档标题 |
| content    | string | 文档内容 |

------

### 2.2 获取文档列表

```
GET /documents
```

参数：

| 参数       | 类型 | 说明     |
| ---------- | ---- | -------- |
| project_id | int  | 所属项目 |

------

### 2.3 删除文档

```
DELETE /documents/{document_id}
```

删除指定文档。

------

# 3 实体标注接口

用于对古文中的实体进行标注。

### 3.1 创建标注

```
POST /annotations
```

参数：

| 参数        | 类型   | 说明     |
| ----------- | ------ | -------- |
| document_id | int    | 文档ID   |
| start_pos   | int    | 起始位置 |
| end_pos     | int    | 结束位置 |
| label       | string | 实体类型 |

------

### 3.2 获取标注

```
GET /annotations
```

参数：

| 参数        | 类型 | 说明   |
| ----------- | ---- | ------ |
| document_id | int  | 文档ID |

------

### 3.3 删除标注

```
DELETE /annotations/{annotation_id}
```

------

# 4 AI 功能接口

用于古文解析和问答功能。

### 4.1 古文解析

```
POST /ai/analysis
```

参数：

| 参数 | 类型   | 说明     |
| ---- | ------ | -------- |
| text | string | 古文内容 |

------

### 4.2 古文问答

```
POST /ai/qa
```

参数：

| 参数     | 类型   | 说明       |
| -------- | ------ | ---------- |
| text     | string | 古文内容   |
| question | string | 提出的问题 |

------

# 5 自动分词接口

### 5.1 文本分词

```
POST /ai/segment
```

参数：

| 参数 | 类型   | 说明     |
| ---- | ------ | -------- |
| text | string | 古文文本 |

------

# 6 数据导出接口

### 6.1 导出数据

```
GET /export/{project_id}
```

导出指定项目的标注数据。