---
name: practice5-page-and-checklist
overview: 为 `practice-day1` 新增与 Day 5 文档内容一致的 `practice5` 页面，并同步完善 `practice5.md` 的“验证清单”，先形成完整执行计划，暂不直接修改代码。
design:
  architecture:
    framework: vue
    component: tdesign
  styleKeywords:
    - 深色科技实验台
    - Glassmorphism
    - 高对比灯光层次
    - 悬浮控制面板
    - 状态可视化 HUD
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 16px
      weight: 600
    subheading:
      size: 13px
      weight: 600
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#42B883"
      - "#38BDF8"
      - "#F59E0B"
    background:
      - "#08111F"
      - "#070C1C"
      - "#020617"
    text:
      - "#E2E8F0"
      - "#CBD5E1"
      - "#DBEAFE"
    functional:
      - "#86EFAC"
      - "#7DD3FC"
      - "#EF4444"
      - "#F59E0B"
todos:
  - id: audit-practice5-architecture
    content: 使用 [subagent:code-explorer] 复核 Day5 架构边界与复用点
    status: completed
  - id: build-practice5-state
    content: 实现 `useInteractiveSceneState.ts` 统一管理交互状态
    status: completed
    dependencies:
      - audit-practice5-architecture
  - id: build-practice5-components
    content: 使用 [skill:frontend-design] 完成 Day5 场景、主物体、HUD、控制面板
    status: completed
    dependencies:
      - build-practice5-state
  - id: wire-practice5-entry
    content: 新增 `Practice5Page.vue` 并接入路由与顶部导航
    status: completed
    dependencies:
      - build-practice5-components
  - id: rewrite-practice5-checklist
    content: 重写 `practice5.md` 验证清单对齐真实交互验收
    status: completed
    dependencies:
      - wire-practice5-entry
  - id: validate-practice5-page
    content: 校验 Day5 联动表现、类型检查与构建结果
    status: completed
    dependencies:
      - rewrite-practice5-checklist
---

## User Requirements

- 基于 `d:/lesson_zp/threejs/practice-day1/src/docs/practice5.md` 的正文内容，新开一个真实可访问的 Day 5 页面，而不是只保留文档示例。
- 页面效果要与文档描述一致：包含主交互物体、地面、参照球、右侧控制面板、左下角状态 HUD，并支持悬停、点击选中、参数调节与自动旋转。
- 同时补全 `practice5.md` 第 848-860 行“验证清单”，让其与最终页面的真实行为逐项对应，便于读者操作验收。
- 当前阶段只输出完整详尽的执行计划，不提前修改代码或文档。

## Product Overview

这是一个 Day 5 的交互练习页：主视区展示一个可被鼠标悬停和点击的立方体，场景中还包含地面和参照球；右侧提供参数控制面板，左下角显示当前悬停对象、选中状态和交互次数。整体视觉应延续现有练习页的深色实验场风格，页面以“操作面板驱动场景、场景反馈同步 HUD”为核心体验。

## Core Features

- 新增 Day 5 页面入口，并纳入现有练习导航体系
- 实现主物体的悬停高亮、点击选中、取消选中与选中后自动旋转
- 实现位置、旋转、缩放、颜色、金属度、粗糙度、线框模式等控制项
- 用统一状态源同步驱动场景、控制面板和 HUD 信息
- 将验证清单改写为与页面实际表现严格对应的可勾选验收项

## Tech Stack Selection

已确认当前项目采用并应继续复用以下技术与约定：

- 前端框架：Vue 3 + TypeScript
- 路由：Vue Router（Hash 模式）
- 3D 场景：Three.js + `@tresjs/core` + `@tresjs/cientos`
- UI 基础：项目已全局注册 `tdesign-vue-next`，但现有 Practice3 / Practice4 页面主要使用自定义深色浮层样式
- 项目结构：`pages/PracticeXPage.vue` + `components/practiceX/` + `composables/useXState.ts`

## Implementation Approach

### 整体策略

将 `practice5.md` 中“临时替换 `src/App.vue` 的单文件 Demo”重构为符合现有项目架构的 Day 5 页面：页面壳只负责组装，场景、交互物体、HUD、控制面板分别拆分到 `components/practice5/`，共享状态统一收敛到 `useInteractiveSceneState.ts`。

### 核心实现方式

1. **单一状态源**

- 在 `src/composables/useInteractiveSceneState.ts` 统一管理：
    - `modelState`：位置、旋转、缩放、颜色、金属度、粗糙度、线框
    - `hoveredObject` / `selectedObject`
    - `autoRotate` / `interactionCount`
    - 派生值：`isHovered`、`isSelected`、`displayColor`、`statusText`
