# Enterprise Power 数据库查看器

## 项目说明

这是一个功能完整的 MySQL 数据库管理工具，采用前后端分离架构，提供直观的 Web 界面来管理和操作 MySQL 数据库。支持数据查看、编辑、表结构管理以及 SQL 查询执行等功能。

## 技术栈

### 前端

- **React 19** - UI 框架
- **Vite 6** - 构建工具和开发服务器
- **Axios** - HTTP 客户端
- **CSS3** - 样式设计

### 后端

- **Node.js** - 运行时环境
- **Express 4** - Web 框架
- **MySQL2** - MySQL 数据库驱动（支持连接池）
- **CORS** - 跨域资源共享

## 功能特性

### 核心功能

1. **数据库连接管理**
   - 实时显示数据库连接状态
   - 自动检测数据库连接健康状态

2. **数据表管理**
   - 查看所有数据表和视图
   - 支持表名搜索过滤
   - 区分表和视图类型

3. **数据查看与操作**
   - 分页查看表数据（每页最多 1000 条）
   - 新增记录（支持自动生成字段处理）
   - 编辑记录（基于主键更新）
   - 删除记录（带确认提示）
   - 视图只读模式（禁止编辑操作）

4. **表结构查看**
   - 查看表的完整结构信息
   - 显示列名、数据类型、约束等详细信息
   - 显示主键、外键等约束信息

5. **SQL 执行器**
   - 执行自定义 SQL 查询（仅支持 SELECT 语句）
   - 实时显示查询结果
   - SQL 注入防护

### 用户体验

- 响应式设计，适配不同屏幕尺寸
- 加载状态提示
- Toast 消息通知
- 错误处理和友好提示
- 模态框表单编辑

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
npm start
```

或者使用开发模式（自动重启）：

```bash
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

## 使用说明

### 启动前准备

1. 确保 MySQL 服务正在运行
2. 确保目标数据库（默认：`enterprise_power`）存在
3. 确保数据库用户有足够的权限（SELECT、INSERT、UPDATE、DELETE、SHOW 等）

### 基本使用流程

1. **启动后端服务器**（终端 1）

   ```bash
   cd mysql/mysql/server
   npm start
   ```

   或使用开发模式：

   ```bash
   npm run dev
   ```

2. **启动前端开发服务器**（终端 2）

   ```bash
   cd mysql/mysql
   pnpm dev
   ```

3. **访问应用**
   - 在浏览器中打开 `http://localhost:5173`
   - 查看顶部连接状态指示器，确认数据库连接正常

### 功能使用指南

#### 查看数据

- 在左侧边栏选择数据表
- 数据以表格形式显示，支持分页浏览
- 点击页码切换不同页面

#### 编辑数据

- **新增记录**：点击"新增记录"按钮，填写表单后提交
- **编辑记录**：点击表格行中的"编辑"按钮，修改数据后保存
- **删除记录**：点击表格行中的"删除"按钮，确认后删除

#### 查看表结构

- 点击顶部导航栏的"结构"标签
- 查看表的列信息、数据类型、约束等详细信息

#### 执行 SQL 查询

- 点击顶部导航栏的"SQL"标签
- 在编辑器中输入 SELECT 查询语句
- 点击"执行"按钮查看结果
- **注意**：仅支持 SELECT 查询，其他类型的 SQL 语句会被拒绝

#### 搜索表

- 在左侧边栏的搜索框中输入表名关键词
- 实时过滤显示匹配的表名

## API 端点

后端提供以下 RESTful API 端点：

### 连接测试

- `GET /api/test` - 测试数据库连接状态

### 表管理

- `GET /api/tables` - 获取所有数据表和视图列表
- `GET /api/all-data` - 获取所有表的数据（不推荐，数据量大时性能差）

### 数据操作

- `GET /api/data/:tableName` - 获取指定表的数据（支持分页）
  - 查询参数：`page`（页码，默认 1）、`limit`（每页条数，默认 100，最大 1000）
- `POST /api/data/:tableName` - 在指定表中插入新记录
- `PUT /api/data/:tableName` - 更新指定表中的记录
- `DELETE /api/data/:tableName` - 删除指定表中的记录

### 表结构管理

- `GET /api/table-structure/:tableName` - 获取指定表的结构信息
- `POST /api/table-structure` - 创建新表
- `PUT /api/table-structure/:tableName` - 修改表结构（添加/删除/修改列）

### SQL 执行

- `POST /api/execute-sql` - 执行 SQL 查询（仅支持 SELECT 语句）
  - 请求体：`{ "sql": "SELECT * FROM table_name" }`

### 响应格式

所有 API 响应遵循统一格式：

