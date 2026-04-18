---
name: unify-practice-control-panels-with-practice5
overview: 将 `practice1` 到 `practice4` 的操作控制台视觉统一到 `practice5` 当前这套控制台风格，同时尽量保留各自原有交互结构与功能不变。
design:
  architecture:
    framework: vue
    component: tdesign
  styleKeywords:
    - 深色科技实验台
    - Glassmorphism
    - 青蓝发光点缀
    - 大圆角控制面板
    - 高密度参数卡片
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 13px
      weight: 600
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#38BDF8"
      - "#67E8F9"
      - "#42B883"
    background:
      - "#070C1C"
      - "#0F172A"
      - "#020617"
    text:
      - "#F8FAFC"
      - "#E2E8F0"
      - "#94A3B8"
    functional:
      - "#A5F3FC"
      - "#86EFAC"
      - "#F59E0B"
      - "#EF4444"
todos:
  - id: audit-panel-scope
    content: 使用 [subagent:code-explorer] 复核 Practice1-4 控制台差异与公共抽取点
    status: completed
  - id: extract-shared-panel-theme
    content: 在 `src/style.css` 抽取共享控制台壳层与分区主题类
    status: completed
    dependencies:
      - audit-panel-scope
  - id: unify-practice1-panel
    content: 重构 `practice1` 面板壳和六个子控件视觉
    status: completed
    dependencies:
      - extract-shared-panel-theme
  - id: unify-practice2-4-panels
    content: 使用 [skill:frontend-design] 统一 `practice2-4` 控制台卡片与表单样式
    status: completed
    dependencies:
      - extract-shared-panel-theme
  - id: validate-panel-consistency
    content: 校验四页窄屏滚动、激活态和视觉一致性
    status: completed
    dependencies:
      - unify-practice1-panel
      - unify-practice2-4-panels
---

## User Requirements

基于当前 `practice5` 的操作控制台视觉效果，将 `practice1`、`practice2`、`practice3`、`practice4` 四个页面的操作控制台样式统一到同一套风格。范围只包含控制台相关区域，包括外层面板、标题区、分组卡片、按钮、滑杆、开关、色板、状态信息、滚动区域和局部提示文案；不修改 3D 场景内容、业务逻辑和交互功能。

## Product Overview

统一后的控制台应延续 `practice5` 的深色科技实验台观感：大圆角玻璃面板、青蓝色发光点缀、清晰的标题层级、独立分组卡片、亮色数值反馈和较弱说明文字。四个练习页在视觉上应明显属于同一系列，同时保留各自原有内容结构和信息密度。

## Core Features

- 统一 `practice1-4` 控制台外壳、标题区、分区卡片和滚动条样式
- 统一按钮、滑杆、开关、色板、预设卡、列表项和状态卡的视觉语言
- 保留每个页面原有功能、字段、交互行为和信息层级
- 处理 `practice1` 中 TDesign 控件的深色皮肤覆盖，使其观感接近 `practice5`
- 保证桌面和较窄窗口下控制台的尺寸、滚动和可读性一致

## Tech Stack Selection

- 前端框架：Vue 3 + TypeScript
- 路由：Vue Router
- 3D 场景：Three.js + `@tresjs/core` + `@tresjs/cientos`
- UI 现状：`practice1` 使用 `tdesign-vue-next`，`practice2-5` 主要为自定义样式
- 全局样式入口：`d:/lesson_zp/threejs/practice-day1/src/style.css`

## Implementation Approach

采用“共享控制台皮肤 + 各页轻量适配”的方案：把 `practice5/InteractionControlPanel.vue` 的视觉语汇提炼为一组前缀化公共样式，集中放到现有 `src/style.css`；`practice1-4` 的控制台组件只调整结构类名、局部层级和必要的控件覆盖，不改动原有状态绑定、事件逻辑和页面布局链路。

关键技术决策如下：

