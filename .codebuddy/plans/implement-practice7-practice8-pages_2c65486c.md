---
name: implement-practice7-practice8-pages
overview: 为 `practice7` 和 `practice8` 补齐页面实现，沿用 `practice5/6` 的页面架构，覆盖各自文档中的验证清单与扩展练习功能，并复用仓库现有模型、贴图与 Sketchfab 组件。
design:
  architecture:
    framework: vue
  styleKeywords:
    - Glassmorphism
    - Tech Lab
    - Premium Product Showcase
    - Dark Neon Accent
    - Responsive Floating Panels
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 32px
      weight: 600
    subheading:
      size: 18px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#38BDF8"
      - "#6366F1"
      - "#F59E0B"
    background:
      - "#020617"
      - "#0F172A"
      - "#111827"
    text:
      - "#F8FAFC"
      - "#CBD5E1"
      - "#94A3B8"
    functional:
      - "#22C55E"
      - "#EF4444"
      - "#F59E0B"
      - "#38BDF8"
todos:
  - id: wire-day7-day8-entry
    content: 使用 [subagent:code-explorer] 复核模式并新增 Day7/8 路由导航
    status: completed
  - id: build-practice7-state-shell
    content: 新建 Day7 状态仓库与页面壳，接入资源版本和校验数据
    status: completed
    dependencies:
      - wire-day7-day8-entry
  - id: deliver-practice7-lab
    content: 实现 Day7 场景、审计面板与 HUD，覆盖验证清单和扩展功能
    status: completed
    dependencies:
      - build-practice7-state-shell
  - id: build-practice8-state-shell
    content: 新建 Day8 状态仓库与页面壳，接入产品配置、热点和机位数据
    status: completed
    dependencies:
      - wire-day7-day8-entry
  - id: deliver-practice8-showcase
    content: 实现 Day8 场景、配置面板与 HUD，复用 Sketchfab 和后处理
    status: completed
    dependencies:
      - build-practice8-state-shell
  - id: polish-day7-day8-ui
    content: 使用 [skill:frontend-design] 统一双页响应式布局并完成静态检查
    status: completed
    dependencies:
      - deliver-practice7-lab
      - deliver-practice8-showcase
---

## User Requirements

- 在现有 `practice-day1` 项目中补齐 `practice7` 与 `practice8` 的真实页面实现，并接入可访问路由与顶部导航。
- `practice7` 页面要落地“资产管线实验台”，覆盖文档里的验证清单，并把扩展练习中的核心能力做成可操作功能。
- `practice8` 页面要落地“综合产品展示页”，覆盖文档里的验证清单，并把扩展练习中的热点、机位、后处理、降级策略、方案对比等能力接入页面。
- 视觉上需延续 Day 5/6 的深色实验室风格与悬浮面板布局，保证主视区、控制面板、HUD、说明卡之间层次清晰、响应式稳定。

## Product Overview

- `practice7` 是偏工程验证的资源实验页：主视区展示模型加载与观察，右侧完成资源版本、预检、元数据、动画与发布清单管理，左下 HUD 反馈状态、进度、路径与错误。
- `practice8` 是偏展示交付的综合页面：顶部有项目简介与模式切换，中间是本地渲染或 Sketchfab 视区，右侧是产品配置与方案成本，底部有方案说明，左下 HUD 持续同步当前状态。

## Core Features

- `practice7`：资源版本切换、加载进度与错误反馈、节点/材质/贴图/动画预检、命名校验、贴图策略对照、动画控制、发布清单映射。
- `practice8`：本地渲染与 Sketchfab 双模式、版本与颜色联动、热点讲解、机位预设、自动旋转、线框与质感增强、移动端降级、方案成本对比。
- 两页都要能覆盖文档中的验证清单项，并把扩展练习变成页面内可见、可交互、可验证的功能模块。

## Tech Stack Selection

