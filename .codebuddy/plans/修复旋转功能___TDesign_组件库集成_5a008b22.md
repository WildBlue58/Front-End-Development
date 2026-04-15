---
name: 修复旋转功能 + TDesign 组件库集成
overview: 修复3D物体旋转动画失效问题，并将控制面板从原生HTML替换为腾讯TDesign组件库，提升界面美观度和交互体验
design:
  architecture:
    framework: vue
    component: tdesign
  styleKeywords:
    - Dark Theme
    - Glassmorphism
    - TDesign
    - Modern UI
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 16px
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
      - "#0052D9"
    background:
      - "#1a1a2e"
      - rgba(15, 15, 30, 0.85)
    text:
      - "#e2e8f0"
      - "#a5b4fc"
      - "#94a3b8"
    functional:
      - "#42b883"
      - "#0052D9"
      - "#E34D59"
todos:
  - id: install-icons
    content: 安装 tdesign-icons-vue-next 图标库
    status: completed
  - id: config-tdesign
    content: 在 main.ts 中配置 TDesign 和图标库全局注册
    status: completed
    dependencies:
      - install-icons
  - id: fix-animation
    content: 修改 ShapeMesh.vue 添加 useLoop 动画逻辑
    status: completed
    dependencies:
      - config-tdesign
  - id: update-scene-canvas
    content: 修改 SceneCanvas.vue 移除动画代码并传递 isAnimating prop
    status: completed
    dependencies:
      - fix-animation
  - id: rewrite-geometry-selector
    content: 重写 GeometrySelector.vue 使用 t-radio-group
    status: completed
    dependencies:
      - config-tdesign
  - id: rewrite-animation-toggle
    content: 重写 AnimationToggle.vue 使用 t-switch
    status: completed
    dependencies:
      - config-tdesign
  - id: rewrite-object-toggle
    content: 重写 ObjectModeToggle.vue 使用 t-switch
    status: completed
    dependencies:
      - config-tdesign
  - id: rewrite-material-switch
    content: 重写 MaterialSwitch.vue 使用 t-radio-group
    status: completed
    dependencies:
      - config-tdesign
  - id: rewrite-fov-slider
    content: 重写 FovSlider.vue 使用 t-slider
    status: completed
    dependencies:
      - config-tdesign
  - id: rewrite-status-summary
    content: 重写 StatusSummary.vue 使用 t-card
    status: completed
    dependencies:
      - config-tdesign
  - id: update-control-panel
    content: 更新 ControlPanel.vue 整体样式
    status: completed
    dependencies:
      - rewrite-geometry-selector
      - rewrite-animation-toggle
      - rewrite-object-toggle
      - rewrite-material-switch
      - rewrite-fov-slider
      - rewrite-status-summary
---

## 产品概述

修复 Three.js 3D 场景的旋转动画功能，并使用腾讯 TDesign 组件库重构控制面板 UI。

## 核心功能

1. **旋转动画修复**：将 `useLoop` 动画逻辑从父组件移到子组件中，解决上下文不存在的问题
2. **TDesign 组件库集成**：替换原生 HTML 按钮为 TDesign 组件（RadioGroup、Switch、Slider、Card）
3. **TDesign Icons 图标集成**：使用图标替代 emoji，提升视觉专业度

## 技术栈选择

- **UI 组件库**：TDesign Vue Next（已安装 v1.19.1）
- **图标库**：tdesign-icons-vue-next（需安装）
- **3D 框架**：TresJS v5 + Three.js

## 实现方案

### 问题根因分析

**旋转失效原因**：根据 TresJS 文档，`useLoop()` 是用于 `TresCanvas` **子组件** 的 composable。当前 `SceneCanvas.vue` 本身定义了 `<TresCanvas>`，在 setup 阶段调用 `useLoop()` 时，TresCanvas 还未渲染，上下文不存在。

### 解决方案

1. **将动画逻辑移到 ShapeMesh.vue**：ShapeMesh 是 TresCanvas 的子组件，可以正常使用 `useLoop()`
2. **通过 props 控制动画状态**：ShapeMesh 接收 `isAnimating` prop，决定是否执行旋转

### 安装命令

```
cd d:\lesson_zp\threejs\practice-day1
npm install tdesign-icons-vue-next
```

## 目录结构

```
practice-day1/src/
├── main.ts                          [MODIFY] 引入 TDesign 和图标库
├── composables/
│   └── useSceneState.ts             [KEEP] 保持不变
├── components/
│   ├── SceneCanvas.vue              [MODIFY] 移除动画逻辑，传递 isAnimating prop
│   ├── ShapeMesh.vue                [MODIFY] 添加 useLoop 动画逻辑
│   ├── ControlPanel.vue             [MODIFY] 使用 TDesign 样式重写
│   ├── GeometrySelector.vue         [MODIFY] 使用 t-radio-group
│   ├── ObjectModeToggle.vue         [MODIFY] 使用 t-switch
│   ├── AnimationToggle.vue          [MODIFY] 使用 t-switch
│   ├── MaterialSwitch.vue           [MODIFY] 使用 t-radio-group
│   ├── FovSlider.vue                [MODIFY] 使用 t-slider
│   └── StatusSummary.vue            [MODIFY] 使用 t-card + 自定义样式
```

## 关键代码结构

### ShapeMesh.vue 动画逻辑

```typescript
import { ref } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Mesh } from 'three'

const props = defineProps<{
  // ... 其他 props
  isAnimating?: boolean
}>()

const meshRef = ref<Mesh>()

// 在 TresCanvas 子组件中使用 useLoop
const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
  if (props.isAnimating && meshRef.value) {
    meshRef.value.rotation.y += delta
  }
})
```

### TDesign 组件映射

| 功能 | 原生 HTML | TDesign 组件 |
| --- | --- | --- |
| 几何体选择 | button 组 | t-radio-group + t-radio-button |
| 材质切换 | button 组 | t-radio-group + t-radio-button |
| 动画开关 | button 组 | t-switch |
| 物体模式 | button 组 | t-switch |
| FOV 调整 | input[range] | t-slider |
| 状态汇总 | ul/li | t-card + 自定义列表 |


使用 TDesign Vue Next 组件库重构控制面板，采用深色主题风格，与 3D 场景背景协调。面板使用毛玻璃效果，组件使用 TDesign 的 RadioGroup、Switch、Slider 等组件替换原生 HTML 元素，图标使用 TDesign Icons。

## MCP 工具使用

### Context7

- **Purpose**: 查询 TDesign Vue Next 和 TDesign Icons 的最新文档和用法示例
- **Expected outcome**: 获取准确的组件 API 和安装配置方法

已查询到的关键信息：

- TDesign Vue Next library ID: `/websites/tdesign_tencent_vue-next`
- TDesign Icons library ID: `/tencent/tdesign-icons`
- RadioGroup、Switch、Slider 组件用法已获取
- 图标导入方式：`import { IconName } from 'tdesign-icons-vue-next'`