- 以 `practice5` 为唯一视觉基线，避免 `practice2/3/4` 互相折中导致风格继续分裂。
- 公共外壳、标题、分区卡片、滚动条、基础按钮与滑杆视觉优先下沉到 `src/style.css`，减少多文件重复 CSS。
- `practice1` 的 TDesign 控件继续在对应 SFC 内使用 `:deep()` 做局部覆盖，因为库内部结构需要组件级控制，直接放到全局样式不稳定。
- `practice4` 当前已接近目标风格，优先做细节对齐；`practice2`、`practice3` 迁移幅度更大；`practice1` 需要同时处理面板壳和 6 个子控件。

性能与可靠性：

- 本次改动以样式和少量模板结构微调为主，运行时复杂度可视为 O(1)，不会引入额外渲染循环、监听器或状态同步成本。
- 通过前缀化公共类控制样式作用域，降低对场景组件和其他页面的污染风险。
- 保持现有 composable、事件处理、路由和场景组件不变，最大限度控制回归面。

## Implementation Notes

- 优先复用 `d:/lesson_zp/threejs/practice-day1/src/components/practice5/InteractionControlPanel.vue` 中已经验证过的间距、圆角、边框、阴影、滑杆和发光色值。
- `practice1` 的 TDesign 覆盖应集中在 `ControlPanel.vue` 与各 `controls/*.vue` 内，避免把库内部选择器散落到无关文件。
- `practice2` 与 `practice3` 要保留现有内容结构，只替换视觉语汇，不重写功能块顺序和交互逻辑。
- `practice4` 仅做 header、section、按钮状态、滚动与响应式细节统一，避免无意义重构。
- 优先在现有 `src/style.css` 中抽公共控制台样式，不额外引入新样式体系，降低 blast radius。

## Architecture Design

### UI Structure

- 共享样式层：`src/style.css`
- 页面控制台层：
- `practice1/ControlPanel.vue` + `controls/*.vue`
- `practice2/ModelControlPanel.vue`
- `practice3/PBRControlPanel.vue`
- `practice4/WaveControlPanel.vue`
- 业务状态层：继续复用各自既有 composable，不新增状态架构

### Component Relationship

- 公共控制台皮肤负责统一壳层、分区和表单视觉
- 各页面控制台组件负责保留各自功能结构和绑定
- `practice1` 子控件继续独立拆分，但全部接入统一主题语言
- 场景组件和状态逻辑不参与本次改动

## Directory Structure

### Directory Structure Summary

本次实现聚焦于 `practice1-4` 的控制台统一，不改场景组件和业务状态逻辑。核心策略是在现有全局样式入口中抽公共控制台主题，并按页面逐步接入。

### Affected Files

- `d:/lesson_zp/threejs/practice-day1/src/style.css` `[MODIFY]`
- Purpose：承载共享控制台主题样式
- Functionality：新增统一的外层面板、标题区、分组卡片、滚动条、按钮、滑杆、状态卡和响应式规则
- Implementation requirements：使用前缀化公共类，避免影响非控制台区域

- `d:/lesson_zp/threejs/practice-day1/src/components/practice1/ControlPanel.vue` `[MODIFY]`
- Purpose：Day 1 控制台外壳
- Functionality：接入统一 header、panel shell、content spacing
- Implementation requirements：保留子组件组合方式，不改业务逻辑

- `d:/lesson_zp/threejs/practice-day1/src/components/practice1/controls/GeometrySelector.vue` `[MODIFY]`
- Purpose：Day 1 几何体选择块
- Functionality：统一 section card、标题和 TDesign 单选组视觉
- Implementation requirements：保留当前选项与绑定关系

- `d:/lesson_zp/threejs/practice-day1/src/components/practice1/controls/ObjectModeToggle.vue` `[MODIFY]`
- Purpose：Day 1 单/多物体切换块
- Functionality：统一 toggle 区块、状态标签和开关容器视觉
- Implementation requirements：继续使用现有 TDesign switch

