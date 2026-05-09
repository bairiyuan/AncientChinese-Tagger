# 安全审查贡献说明

姓名：朱孔峥

学号：2312190231

日期：2026-5-10



## 我完成的工作



### AI安全审查

#### 审查的文件与模块

| 文件/模块 | 审查范围 |
| --------- | -------- |
| backend/app/services/llm_service.py | API密钥配置 |
| backend/app/services/users_service.py | JWT密钥、密码哈希、用户服务 |
| backend/app/routes/projects.py | 项目相关接口鉴权 |
| backend/app/routes/documents.py | 文档相关接口鉴权、错误处理 |
| backend/app/routes/annotations.py | 标注相关接口鉴权 |
| backend/app/routes/ai.py | AI相关接口鉴权 |

#### AI发现的主要问题

| 问题类型 | 风险等级 | 说明 |
| -------- | -------- | ---- |
| 硬编码API密钥 | 高 | DEEPSEEK_API_KEY 直接写在代码中 |
| JWT密钥默认值 | 高 | 使用不安全的默认密钥 |
| 密码哈希泄露 | 高 | 用户密码哈希通过API返回给前端 |
| 未认证接口 | 高 | 所有业务接口均缺少身份验证 |
| 错误信息暴露 | 中 | 错误响应暴露内部实现细节 |
| 资源权限校验缺失 | 高 | 无法验证用户是否有权操作资源 |

#### 我修复的问题

| 问题类型 | 修复文件 | 修复方式 |
| -------- | -------- | -------- |
| 硬编码API密钥 | llm_service.py | 改为从环境变量读取，启动时强制检查 |
| JWT密钥默认值 | users_service.py | 移除默认值，启动时强制检查 |
| 密码哈希泄露 | users_service.py | 删除 user_to_dict 中的 password 字段 |
| 未认证接口 | projects.py, documents.py, annotations.py, ai.py | 为所有接口添加 JWT 鉴权装饰器 |
| 错误信息暴露 | documents.py | 统一错误处理，返回通用错误信息 |



### 安全检查清单

**认证与授权**
- [x] 密码存储：使用 bcrypt / argon2 哈希，不存明文
- [x] JWT / Session：token 有过期时间，logout 后失效
- [x] 接口鉴权：所有需要登录的接口都有权限校验
- [x] 越权访问：用户只能操作自己的数据（不能通过改 ID 访问他人数据）

**注入防护**
- [x] SQL：使用 ORM 或参数化查询，无字符串拼接 SQL
- [ ] XSS：前端输出用户数据时不用 innerHTML，或使用 DOMPurify

**敏感信息**
- [x] API Key / 密码：不硬编码在代码中，通过环境变量读取
- [x] .env 文件：已加入 .gitignore，仓库中有 .env.example

**依赖安全**
- [x] 运行依赖扫描，无高危漏洞（或已记录已知漏洞原因）