- 这样控制面板、场景组件、HUD 都读取同一份数据，避免显示不一致。

2. **组件拆分**

- `Practice5Page.vue`：页面壳，组合场景、面板、HUD
- `InteractiveScene.vue`：搭建 `TresCanvas`、相机、轨道控制、灯光、地面、参照球，并挂载主交互物体
- `InteractiveMesh.vue`：主立方体与交互逻辑，负责 hover / click / emissive 高亮 / 选中旋转
- `SceneHud.vue`：左下角状态面板
- `InteractionControlPanel.vue`：右侧参数控制台

3. **交互实现优先级**

- 优先使用文档中已经说明的 Tres Pointer 事件：
    - `@pointer-enter`
    - `@pointer-leave`
    - `@click`
- 不额外引入手写全局 Raycaster，除非实现过程中发现现有事件链不足。

4. **与现有工程模式对齐**

- 页面入口加入 `src/router/index.ts`
- 顶部导航加入 `src/App.vue`
- 保持 Day1-Day4 不受影响，不做无关重构

### 性能与可靠性

- 当前场景仅包含 1 个主交互物体 + 1 个地面 + 1 个参照球，渲染与交互复杂度可视为 **O(1)**。
- 自动旋转仅在“已选中且开启自动旋转”时更新，避免每帧无意义写入。
- 派生显示使用 `computed`，避免把高亮色、提示文案维护成多份状态。
- 避免深层 `watch`；只对确实有副作用的状态使用 `watch`。
- 光标样式在 `pointer-leave` 与组件卸载时恢复，防止页面状态残留。

### 避免技术债

- 不把 Day 5 示例直接写回 `App.vue`
- 不复刻一份与现有 Practice 架构冲突的“单文件大组件”
- 不引入新的状态管理方案，沿用已有 composable 共享状态模式
- 不为了一个练习页重构路由、全局样式或前四天组件

## Implementation Notes

- 已验证现有项目的页面模式为“页面壳 + 场景组件 + 控制面板 + composable 状态”；Day 5 应严格复用这一结构。
- 由于 Tres 上下文相关能力依赖 Canvas 后代，渲染循环逻辑应放在 `InteractiveMesh.vue` 这类 `TresCanvas` 后代组件中，而不是放在页面壳组件里。
- 视觉风格应延续 Practice3 / Practice4 的深色毛玻璃浮层，不要突然切换为完全不同的 UI 体系。
- `practice5.md` 的验证清单需要在页面行为确定后再补全，确保文档与真实交互严格一致。
- 仅修改新增 Day 5 所需文件，控制 blast radius，避免影响 Practice1-4 的现有体验。

## Architecture Design

### 组件关系

- `Practice5Page.vue`
- `InteractiveScene.vue`
    - `InteractiveMesh.vue`
- `InteractionControlPanel.vue`
- `SceneHud.vue`

### 数据流

- 控制面板修改共享状态
- 场景组件读取状态并更新物体变换/材质
- 主物体交互事件反向更新共享状态
- HUD 与控制台同步显示最新结果

### 模块职责

- **页面层**：负责组装，不承载具体交互逻辑
- **场景层**：负责 3D 画布、灯光、相机与静态参照物
- **交互对象层**：负责拾取、高亮、选中、自动旋转
- **状态层**：负责交互状态、派生状态、共享读写
- **文档层**：负责将验证清单和落地页面保持一致

## Directory Structure

### Directory Structure Summary

本次实现将在现有 `practice-day1` 项目中新增 Day 5 页面及其组件，并同步补完 Day 5 文档中的验证清单。除路由和顶部导航外，其余变更都应隔离在 `practice5` 相关目录中。

```text
d:/lesson_zp/threejs/practice-day1/src/
├── composables/
│   └── useInteractiveSceneState.ts
├── components/
│   └── practice5/
│       ├── InteractiveScene.vue
│       ├── InteractiveMesh.vue
│       ├── InteractionControlPanel.vue
│       └── SceneHud.vue
├── pages/
│   └── Practice5Page.vue
├── router/
│   └── index.ts
├── App.vue
└── docs/
    └── practice5.md
```

### Affected Files

- `d:/lesson_zp/threejs/practice-day1/src/composables/useInteractiveSceneState.ts`  `[NEW]`
- **Purpose**：Day 5 共享状态中心
- **Functionality**：集中管理模型参数、hover/selected 状态、自动旋转、交互计数与派生显示值
- **Implementation requirements**：保持 API 清晰，供场景、HUD、控制面板直接复用；避免不必要深监听

