# AncientChinese

汉语智能标注平台 - 古汉语文本处理与标注系统

## 项目简介

AncientChinese是一个面向古汉语文本的智能标注平台，集成了自动分词、自动/手动实体标注、古文解析、古文答疑、数据导出等功能，帮助用户高效地处理和分析古汉语文本资料。

## 主要功能

- **项目与文档管理**：支持项目增删改查、文档增删改查导入导出

- **实体标注**：手动标注或 AI 自动标注人物、地名、时间、器物等实体

- **古文解析**：基于 DeepSeek AI 的古文智能解析

- **古文答疑**：针对古文内容进行提问和智能答疑

- **自动分词**：基于 jieba 的中文分词功能

- **数据导出**：支持导出文档及标注数据

  ![1](C:\Users\user\Desktop\AncientChinese\1.png)

## 项目结构

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

## 技术栈

### 前端
- 原生 HTML/CSS/JavaScript

### 后端
- **AI 服务**：Python + Flask + DeepSeek API
- **分词服务**：Python + Flask + jieba
- **用户服务**：Node.js + Express

## 快速开始

请参考 [使用教程.md](./使用教程.md) 获取详细的环境配置、依赖安装和启动步骤。

**基本流程**：

1. 配置 Python 和 Node.js 环境
2. 安装各服务依赖
3. 配置 DeepSeek API Key
4. 启动三个后端服务
5. 浏览器打开 `index.html`

## 端口说明

- **5001**：分词服务
- **5002**：用户管理服务
- **5004**：AI 服务

## License

MIT

