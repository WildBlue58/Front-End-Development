---
name: practice2-route-and-model
overview: 为项目引入 Vue Router 路由系统，保留 practice1 全部代码不变，新建 practice2 页面实现 GLB 模型加载、切换、动画控制、相机视角切换等 practice2.md 中的内容，并支持两个页面间的导航切换。
design:
  architecture:
    framework: vue
    component: tdesign
  styleKeywords:
    - Dark Tech
    - Glassmorphism
    - Deep Blue
    - Indigo Accent
  fontSystem:
    fontFamily: PingFang-SC
    heading:
      size: 18px
      weight: 600
    subheading:
      size: 14px
      weight: 500
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#42b883"
      - "#6366f1"
    background:
      - "#1a1a2e"
      - rgba(15, 15, 30, 0.9)
    text:
      - "#e2e8f0"
      - "#94a3b8"
    functional:
      - "#42b883"
      - "#f43f5e"
      - "#fbbf24"
todos:
  - id: install-router
    content: 安装 vue-router@4 依赖
    status: completed
  - id: create-router-config
    content: 创建路由配置 src/router/index.ts，定义 /practice1 和 /practice2 路由
    status: completed
    dependencies:
      - install-router
  - id: create-model-state
    content: 创建 src/composables/useModelState.ts，管理 Practice2 的模型选择、动画、相机等共享状态
    status: completed
  - id: create-pages
    content: 创建 Practice1Page.vue 和 Practice2Page.vue 页面组件
    status: completed
    dependencies:
      - create-router-config
  - id: create-model-components
    content: 创建 ModelViewer.vue、ModelScene.vue 和 ModelControlPanel.vue 组件，实现模型加载、动画控制和相机切换
    status: completed
    dependencies:
      - create-model-state
  - id: modify-app-main
    content: 改造 App.vue 为导航+router-view 布局，修改 main.ts 注册 router
    status: completed
    dependencies:
      - create-pages
---

## 产品概述

在现有的 Three.js 学习项目中，保留 Practice1 全部内容，引入路由系统创建 Practice2 新页面，实现 GLB 模型加载、双模型切换、动画控制和相机视角切换等功能，两个练习页面可通过导航自由切换。

## 核心功能

- **路由系统**：引入 vue-router，Practice1 和 Practice2 页面可自由切换
- **Practice1 保留**：现有所有组件和功能完整保留，用户可直观看到学习进程
- **GLB 模型加载**：使用 useGLTF + primitive 加载两个 GLB 模型（保时捷911 + 初音未来）
- **模型切换**：点击按钮在两个模型间切换
- **动画控制**：useAnimations 实现动画播放/暂停/切换/速度调节
- **相机视角预设**：正面/侧面/顶部/45度 等预设视角一键切换
- **控制面板**：TDesign 风格的右侧浮动面板，与 Practice1 风格一致
- **加载状态**：Suspense 处理异步加载，展示加载进度提示

## 技术栈

- **路由**：vue-router@4（需新增安装）
- **3D 框架**：@tresjs/core + @tresjs/cientos（已有）
- **UI 组件库**：tdesign-vue-next + tdesign-icons-vue-next（已有）
- **3D 引擎**：three（已有）
- **前端框架**：Vue 3 + TypeScript（已有）
- **构建工具**：Vite（已有）

## 实现方案

### 架构改造

1. **安装 vue-router@4**
2. **创建路由配置** `src/router/index.ts`：`/practice1` → Practice1Page，`/practice2` → Practice2Page，`/` 重定向到 `/practice1`
3. **App.vue 改造**：顶部导航栏 + `<router-view>` 替换原有直接引入组件的方式
4. **main.ts**：注册 router 插件

### 页面组件设计

- **Practice1Page.vue**：包装现有 SceneCanvas + ControlPanel，功能不变
- **Practice2Page.vue**：新的模型加载页面，包含：
- ModelScene 组件：3D 场景（TresCanvas + 模型渲染 + 光照 + OrbitControls）
- ModelControlPanel 组件：右侧控制面板（模型选择、动画控制、相机视角、模型信息）

### Practice2 核心逻辑

- **模型切换**：响应式变量 `currentModelPath`，切换时通过 `v-if` 重新挂载不同模型组件
- **动画控制**：useAnimations 获取 actions，fadeIn/fadeOut 实现平滑切换，mixer.update(delta) 驱动动画
- **相机视角**：预设配置数组，点击按钮后设置相机 position + lookAt
- **加载状态**：Suspense + fallback slot 显示加载提示

