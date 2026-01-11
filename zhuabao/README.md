# 学生成绩提取工具

一个基于 React + Node.js + Puppeteer 的学生成绩自动提取和分析工具，可以从教务系统自动提取平时分、期末考试分等成绩数据，并提供数据导出功能。

## 功能特性

- 自动提取成绩数据：从教务系统自动提取课程名称、平时分、期末分、总分等信息
- 智能数据解析：支持多种数据格式的自动识别和解析
- 实时数据刷新：支持手动刷新获取最新成绩
- 成绩统计分析：自动计算平均分、最高分、最低分、及格率等统计信息
- 数据导出功能：支持导出为 Excel (.xlsx) 和 CSV 格式
- 用户友好界面：现代化的 UI 设计，支持成绩排序和筛选
- 网络抓包技术：使用 Puppeteer 拦截和分析网络请求
- 反爬机制处理：实现随机延迟、User-Agent 轮换等策略

## 技术栈

### 前端
- React 19.1.0
- Vite 6.3.5
- Tailwind CSS 3.4.16
- Axios 1.6.2

### 后端
- Node.js
- Express 4.18.2
- Puppeteer 21.6.1
- Cheerio 1.0.0-rc.12
- XLSX 0.18.5
- CSV-Writer 1.6.0

## 项目结构

```
zhuabao/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── controllers/
│   │   │   └── gradeController.js  # 成绩控制器
│   │   ├── services/
│   │   │   ├── puppeteerService.js # Puppeteer服务
│   │   │   └── gradeParser.js      # 数据解析服务
│   │   ├── routes/
│   │   │   └── index.js            # 路由配置
│   │   └── index.js                # 服务器入口
│   └── package.json
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── components/
│   │   │   ├── GradeTable.jsx      # 成绩表格组件
│   │   │   └── ExportButton.jsx    # 导出按钮组件
│   │   ├── services/
│   │   │   └── gradeAPI.js         # 成绩API调用
│   │   ├── App.jsx                 # 主应用
│   │   ├── main.jsx                # 入口文件
│   │   └── index.css               # 样式文件
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md                  # 使用说明文档
```

## 安装步骤

### 前置要求

- Node.js 18.0 或更高版本
- npm 或 pnpm 包管理器
- Chrome 或 Chromium 浏览器（Puppeteer 会自动下载）

### 1. 克隆或下载项目

```bash
cd d:\lesson_zp\zhuabao
```

### 2. 安装后端依赖

```bash
cd backend
npm install
```

### 3. 安装前端依赖

```bash
cd ../frontend
npm install
```

## 使用说明

### 启动后端服务

在 `backend` 目录下运行：

```bash
npm start
```

或使用开发模式（支持热重载）：

```bash
npm run dev
```

后端服务将在 `http://localhost:3002` 启动。

### 启动前端应用

在 `frontend` 目录下运行：

```bash
npm run dev
```

前端应用将在 `http://localhost:3000` 启动。

### 使用工具

1. 打开浏览器访问 `http://localhost:3000`

2. 点击"提取成绩"按钮，工具将自动：
   - 启动无头浏览器
   - 访问目标教务系统网站
   - 拦截网络请求
   - 提取成绩数据
   - 解析并展示成绩信息

3. 查看成绩表格：
   - 表格显示每门课程的平时分、期末分、总分等信息
   - 点击表头可以按对应字段排序
   - 成绩根据分数高低显示不同颜色（90+ 绿色，80+ 蓝色，70+ 黄色，60+ 橙色，<60 红色）

4. 查看统计信息：
   - 总课程数
   - 平均平时分、期末分、总分
   - 最高分、最低分
   - 及格课程数

5. 刷新成绩：
   - 点击"刷新成绩"按钮可以获取最新成绩数据
   - 适用于成绩更新后的重新获取

6. 导出数据：
   - 点击"导出成绩"按钮
   - 选择"导出为 Excel"或"导出为 CSV"
   - 文件将自动下载到本地

7. 关闭浏览器：
   - 点击"关闭浏览器"按钮释放资源

## API 接口文档

### 提取成绩
```
GET /api/grades/extract
```
从教务系统提取成绩数据

### 刷新成绩
```
GET /api/grades/refresh
```
刷新当前成绩数据

### 获取当前成绩
```
GET /api/grades/current
```
获取已提取的成绩数据

### 导出 Excel
```
GET /api/grades/export/excel
```
导出成绩为 Excel 格式

### 导出 CSV
```
GET /api/grades/export/csv
```
导出成绩为 CSV 格式

### 获取状态
```
GET /api/grades/status
```
获取浏览器和成绩数据状态

### 关闭浏览器
```
POST /api/grades/close
```
关闭浏览器并释放资源

## 注意事项

1. **登录状态**：请确保在浏览器中已登录教务系统，否则可能无法获取成绩数据

2. **网络连接**：确保网络连接正常，能够访问目标教务系统网站

3. **请求频率**：避免频繁刷新，以免对教务系统造成过大压力

4. **数据准确性**：工具会尽力解析成绩数据，但不同学校系统的数据格式可能不同，可能需要调整解析规则

5. **浏览器资源**：使用完毕后请点击"关闭浏览器"按钮释放系统资源

6. **隐私保护**：工具仅在本地运行，不会上传任何个人数据

## 故障排除

### 提取失败

- 检查后端服务是否正常运行
- 检查网络连接是否正常
- 确认是否已登录教务系统
- 查看后端控制台错误信息

### 导出失败

- 检查是否有成绩数据
- 确认浏览器允许文件下载
- 查看浏览器控制台错误信息

### 浏览器无法启动

- 检查是否安装了 Chrome 或 Chromium
- 尝试重新安装 Puppeteer：`npm install puppeteer`
- 检查系统防火墙设置

## 开发说明

### 后端开发

后端使用 Express 框架，主要模块：

- `puppeteerService.js`：负责浏览器自动化和网络请求拦截
- `gradeParser.js`：负责成绩数据的解析和提取
- `gradeController.js`：负责处理 API 请求

### 前端开发

前端使用 React + Vite，主要组件：

- `GradeTable.jsx`：成绩表格展示组件
- `ExportButton.jsx`：数据导出组件
- `App.jsx`：主应用组件

### 自定义解析规则

如需适配其他学校的教务系统，可以修改 `gradeParser.js` 中的解析规则：

```javascript
this.gradePatterns = {
  regularScore: ['平时', '平时分', '平时成绩'],  // 平时分关键词
  finalScore: ['期末', '期末分', '期末成绩'],    // 期末分关键词
  totalScore: ['总评', '总分', '总成绩']         // 总分关键词
};
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过 Issue 联系。
