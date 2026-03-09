# AncientChinese——前端说明

汉语智能标注平台 - 古汉语文本处理与标注系统

## 项目简介

AncientChinese是一个面向古汉语文本的智能标注平台，集成了自动分词、自动/手动实体标注、古文解析、古文答疑、数据导出等功能，帮助用户高效地处理和分析古汉语文本资料。

## 前端页面

- **项目与文档管理**：支持项目增删改查、文档增删改查导入导出

- **实体标注**：手动标注或 AI 自动标注人物、地名、时间、器物等实体

- **古文解析**：基于 DeepSeek AI 的古文智能解析

- **古文答疑**：针对古文内容进行提问和智能答疑

- **自动分词**：基于 jieba 的中文分词功能

- **数据导出**：支持导出文档及标注数据

  
  
  页面流程图：
  
  ![1](./docs/1.png)

## 技术选型

前端采用 **原生 HTML、CSS、JavaScript** 构建，通过调用后端 API 实现数据交互，并集成 AI 能力完成古文解析与问答功能。

## 目录结构

```
AncientChinese/
├── docs/                 
│   ├── frontend.md         # 前端说明
│   ├── backend.md             # 后端说明
│   └── api.md                # API设计
├── frontend/                # 前端代码             
├── backend/              # 后端代码
├── .gitignore        
└── README.md            # 项目整体说明
```

## 运行方式

1. 安装依赖（首次运行）：

   ```
   npm install
   ```

2.  启动服务：

   ```
   npm run serve
   ```

   

GitHub地址：[bairiyuan/AncientChinese-Tagger: 汉语智能标注平台，面向古汉语文本的智能处理工具，集成自动分词、AI / 手动实体标注、古文解析 / 答疑、数据导出等功能，前后端分离架构](https://github.com/bairiyuan/AncientChinese-Tagger)

   