- 现有前端框架：Vue 3 单文件组件
- 语言：TypeScript
- 路由：Vue Router（Hash 模式）
- 3D 渲染：Three.js、`@tresjs/core`、`@tresjs/cientos`
- 已确认可复用能力：
- 页面壳模式：`src/pages/Practice5Page.vue`、`src/pages/Practice6Page.vue`
- 状态仓库模式：`src/composables/useInteractiveSceneState.ts`、`src/composables/usePerformanceSceneState.ts`
- Sketchfab 备用模式：`src/components/practice2/SketchfabViewer.vue`
- 贴图对照思路：`src/components/practice6/TextureCompressionProbe.vue`
- 已确认可复用资源：
- `public/models/2014_porsche_911_turbo_991.glb`
- `public/models/2014_porsche_911_turbo_991/scene.gltf`
- `public/models/hatsune_miku_lbx_ver_yuki_custom__redesign.glb`
- `public/textures/practice6/lab-original.svg`
- `public/textures/practice6/lab-compressed.svg`

## Implementation Approach

- 沿用 Day 5/6 的“页面壳 + 场景组件 + 控制面板 + HUD + composable”结构，不做跨天大重构，优先复用已验证的布局、状态与资源释放模式。
- `practice7` 以现有 Porsche 资源实现“原始目录版 / 发布单文件版 / 压缩策略对照”的等价实验台：用 `scene.gltf` 对应原始版、`2014_porsche_911_turbo_991.glb` 对应发布版，再结合 Day 6 的原图/压缩图对照完成贴图策略覆盖；若没有真实 `draco/meshopt` 二进制，则在 UI 中明确标注为“压缩策略模拟/发布版对照”，避免伪造资源事实。
- `practice8` 以 Porsche GLB 作为产品展示主角，复用 Day 2 的 `SketchfabViewer` 作为备用模式，使用 Day 6 的后处理与降级思路，接入产品变体、热点、机位预设与方案成本卡。
- 性能与可靠性：模型遍历、节点统计、命名校验等操作只在模型加载后或切换版本时执行，复杂度控制在单次 `O(n)` 遍历；渲染循环仅保留旋转、热点高亮和必要动画；Sketchfab 使用 `v-show` 保活以避免重复初始化；所有 Three.js 资源、纹理、动画混合器、后处理对象在卸载时显式释放。
- 避免技术债：不抽离通用 3D 基类，不改动 Day 1-6 既有功能；仅在 Day 7/8 内部复用现有模式，必要时通过各自 composable 维护单一数据源。

## Implementation Notes

- `practice7` 的错误路径测试、动画为空兜底、命名校验与发布清单都要成为页面状态的一部分，而不是只写静态文案。
- `practice8` 的后处理只在本地渲染模式启用；移动端降级应自动关闭高成本效果或降低像素比，并给出明确状态提示。
- 热点系统优先基于实际模型节点名匹配；若个别节点不存在，需提供安全回退文案，避免页面报错。
- 控制影响范围：只新增 Day 7/8 页面、组件、状态文件，并修改 `App.vue` 与 `router/index.ts`；不改旧文档与旧页面逻辑。

## Architecture Design

- 页面层：
- `Practice7Page.vue`、`Practice8Page.vue` 负责组装布局与浮层避让。
- 状态层：
- `useAssetPipelineState.ts` 统一管理资源版本、加载状态、检查项、元数据、动画控制。
- `useProductShowcaseState.ts` 统一管理渲染模式、变体、颜色、热点、机位、降级与方案说明。
- 表现层：
- Day 7：场景组件负责加载与统计，控制面板负责预检与切换，HUD 负责状态反馈。
- Day 8：场景组件负责本地渲染/Sketchfab 切换、热点和后处理，控制面板负责产品配置与成本展示，HUD 负责实时状态。

## Directory Structure

### Directory Structure Summary

本次实现将新增 Day 7 / Day 8 页面模块，并修改导航与路由入口，保持与 Day 5 / Day 6 相同的模块边界。

- `d:/lesson_zp/threejs/practice-day1/src/App.vue` [MODIFY]  
扩充顶部导航，加入 Day 7 / Day 8 入口；保持现有导航滚动与激活态模式。

- `d:/lesson_zp/threejs/practice-day1/src/router/index.ts` [MODIFY]  
新增 `/practice7`、`/practice8` 路由，标题文案与现有 Day 1-6 保持一致。

- `d:/lesson_zp/threejs/practice-day1/src/pages/Practice7Page.vue` [NEW]  
Day 7 页面壳。负责说明卡、场景、控制面板、HUD 的组装与浮层高度避让。

