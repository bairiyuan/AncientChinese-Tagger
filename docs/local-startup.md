# AncientChinese 本地启动方案（前后端联调）

本文档用于在本地同时启动后端与前端，并联调真实数据库。

## 1. 启动前准备

- 操作系统：Windows（PowerShell）
- 代码根目录：`D:\桌面\大三下\移动计算\AncientChinese-Tagger`
- 后端使用：`backend/app`
- 前端使用：`frontend`
- 数据库：云服务器 MySQL（你已提供 IP、库名、账号、密码）

---

## 2. 后端启动（backend/app）

### 2.1 进入后端目录并创建虚拟环境

```powershell
cd "D:\桌面\大三下\移动计算\AncientChinese-Tagger\backend"
python -m venv .venv
.\.venv\Scripts\activate
```

> 如果已经创建过 `.venv`，可跳过 `python -m venv .venv`。

### 2.2 安装依赖

推荐完整安装：

```powershell
pip install -r requirements.txt
```

如果网络较慢，可先安装最小运行依赖：

```powershell
pip install fastapi "uvicorn[standard]" sqlalchemy pymysql pydantic bcrypt PyJWT python-multipart requests jieba
```

### 2.3 设置环境变量（当前终端有效）

```powershell
$env:DB_HOST = "121.196.168.115"
$env:DB_PORT = "3306"
$env:DB_USER = "root"
$env:DB_PASSWORD = "Ancient10086."
$env:DB_NAME = "ancient"
```

可选（生产必须，开发建议）：

```powershell
$env:JWT_SECRET = "你的强随机密钥"
```

### 2.4 启动后端服务

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2.5 验证后端

浏览器访问（注意不要用 `0.0.0.0`）：

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/docs`

数据库连通性接口：

- `http://127.0.0.1:8000/db-sample`

---

## 3. 前端启动（frontend）

### 3.1 环境变量

前端本地联调使用：

`frontend/.env.local`

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 3.2 启动前端服务

新开一个 PowerShell 终端（不要占用后端终端）：

```powershell
cd "D:\桌面\大三下\移动计算\AncientChinese-Tagger\frontend"
npm install
npm run dev
```

打开终端提示地址（通常是）：

- `http://127.0.0.1:5173`

---

## 4. 联调验证清单

按顺序验证：

1. 打开前端页面
2. 注册新用户
3. 登录成功并跳转项目页
4. 新建项目
5. 进入项目后新建文档
6. 在文档中创建标注

如果以上步骤成功，说明前后端与数据库链路已跑通。

---

## 5. 常见问题

- 页面打不开后端  
  - 确认后端访问的是 `127.0.0.1:8000` 或 `localhost:8000`，不是 `0.0.0.0:8000`。
- 启动报 `No module named xxx`  
  - 依赖未安装，执行 `pip install -r requirements.txt` 或补装缺失包。
- `pip` 下载超时  
  - 增加超时时间：`--default-timeout 600`
  - 或切换镜像源（如清华源）。
- 数据库连接失败  
  - 检查 `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`
  - 检查云服务器安全组是否放行 `3306`
  - 检查 MySQL 账号是否允许远程连接。

