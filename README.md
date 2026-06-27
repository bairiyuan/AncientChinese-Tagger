# AncientChinese-Tagger 汉语智能标注平台

[![CI](https://github.com/bairiyuan/AncientChinese-Tagger/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/bairiyuan/AncientChinese-Tagger/actions)
[![codecov backend](https://codecov.io/gh/bairiyuan/AncientChinese-Tagger/branch/develop/graph/badge.svg?flag=backend)](https://codecov.io/gh/bairiyuan/AncientChinese-Tagger)
[![codecov frontend](https://codecov.io/gh/bairiyuan/AncientChinese-Tagger/branch/develop/graph/badge.svg?flag=frontend)](https://codecov.io/gh/bairiyuan/AncientChinese-Tagger)

> **面向古汉语研究与教学的沉浸式智能处理工作台**

AncientChinese-Tagger 是一个融合了人工智能与古典文献学的综合性学术平台。它旨在通过深度学习技术（DeepSeek LLM）与经典 NLP 工具（jieba），解决古文处理中繁琐的断句、分词、实体识别及背景理解等痛点，为研究者提供一个从原始文献到结构化数据的全流程处理环境。

***

## 👥 团队成员与分工

| 姓名      | 学号         | 核心职责                                                                        |
| ------- | ---------- | --------------------------------------------------------------------------- |
| **周芷伊** | 2312190211 | **前端架构**：负责 Vue 3 响应式工作台开发、UI/UX 美学设计、动态图例系统。                               |
| **朱孔峥** | 2312190231 | **后端开发**：负责 FastAPI 核心架构、数据库模型设计、业务逻辑实现。                                    |
| **张贤文** | 2312190210 | **全栈开发与智能化赋能**：主导 DeepSeek AI 深度集成；负责项目管理模块前后端联调；搭建 CI/CD 自动化流线与系统可观测性监控体系。 |

🔗 **设计稿 (Figma)**: [查看原型设计](https://www.figma.com/design/ihRPLQpRDVUGJyPdDE2xhA/AncientChinese?node-id=0-1)

***

## ✨ 核心功能模块

### 1. 智能文献处理

- **深度古文解析**：接入 DeepSeek-V3 大模型，支持长文本（如《桃花源记》）的完整断句、语法分析与白话文翻译。
- **自动词性标注**：结合古汉语语料优化的分词算法，支持 10+ 类古汉语专用词性标注（如：名、动、形、副、助等）。
- **智能分段渲染**：解析结果自动保留原文段落结构，解决传统 AI 处理长文本时的截断与丢失问题。

### 2. 交互式标注系统

- **混合标注模式**：支持 AI 自动预标注与人工精细化修正。
- **动态图例引导**：实体标注界面实时显示类型图例（人物、地名、时间、概念等），通过色彩系统辅助快速核对。
- **持久化缓存**：每一篇文档的解析与分词结果均实现数据库级缓存，支持“秒开”历史记录，亦可一键重新解析。

### 3. 学术辅助工具

- **全场景 AI 助手**：从首页咨询到编辑器深挖，AI 助手全程随行，支持 Markdown 渲染，提供沉浸式学术问答。
- **多格式数据导出**：支持将标注后的结构化数据导出，便于后续统计分析或二次研究。

***

## 🛠️ 技术架构

### 前端 (Frontend)

- **核心框架**: Vue 3 (Composition API) + TypeScript
- **构建工具**: Vite
- **渲染引擎**: Markdown-it (AI 回复渲染) + DOMPurify (安全过滤)
- **视觉风格**: 自定义护眼宣纸美学系统，响应式布局

### 后端 (Backend)

- **核心框架**: FastAPI (Python 3.12+)
- **数据库**: MySQL 8.0+ (支持远程云端与本地容器切换)
- **AI 引擎**: DeepSeek API + 提示词工程 (Prompt Engineering)
- **日志监控**: 结构化 JSON 日志 + `/health` 健康检查端点

***

## 📊 系统监控与可观测性

项目内置了完善的监控体系，满足工业级运维需求：

1. **健康检查**: 通过 `http://localhost:8000/health` 实时获取服务状态。
2. **性能测试**: 引入 Locust 框架，支持对核心接口进行高并发压力测试，确保系统稳定性。
3. **结构化日志**: 采用 JSON 格式输出，记录每一条 API 请求、AI 调用耗时及数据库状态。
4. **版本控制**: 规范的 Git 分支管理（develop/feature/main）与提交历史。

***

## 🚀 快速启动

### 方式一：Docker 容器化启动 (推荐)

```bash
# 1. 准备配置文件
cp .env.example .env

# 2. 一键启动
docker compose up -d --build
```

### 方式二：Windows 本地开发启动

详细步骤请参阅：[📖 完整部署指南](./docs/deployment-guide.md)

***

## 📁 项目结构

```text
AncientChinese-Tagger/
├── .github/                # GitHub Actions 工作流 (CI/CD)
├── backend/                # FastAPI 后端核心
│   ├── app/                # 业务逻辑 (Models, Routes, Services)
│   ├── tests/              # pytest 自动化测试
│   ├── locustfile.py       # Locust 性能测试脚本
│   └── Dockerfile          # 容器构建
├── frontend/               # Vue 3 前端应用
│   ├── src/                # 源码 (Views, API, Components)
│   ├── __tests__/          # vitest 自动化测试
│   └── Dockerfile          # 容器构建
├── docs/                   # 详尽的技术文档与设计图
│   ├── 期末文档/             # 课程期末提交文档及相关资源
├── 期末文档/               # 课程期末提交文档及相关资源
├── compose.yaml            # Docker 编排配置
└── README.md               # 项目门户
```