- `d:/lesson_zp/threejs/practice-day1/src/composables/useAssetPipelineState.ts` [NEW]  
Day 7 共享状态。保存资源版本映射、加载状态、错误信息、预检结果、动画控制、元数据与发布清单。

- `d:/lesson_zp/threejs/practice-day1/src/components/practice7/AssetPipelineScene.vue` [NEW]  
Day 7 场景主组件。负责模型加载、`scene.gltf / glb` 版本切换、进度统计、节点遍历、动画混合器、贴图策略对照与资源释放。

- `d:/lesson_zp/threejs/practice-day1/src/components/practice7/AssetPipelineControlPanel.vue` [NEW]  
Day 7 控制面板。负责资源版本切换、路径错误测试、预检预算、命名校验、动画控制、缩略图/元数据与发布清单展示。

- `d:/lesson_zp/threejs/practice-day1/src/components/practice7/AssetPipelineHud.vue` [NEW]  
Day 7 HUD。展示状态、进度、当前路径、错误、活跃版本与关键校验结论。

- `d:/lesson_zp/threejs/practice-day1/src/pages/Practice8Page.vue` [NEW]  
Day 8 页面壳。负责头部简介、主视区、控制面板、HUD 与方案说明区布局。

- `d:/lesson_zp/threejs/practice-day1/src/composables/useProductShowcaseState.ts` [NEW]  
Day 8 共享状态。管理本地/Sketchfab 模式、变体、颜色、热点、机位预设、后处理开关、移动端降级与成本表数据。

- `d:/lesson_zp/threejs/practice-day1/src/components/practice8/ProductShowcaseScene.vue` [NEW]  
Day 8 场景主组件。负责 Porsche 模型渲染、热点拾取、机位切换、本地后处理、移动端降级与 Sketchfab 备用模式切换。

- `d:/lesson_zp/threejs/practice-day1/src/components/practice8/ProductConfigPanel.vue` [NEW]  
Day 8 配置面板。负责变体、颜色、自动旋转、线框、质感增强、机位预设、方案成本表与资源元数据区。

- `d:/lesson_zp/threejs/practice-day1/src/components/practice8/ProductShowcaseHud.vue` [NEW]  
Day 8 HUD。负责 `Mode / Variant / Color / Bloom / Focus` 状态展示与热点反馈。

- `d:/lesson_zp/threejs/practice-day1/src/components/practice8/SolutionCompareCard.vue` [NEW]  
Day 8 方案说明卡。展示纯 Web、Unity WebGL、Unreal Pixel Streaming 的成本收益对照与当前结论。

## Design Approach

整体延续现有练习项目的深色科技实验室风格，但区分两页气质：

- `practice7` 采用“资产审计台”视觉，主视区偏工程验证，右侧面板信息密集但分组清晰，HUD 更强调状态、路径与错误可读性。
- `practice8` 采用“产品展示页”视觉，主视区更突出产品与灯光层次，顶部简介更像落地页 Hero，底部方案卡强调专业说明感。

## Page Planning

### Practice7

- 顶部说明卡：解释当前资源版本、验证目标与实验重点。
- 中央主视区：模型、地面、灯光、纹理对照探针与可拖拽视角。
- 右侧审计面板：版本切换、预检、命名校验、动画控制、元数据、发布清单。
- 左下 HUD：状态、进度、路径、错误、当前策略摘要。

### Practice8

- 顶部 Hero：项目简介、模式切换、当前方案一句话结论。
- 中央展示区：本地渲染或 Sketchfab 视图，机位切换与热点反馈围绕主模型组织。
- 右侧配置面板：版本、颜色、显示策略、降级状态、成本对比。
- 左下 HUD：模式、变体、颜色、Bloom、焦点部件。
- 底部方案卡：路线对比与当前取舍说明。

## Agent Extensions

- **code-explorer**
- Purpose: 复核 Day 5/6 页面壳、Sketchfab 复用方式、资源路径与可用模型节点，确保 Day 7/8 改动点与资源映射准确。
- Expected outcome: 得到可靠的文件修改边界、复用链路与资源落地方案，避免虚构路径或 API。

- **frontend-design**
- Purpose: 统一 Day 7 资产实验台与 Day 8 展示页的浮层布局、信息层级与响应式视觉语言。
- Expected outcome: 产出与现有深色玻璃质感一致、层级清晰、桌面端体验稳定的新页面 UI。