# 软件架构设计贡献说明

姓名：朱孔峥

学号：2312190231

日期：2026-3-22



## 我完成的工作

### 1.架构设计

-后端架构设计

```mermaid
graph TB
    subgraph 接入层["接入层 Access Layer"]
        A[("Nginx/反向代理")]
        B[("CORS中间件")]
        C[("认证鉴权中间件")]
    end

    subgraph 应用层["应用层 Application Layer<br/>FastAPI"]
        D[("路由层 Routers")]
        E[("依赖注入 Dependencies")]
        F[("异常处理 Exception Handler")]
    end

    subgraph 业务层["业务层 Business Layer<br/>Services"]
        G[("项目管理服务")]
        H[("文档管理服务")]
        I[("实体标注服务")]
        J[("AI答疑服务")]
        K[("分词服务")]
        L[("数据导出服务")]
    end

    subgraph 数据层["数据层 Data Layer"]
        M[("SQLAlchemy ORM")]
        N[("Pydantic Schemas")]
    end

    subgraph 存储层["存储层 Storage Layer"]
        O[("MySQL 5.7")]
        P[("本地文件存储")]
    end

    subgraph 外部服务层["外部服务层 External Services"]
        Q[("百度云千帆大模型")]
        R[("Jieba分词引擎")]
    end

    subgraph 工具层["工具层 Utils"]
        S[("数据库工具")]
        T[("AI模型封装")]
        U[("文件处理工具")]
    end

    A --> D
    D --> E
    E --> G & H & I & J & K & L
    G & H & I --> M
    M --> O
    J --> T
    T --> Q
    K --> R
    L --> U
    U --> P
    M --> N
```

### 2.技术选型

后端框架选择：FastAPI

理由：选用FastAPI的核心原因在于其原生异步架构能够高效处理ai大模型的长耗时调用，避免请求阻塞；同时框架内置的自动API文档生成和Pydantic数据校验机制，能显著提升开发效率并降低前后端协作成本，非常适合AI密集型的古汉语标注场景。

### 3.环境搭建

后端项目初始化



### 4.文档编写

-architecture.md

-database.md



## 心得体会

更加清晰地理解了项目架构，同时也了解到了许多后端框架，对E-R图的设计更加熟悉。