- `d:/lesson_zp/threejs/practice-day1/src/components/practice1/controls/AnimationToggle.vue` `[MODIFY]`
- Purpose：Day 1 动画开关块
- Functionality：统一 section、状态行与开关视觉
- Implementation requirements：不改变动画状态绑定

- `d:/lesson_zp/threejs/practice-day1/src/components/practice1/controls/MaterialSwitch.vue` `[MODIFY]`
- Purpose：Day 1 材质切换块
- Functionality：统一单选组、说明卡和提示文字视觉
- Implementation requirements：保留材质切换逻辑

- `d:/lesson_zp/threejs/practice-day1/src/components/practice1/controls/FovSlider.vue` `[MODIFY]`
- Purpose：Day 1 FOV 控制块
- Functionality：统一滑杆、数值区和刻度说明视觉
- Implementation requirements：继续使用现有 TDesign slider

- `d:/lesson_zp/threejs/practice-day1/src/components/practice1/controls/StatusSummary.vue` `[MODIFY]`
- Purpose：Day 1 状态汇总块
- Functionality：统一状态卡、图标容器和信息层级
- Implementation requirements：保持只读展示，不引入交互改动

- `d:/lesson_zp/threejs/practice-day1/src/components/practice2/ModelControlPanel.vue` `[MODIFY]`
- Purpose：Day 2 模型控制面板
- Functionality：把模型卡片、动画按钮、轨道列表、视角按钮、信息区迁移到统一主题
- Implementation requirements：保留截图、加载进度、动画切换等功能

- `d:/lesson_zp/threejs/practice-day1/src/components/practice3/PBRControlPanel.vue` `[MODIFY]`
- Purpose：Day 3 PBR 控制台
- Functionality：统一预设卡、HDR 按钮、通道开关、滑杆、badge 和色板输入的视觉
- Implementation requirements：保留 compare/showcase、通道可视化和预设行为

- `d:/lesson_zp/threejs/practice-day1/src/components/practice4/WaveControlPanel.vue` `[MODIFY]`
- Purpose：Day 4 Shader 控制台
- Functionality：在现有接近风格基础上精确对齐 header、section、按钮状态、间距和响应式表现
- Implementation requirements：不改变现有参数分组与交互逻辑

## 统一设计方向

以 `practice5` 为唯一视觉基线，控制台整体采用“深色科技实验台 + Glassmorphism”风格：深蓝黑半透明背景、24px 大圆角、青蓝色发光点、柔和高模糊、清晰的标题层级和独立功能卡片。重点不是简单换色，而是把四个页面的控制台统一成同一套产品语言。

## 视觉落地

- 外层面板：统一大圆角玻璃壳层、细边框、发光阴影和窄滚动条
- 标题区：统一 `eyebrow + 主标题 + glow` 结构，强化系列感
- 分组内容：统一改成独立 section card，而不是简单分隔线
- 表单控件：滑杆、按钮、开关、色板输入全部向 `practice5` 靠齐
- 状态区：数值高亮、说明文字弱化、激活态使用蓝青发光反馈

## 页面适配重点

- `practice1`：重点处理 TDesign 单选组、开关、滑杆皮肤，让其融入新的玻璃控制台
- `practice2`：让模型卡片、动画轨道和信息列表进入同一视觉节奏
- `practice3`：把高密度按钮网格和通道调试区收敛到统一卡片系统
- `practice4`：保持现有方向，只做细节精修和与 `practice5` 的精准对齐

## Agent Extensions

- **code-explorer**
- Purpose: 复核 `practice1-4` 控制台结构差异、共享样式抽取点和受影响文件
- Expected outcome: 明确哪些组件需要改模板、哪些只需改样式，避免漏掉 `practice1` 子控件

- **frontend-design**
- Purpose: 以 `practice5` 为基准统一控制台的玻璃拟态、层级、间距和状态反馈
- Expected outcome: 四个页面控制台在视觉语言上统一，同时保持各自内容结构清晰