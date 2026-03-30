# 数据库设计文档



## 核心数据表

用户表（users）

| 字段名     | 类型         | 说明           |
| ---------- | ------------ | -------------- |
| id         | INT (PK)     | 用户ID，自增   |
| username   | VARCHAR(50)  | 用户名（唯一） |
| password   | VARCHAR(255) | 密码           |
| created_at | DATETIME     | 创建时间       |
| updated_at | DATETIME     | 更新时间       |

项目表（projects）

| 字段名      | 类型         | 说明                 |
| ----------- | ------------ | -------------------- |
| id          | INT (PK)     | 项目ID，自增         |
| name        | VARCHAR(100) | 项目名称             |
| description | TEXT         | 项目描述             |
| owner_id    | INT (FK)     | 所属用户（users.id） |
| created_at  | DATETIME     | 创建时间             |
| updated_at  | DATETIME     | 更新时间             |

文件表（documents）

| 字段名     | 类型         | 说明                    |
| ---------- | ------------ | ----------------------- |
| id         | INT (PK)     | 文档ID，自增            |
| project_id | INT (FK)     | 所属项目（projects.id） |
| title      | VARCHAR(200) | 文档标题                |
| content    | LONGTEXT     | 文档内容                |
| created_at | DATETIME     | 创建时间                |
| updated_at | DATETIME     | 更新时间                |

标注表（annotations）

| 字段名      | 类型         | 说明                                   |
| ----------- | ------------ | -------------------------------------- |
| id          | INT (PK)     | 标注ID，自增                           |
| document_id | INT (FK)     | 所属文档（documents.id）               |
| entity      | VARCHAR(100) | 实体内容                               |
| entity_type | ENUM         | 实体类型（person/location/time/other） |
| start_pos   | INT          | 起始位置                               |
| end_pos     | INT          | 结束位置                               |
| created_at  | DATETIME     | 创建时间                               |
| updated_at  | DATETIME     | 更新时间                               |



## E-R图

![ER图](2.png)



## 建表SQL

用户表

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

项目表

```sql
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

文件表

```sql
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    title VARCHAR(200),
    content LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

标注表

```sql
CREATE TABLE annotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_type ENUM('person','location','time','other') NOT NULL,
    start_pos INT,
    end_pos INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