**成功响应**：

```json
{
  "success": true,
  "data": {...},
  "message": "操作成功"
}
```

**错误响应**：

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

## 项目结构

```bash
mysql/
├── server/                      # 后端服务器
│   ├── index.js                # 服务器主文件（Express 应用入口）
│   ├── package.json            # 后端依赖配置
│   ├── config/                 # 配置文件目录
│   │   ├── db.js              # 数据库连接配置
│   │   └── config.js          # 其他配置（如存在）
│   ├── controllers/            # 控制器目录
│   │   ├── tableController.js  # 表管理控制器
│   │   ├── dataController.js   # 数据操作控制器
│   │   ├── structureController.js # 表结构管理控制器
│   │   └── sqlController.js    # SQL 执行控制器
│   ├── routes/                 # 路由目录
│   │   └── index.js           # 路由定义
│   └── utils/                  # 工具函数目录
│       ├── dbHelpers.js        # 数据库辅助函数
│       └── validation.js      # 数据验证函数
├── src/                        # 前端源代码
│   ├── main.jsx               # React 应用入口
│   ├── App.jsx                # 主应用组件
│   ├── App.css                # 应用全局样式
│   ├── index.css              # 基础样式
│   ├── services/              # API 服务层
│   │   └── api.js             # Axios 配置和 API 封装
│   ├── components/            # 组件目录
│   │   ├── common/           # 通用组件
│   │   │   ├── Icons.jsx     # 图标组件
│   │   │   ├── Loading.jsx   # 加载组件
│   │   │   ├── Modal.jsx     # 模态框组件
│   │   │   └── Toast.jsx     # 消息提示组件
│   │   ├── features/         # 功能组件
│   │   │   ├── DataTable.jsx # 数据表格组件
│   │   │   ├── DataForm.jsx  # 数据表单组件
│   │   │   ├── TableStructureViewer.jsx # 表结构查看器
│   │   │   ├── SQLExecutor.jsx # SQL 执行器
│   │   │   └── QueryResult.jsx # 查询结果展示
│   │   └── layout/           # 布局组件
│   │       ├── Header.jsx    # 顶部导航栏
│   │       └── Sidebar.jsx   # 侧边栏
│   └── assets/               # 静态资源
├── public/                    # 公共静态文件
├── package.json              # 前端依赖配置
├── vite.config.js            # Vite 配置（包含代理设置）
├── eslint.config.js          # ESLint 配置
└── README.md                 # 项目说明文档
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

# 代码检查
pnpm lint
```

### 后端开发

```bash
# 启动服务器（生产模式）
npm start

# 启动开发模式（自动重启）
npm run dev
```

### 环境要求

- **Node.js**: >= 16.0.0
- **MySQL**: >= 5.7 或 >= 8.0
- **pnpm**: >= 7.0.0（推荐）或 npm >= 8.0.0

## 安全特性

1. **SQL 注入防护**
   - 使用参数化查询（Prepared Statements）
   - 表名和列名验证和清理
   - SQL 执行器仅允许 SELECT 语句

2. **输入验证**
   - 表名格式验证
   - SQL 语句类型检查
   - 数据类型验证

3. **错误处理**
   - 统一的错误响应格式
   - 开发环境显示详细错误信息
   - 生产环境隐藏敏感错误信息

## 注意事项

### 数据库配置

- 确保 MySQL 服务已启动
- 确保数据库用户有足够的权限访问目标数据库
- 建议使用专用数据库用户，避免使用 root 账户
- 生产环境请修改默认密码

### 网络配置

- 如果遇到 CORS 错误，检查后端服务器的 CORS 配置
- 前端开发服务器通过 Vite 代理访问后端 API
- 生产环境需要配置反向代理（如 Nginx）

### 性能优化

- 数据分页查询，避免一次性加载大量数据
- 使用数据库连接池，提高并发性能
- 前端使用 React 组件优化，减少不必要的重渲染

### 常见问题

**Q: 无法连接到数据库？**

- 检查 MySQL 服务是否运行
- 验证 `server/config/db.js` 中的连接配置
- 检查防火墙设置

**Q: 前端无法访问后端 API？**

- 确保后端服务器运行在 `http://localhost:3001`
- 检查 Vite 代理配置是否正确
- 查看浏览器控制台的网络请求错误

**Q: SQL 执行失败？**

- 确认 SQL 语句是 SELECT 查询
- 检查表名和列名是否正确
- 查看后端控制台的错误日志

## 许可证

本项目仅供学习和开发使用。

## 更新日志

### v1.0.0

- 初始版本发布
- 支持基本的数据库查看和操作功能
- 支持表结构查看和 SQL 查询执行
