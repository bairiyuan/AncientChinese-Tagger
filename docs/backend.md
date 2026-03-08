# AncientChinese——后端说明

汉语智能标注平台 - 古汉语文本处理与标注系统

## 模块功能

- **项目与文档管理**：支持项目增删改查、文档增删改查导入导出
- **实体标注**：手动标注或 AI 自动标注人物、地名、时间、等实体
- **古文答疑解析**：基于 AI 大模型对古文内容进行提问和智能答疑解析
- **自动分词**：基于 jieba 的中文分词功能
- **数据导出**：将完成标注的文档进行导出

## 技术选型

后端开发语言选择Python，开发工具为PyCharm。后端技术框架为FastAPI，数据库选择为MySQL 5.7。AI大模型选用百度云的千帆大模型。

## 目录结构

目前设计的后端目录结构如下图所示，后续可能还会修改

```
backend/
│
├── app/                    # 主应用目录
│
│   ├── main.py             # FastAPI 入口程序
│
│   ├── config/             # 配置文件
│   │   └── database.py     # 数据库连接配置
│
│   ├── models/             # 数据库模型（ORM）
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── document.py
│   │   └── annotation.py
│
│   ├── schemas/            # 数据结构（Pydantic）
│   │   ├── project.py
│   │   ├── document.py
│   │   └── annotation.py
│
│   ├── routers/            # API接口路由
│   │   ├── project_router.py
│   │   ├── document_router.py
│   │   ├── annotation_router.py
│   │   ├── ai_router.py
│   │   └── export_router.py
│
│   ├── services/           # 业务逻辑层
│   │   ├── project_service.py
│   │   ├── document_service.py
│   │   ├── annotation_service.py
│   │   ├── ai_service.py
│   │   └── export_service.py
│
│   ├── utils/              # 工具模块
│   │   ├── jieba_segment.py
│   │   ├── ai_model.py
│   │   └── file_utils.py
│
│   └── database/           # 数据库初始化
│       └── init_db.py
│
├── requirements.txt        # 项目依赖
└── README.md               # 项目说明
```

## 运行方式

在项目根目录下执行以下命令启动 FastAPI 服务：

```
uvicorn main:app --reload
```

或者直接在PyCharm中点击运行按钮运行后端代码。