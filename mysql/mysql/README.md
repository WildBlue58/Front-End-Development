# Enterprise Power 数据库查看器

## 项目说明

这是一个功能完整的 MySQL 数据库管理工具，采用前后端分离架构，提供直观的 Web 界面来管理和操作 MySQL 数据库。

**全新升级**：项目已全面重构，采用 **Tailwind CSS** 打造现代化、响应式的**高端暗黑风格（Premium Dark Mode）**界面，引入了**玻璃拟态（Glassmorphism）**设计语言，提供极致的用户体验。

支持数据查看、编辑、表结构管理以及 SQL 查询执行等功能。

## 技术栈

### 前端

- **React 19** - UI 框架
- **Vite 6** - 极速构建工具
- **Tailwind CSS 3** - 原子化 CSS 框架（全新引入）
- **PostCSS & Autoprefixer** - CSS 处理
- **Axios** - HTTP 客户端

### 后端

- **Node.js** - 运行时环境
- **Express 4** - Web 框架
- **MySQL2** - MySQL 数据库驱动（支持连接池）
- **CORS** - 跨域资源共享

## 功能特性

### 🎨 极致 UI/UX 设计

- **高端暗黑模式**：基于 `slate-900` 色系的深色主题，搭配 `sky-500` 霓虹点缀。
- **玻璃拟态风格**：侧边栏、导航栏、模态框采用磨砂玻璃效果（Backdrop Blur）。
- **流畅交互**：全站组件支持平滑过渡动画、Hover 微交互。
- **响应式布局**：完美适配桌面端与移动端设备。

### 核心功能

1. **数据库连接管理**
   - 实时显示数据库连接状态
   - 自动检测数据库连接健康状态

2. **数据表管理**
   - 查看所有数据表和视图
   - 支持表名搜索过滤（实时筛选）
   - 区分表和视图类型

3. **数据查看与操作**
   - **现代化表格**：支持斑马纹、悬停高亮、固定表头、内容截断提示。
   - 分页查看表数据（每页最多 1000 条）
   - 新增记录（统一表单样式，支持必填校验）
   - 编辑记录（基于主键更新）
   - 删除记录（带确认提示）
   - 视图只读模式（禁止编辑操作）

4. **表结构查看**
   - 查看表的完整结构信息
   - 显示列名、数据类型、约束等详细信息
   - 显示主键、外键等约束信息

5. **SQL 执行器**
   - **专业编辑器**：Monospace 等宽字体，深色背景，提供舒适的编码体验。
   - 执行自定义 SQL 查询（仅支持 SELECT 语句）
   - 实时显示查询结果
   - 历史记录功能

### 消息通知

- 统一的 Toast 消息通知系统（成功、失败、提示），样式美观，支持自动消失。

## 安装步骤

### 1. 安装前端依赖

```bash
cd mysql/mysql
pnpm install
```

### 2. 安装后端依赖

```bash
cd mysql/mysql/server
pnpm install
```

或者使用 npm：

```bash
cd mysql/mysql/server
npm install
```

### 3. 配置数据库连接

编辑 `mysql/mysql/server/config/db.js` 文件，修改数据库连接配置：

```javascript
export const dbConfig = {
  host: "localhost",        // 数据库主机地址
  user: "root",             // 数据库用户名
  password: "123456",       // 数据库密码
  database: "enterprise_power", // 数据库名称
};
```

**注意**：项目使用连接池管理数据库连接，默认连接池大小为 10。

## 运行项目

### 1. 启动后端服务器

在一个终端窗口中运行：

```bash
cd mysql/mysql/server
npm run dev
```

后端服务器将在 `http://localhost:3001` 启动。

### 2. 启动前端开发服务器

在另一个终端窗口中运行：

```bash
cd mysql/mysql
pnpm dev
```

前端应用将在 `http://localhost:5173` 启动（Vite 默认端口）。

## 项目结构

```bash
mysql/
├── server/                      # 后端服务器
│   ├── index.js                # 服务器主文件
│   ├── config/                 # 配置文件
│   └── ...                     # 控制器、路由等
├── src/                        # 前端源代码
│   ├── main.jsx               # React 应用入口
│   ├── App.jsx                # 主应用组件（布局入口）
│   ├── index.css              # Tailwind 指令 & 基础样式
│   ├── services/              # API 服务层
│   ├── components/            # 组件目录
│   │   ├── common/           # 通用组件 (Modal, Toast, Loading, Icons)
│   │   ├── features/         # 功能组件 (DataTable, DataForm, SQLExecutor...)
│   │   └── layout/           # 布局组件 (Header, Sidebar)
│   └── assets/               # 静态资源
├── postcss.config.cjs          # PostCSS 配置
├── tailwind.config.js          # Tailwind CSS 配置
├── vite.config.js              # Vite 配置
└── README.md                   # 项目说明文档
```

## 开发说明

### 前端开发

```bash
# 启动开发服务器（带热重载）
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

### 样式配置

本项目使用 **Tailwind CSS** 进行样式开发。

- 主要配置文件：`tailwind.config.js`
- 自定义颜色：`dark` (slate-900), `accent` (sky-500)
- 字体：Inter (无衬线), JetBrains Mono (等宽)

## 注意事项

### 数据库配置

- 确保 MySQL 服务已启动
- 确保数据库用户有足够的权限访问目标数据库

### 常见问题

**Q: 样式显示不正常？**

- 确保已运行 `pnpm install` 安装所有依赖（尤其是 tailwindcss）。
- 如果修改了 `tailwind.config.js`，请重启开发服务器。

**Q: SQL 执行失败？**

- 确认 SQL 语句是 SELECT 查询。
- 检查表名和列名是否正确。

## 许可证

本项目仅供学习和开发使用。

## 更新日志

### v2.0.0 (UI 重构版)

- **UI 全面重构**：迁移至 Tailwind CSS。
- **视觉升级**：引入玻璃拟态和高端暗黑模式。
- **体验优化**：优化表格、表单和交互动画。
- **工程化**：移除传统 CSS 文件，采用 Utility-First 开发模式。

### v1.0.0

- 初始版本发布
- 支持基本的数据库查看和操作功能