- `d:/lesson_zp/threejs/practice-day1/src/components/practice5/InteractiveScene.vue`  `[NEW]`
- **Purpose**：Day 5 场景装配组件
- **Functionality**：创建画布、相机、轨道控制、灯光、地面、参照球，并挂载主交互物体
- **Implementation requirements**：只承载场景结构，不把面板状态逻辑堆进此文件

- `d:/lesson_zp/threejs/practice-day1/src/components/practice5/InteractiveMesh.vue`  `[NEW]`
- **Purpose**：主交互立方体组件
- **Functionality**：处理 hover、click、选中高亮、自动旋转、材质参数绑定
- **Implementation requirements**：在 Canvas 后代中使用渲染循环；交互事件与状态仓库保持单向清晰映射

- `d:/lesson_zp/threejs/practice-day1/src/components/practice5/InteractionControlPanel.vue`  `[NEW]`
- **Purpose**：右侧参数控制面板
- **Functionality**：提供位置、旋转、缩放、颜色、金属度、粗糙度、线框、自动旋转等操作入口
- **Implementation requirements**：延续现有深色毛玻璃风格；控件分组明确；值展示与实际绑定一致

- `d:/lesson_zp/threejs/practice-day1/src/components/practice5/SceneHud.vue`  `[NEW]`
- **Purpose**：左下角状态展示面板
- **Functionality**：展示 hovered、selected、交互次数、当前显示颜色、提示文案
- **Implementation requirements**：只做展示，不复制状态；内容与场景交互实时同步

- `d:/lesson_zp/threejs/practice-day1/src/pages/Practice5Page.vue`  `[NEW]`
- **Purpose**：Day 5 页面壳
- **Functionality**：组合 `InteractiveScene`、`InteractionControlPanel`、`SceneHud`
- **Implementation requirements**：保持与 `Practice3Page.vue` / `Practice4Page.vue` 一致的页面职责边界

- `d:/lesson_zp/threejs/practice-day1/src/router/index.ts`  `[MODIFY]`
- **Purpose**：注册 Day 5 页面路由
- **Functionality**：新增 `/practice5` 页面入口与标题元信息
- **Implementation requirements**：不影响现有 Hash 路由逻辑与默认重定向

- `d:/lesson_zp/threejs/practice-day1/src/App.vue`  `[MODIFY]`
- **Purpose**：扩展顶部练习导航
- **Functionality**：新增 Day 5 标签入口
- **Implementation requirements**：保持现有导航结构、样式与激活态逻辑一致

- `d:/lesson_zp/threejs/practice-day1/src/docs/practice5.md`  `[MODIFY]`
- **Purpose**：补完 Day 5 验证清单
- **Functionality**：将第 848-860 行改写成与真实页面完全对应的可勾选验收项
- **Implementation requirements**：只增强验证清单，不改动无关章节结构和讲义风格

## Design Approach

Day 5 页面应延续现有 Practice3 / Practice4 的视觉语境：全屏深色 3D 视口作为主舞台，右侧悬浮控制面板承担参数调节，左下角 HUD 负责状态反馈。整体以“技术实验台”风格为主，强调清晰分区、可读性和实时反馈，而不是做花哨但干扰操作的界面。

## Page Composition

- 顶部：沿用现有全局导航，不改布局体系
- 主视口：深色背景中的交互立方体、地面、参照球，强调空间层次与灯光对比
- 右侧面板：分组展示 Position / Material / Transform / Toggles，支持快速扫视与连续调参
- 左下 HUD：展示悬停对象、选中对象、交互次数、当前颜色，强化“状态已同步”的反馈感

## Interaction Notes

- 悬停时主物体颜色和发光应立刻变化，光标改为可点击状态
- 选中时 HUD 与提示文案同步变化，并让自动旋转显得明确可感知
- 面板输入、场景反馈、HUD 展示必须保持同节奏更新，不出现延迟或信息不一致

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 继续核对 Day 5 组件拆分、路由接入点与现有 Practice 页面复用模式
- Expected outcome: 产出准确的受影响文件清单与可复用实现边界，避免偏离现有架构

### Skill

- **frontend-design**
- Purpose: 为 Day 5 控制面板与 HUD 延续现有深色毛玻璃实验台风格，提升可读性与层级感
- Expected outcome: 新页面在视觉上与 Practice3 / Practice4 保持统一，同时让交互反馈更清晰