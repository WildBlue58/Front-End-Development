# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个多技术栈学习项目仓库，包含以下主要模块：
- **mysql/mysql/** - MySQL 数据库管理工具（React + Node.js 全栈应用）
- **zijie/** - JavaScript 前端算法学习（调度器、LRU缓存、防抖节流）
- **python/** - Python AI 学习模块（AI转SQL、Jupyter Notebook）

## 语言规范

- 所有代码注释、文档和 commit 消息必须使用简体中文
- 代码提交遵循约定式提交格式：`类型: 简短描述,详细说明`
- Commit 类型：feat, fix, docs, style, refactor, perf, test, chore, ci

## 常用命令

### MySQL 管理工具 (mysql/mysql/)

**前端开发：**
```bash
cd mysql/mysql
pnpm install          # 安装依赖
pnpm dev              # 开发模式（http://localhost:5173）
pnpm build            # 生产构建
pnpm preview          # 预览构建
pnpm lint             # 代码检查
```

**后端开发：**
```bash
cd mysql/mysql/server
npm install           # 安装依赖
npm run dev           # 开发模式（nodemon，http://localhost:3001）
npm start             # 生产模式
```

**数据库配置：** 编辑 `mysql/mysql/server/config/db.js`

### Python AI 模块

```bash
cd python/ai2sql
pip install openai
jupyter notebook 入门.ipynb
```

### JavaScript 学习模块

```bash
node zijie/Scheduler/1.js
node zijie/防抖节流/debounce.js
```

## 项目架构

### MySQL 管理工具架构

**前后端分离架构：**
- 前端：React 19 + Vite 6 + Tailwind CSS 3
- 后端：Express 4 + MySQL2（连接池）
- API 代理：Vite dev server proxy `/api` → `http://localhost:3001`

**前端组件结构：**
```
src/
├── services/api.js           # Axios 实例和所有 API 定义
├── components/
│   ├── common/               # Modal, Toast, Loading, Icons
│   ├── features/             # DataTable, DataForm, SQLExecutor, TableStructureViewer
│   └── layout/               # Header, Sidebar
└── App.jsx                   # 主应用（路由+状态管理）
```

**后端结构：**
```
server/
├── index.js                  # Express 入口
├── config/db.js              # MySQL 连接池配置
├── controllers/              # dataController, tableController, structureController, sqlController
├── routes/index.js           # API 路由定义
└── utils/                    # SQL 注入防护、数据库辅助函数
```

**核心 API 端点：**
- `GET /api/test` - 测试连接
- `GET /api/tables` - 获取表列表
- `GET /api/data/:tableName` - 获取表数据（分页）
- `POST /api/data/:tableName` - 插入数据
- `PUT /api/data/:tableName` - 更新数据
- `DELETE /api/data/:tableName` - 删除数据
- `GET /api/table-structure/:tableName` - 获取表结构
- `POST /api/execute-sql` - 执行 SQL 查询（仅 SELECT）

### 技术栈特性

**Tailwind CSS 配置：**
- 主题色：`slate-900` (暗黑背景) + `sky-500` (强调色)
- 自定义工具类：`glass`, `btn`, `input-base`
- 玻璃拟态风格：`backdrop-blur` + 半透明背景

**MySQL2 连接池：**
- 默认连接池大小：10
- 自动管理连接生命周期
- 使用 `promise()` 包装异步查询

**安全特性：**
- SQL 注入防护（`utils/validation.js`）
- CORS 配置
- 请求头 `Content-Type: application/json`

### JavaScript 学习模块

**zijie/Scheduler/** - 任务调度器实现
- 控制并发任务数量
- 队列管理机制
- 多版本迭代（1-1.js 至 1-6.js）

**zijie/防抖节流/** - 性能优化函数
- 防抖（debounce.js）：延迟执行、立即执行版本
- 节流（throttle.js）：时间戳版本、定时器版本
- 包含详细中文注释和应用场景说明

**zijie/3.js** - LRU 缓存实现
- 使用 Map 保持顺序
- O(1) 时间复杂度

## 关键配置文件

- **vite.config.js** - 开发服务器代理配置
- **tailwind.config.js** - Tailwind 主题配置
- **eslint.config.js** - ESLint 规则（React Hooks + 未使用变量检查）
- **.cursorrules** - Commit 消息规范