### 数据流

```
ModelControlPanel → 修改共享状态(useModelState) → ModelScene 响应式更新
                                     ↓
                              useGLTF 加载模型
                              useAnimations 控制动画
                              相机视角切换
```

## 实现注意事项

- **模型文件路径**：使用 `/models/xxx.glb` 绝对路径引用 public 目录下的文件
- **模型尺寸差异**：两个模型（保时捷 vs 初音未来）尺寸差异大，需为每个模型配置独立的 scale 和 camera position
- **内存管理**：切换模型时需清理旧模型的 geometry/material，避免内存泄漏；useGLTF 内部有缓存机制，相同路径不会重复加载
- **TresCanvas 上下文**：useLoop/useAnimations 等必须在 TresCanvas 子组件中使用，不能在页面根组件直接调用
- **路由模式**：使用 createWebHashHistory 避免部署时需要服务端配置 fallback
- **样式一致性**：Practice2 控制面板复用 Practice1 的深色毛玻璃风格

## 目录结构

```
src/
├── router/
│   └── index.ts              # [NEW] 路由配置，定义 /practice1 和 /practice2 两条路由
├── pages/
│   ├── Practice1Page.vue     # [NEW] Practice1 页面，包装现有 SceneCanvas + ControlPanel
│   └── Practice2Page.vue     # [NEW] Practice2 页面，3D模型加载与控制的主页面
├── components/
│   ├── SceneCanvas.vue       # [KEEP] 不修改
│   ├── ControlPanel.vue      # [KEEP] 不修改
│   ├── ShapeMesh.vue         # [KEEP] 不修改
│   ├── ...（其他6个组件）     # [KEEP] 不修改
│   ├── ModelScene.vue        # [NEW] Practice2 的3D场景组件，含 TresCanvas + 模型渲染 + 光照
│   ├── ModelViewer.vue       # [NEW] 单个模型渲染组件，useGLTF + useAnimations + primitive
│   └── ModelControlPanel.vue # [NEW] Practice2 的右侧控制面板，模型选择/动画/相机/信息
├── composables/
│   ├── useSceneState.ts      # [KEEP] 不修改
│   └── useModelState.ts      # [NEW] Practice2 共享状态：当前模型、动画状态、相机视角等
├── App.vue                   # [MODIFY] 改为顶部导航 + router-view 布局
├── main.ts                   # [MODIFY] 注册 vue-router 插件
├── style.css                 # [KEEP] 不修改
└── docs/
    ├── practice1.md           # [KEEP] 不修改
    └── practice2.md           # [KEEP] 不修改
```

## 设计风格

延续 Practice1 的深色科技风主题，新增顶部导航栏用于页面切换，Practice2 页面右侧控制面板与 Practice1 保持一致的毛玻璃效果。

## 页面规划

### 1. 顶部导航栏（全局）

- 固定在页面顶部，高度 48px，深色半透明背景 + 底部边框
- 左侧 Logo/标题文字，右侧两个 Tab 按钮切换 Practice1 / Practice2
- 使用 TDesign 的 Tab 组件，选中态为品牌绿色 #42b883
- 导航栏不遮挡 3D 场景，场景区域从导航栏下方开始

### 2. Practice2 页面布局

- 左侧：3D 场景区域（全屏铺满减去导航栏高度）
- 右侧：浮动控制面板（与 Practice1 一致的深色毛玻璃风格）
- 模型选择区：两个模型卡片按钮，显示模型名称，选中态高亮
- 动画控制区：动画列表按钮组 + 播放/暂停按钮 + 速度滑块
- 相机视角区：预设视角按钮组（正面/侧面/顶部/45度）
- 模型信息区：顶点数、面数、动画数量等信息展示
- 加载状态：居中显示旋转加载图标 + "模型加载中..." 文案

## 交互细节

- 页面切换时导航栏 Tab 平滑过渡
- 模型切换时有淡入淡出效果
- 控制面板按钮使用 TDesign 组件，与 Practice1 视觉统一
- 3D 场景支持 OrbitControls 鼠标交互

## MCP

- **Context7**
- Purpose: 查询 vue-router@4 和 @tresjs/cientos 最新 API 文档，确保路由配置和 useGLTF/useAnimations 用法准确
- Expected outcome: 获取 vue-router createWebHashHistory、useAnimations、useGLTF 的正确 API 签名和用法示例