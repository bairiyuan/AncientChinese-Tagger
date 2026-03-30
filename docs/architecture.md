# 架构设计文档

## 前端架构

<img src="3.png" alt="Gemini_Generated_Image_mq3dq4mq3dq4mq3d" style="zoom:50%;" />

## 后端架构

### 服务模块划分

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



## 技术选型确认

| 层级     | 选择    | 理由                                                         |
| -------- | ------- | ------------------------------------------------------------ |
| 前端框架 | Vue3+Vite | Vue3 采用组件化开发模式，结构清晰，易于维护;Vite支持 ESModule,配置简单,官方推荐 Vue3 使用 |
| 后端框架 | FastAPI | 选用FastAPI的核心原因在于其原生异步架构能够高效处理ai大模型的长耗时调用，避免请求阻塞；同时框架内置的自动API文档生成和Pydantic数据校验机制，能显著提升开发效率并降低前后端协作成本，非常适合AI密集型的古汉语标注场景 |
| 数据库   | 阿里云 MySQL 云数据库 | 选用阿里云托管 MySQL（RDS）作为后端数据存储，具有自动备份、高可用、弹性扩展等特性，支持公网访问与安全控制，便于课程环境下的远程开发与部署，同时完全兼容标准 MySQL 协议，方便与 FastAPI 后端及现有工具链集成 |
| 部署方式 |         |                                                              |


