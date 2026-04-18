---
name: practice-day1-practice4-wave-shader
overview: 为 `practice-day1` 新增 `practice4` 页面，基于 `practice4.md` 实现可交互的波浪 Shader 场景、控制面板、路由入口与导航接入，并确保满足文档中的全部验收项。
design:
  architecture:
    framework: vue
    component: tdesign
  styleKeywords:
    - 深色科技风
    - Glassmorphism
    - 高对比蓝青高光
    - 沉浸式 3D 视口
    - 轻量动态交互
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 28px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#38BDF8"
      - "#42B883"
      - "#A5F3FC"
    background:
      - "#050816"
      - "#0B1120"
      - "#111827"
    text:
      - "#E2E8F0"
      - "#94A3B8"
      - "#F8FAFC"
    functional:
      - "#22C55E"
      - "#F59E0B"
      - "#EF4444"
      - "#60A5FA"
todos:
  - id: wire-practice4-entry
    content: 使用 [subagent:code-explorer] 接入 Practice4 路由、导航与页面壳子
    status: completed
  - id: build-wave-state
    content: 新建 useWaveShaderState.ts 管理 Day4 共享参数
    status: completed
    dependencies:
      - wire-practice4-entry
  - id: implement-wave-scene
    content: 在 WaveScene.vue 与 WaveSurface.vue 实现波浪 Shader 场景
    status: completed
    dependencies:
      - build-wave-state
  - id: design-wave-panel
    content: 使用 [skill:frontend-design] 完成 WaveControlPanel.vue 深色调参面板
    status: completed
    dependencies:
      - build-wave-state
  - id: validate-practice4
    content: 对照 practice4.md 清单自检联动、性能与资源释放
    status: completed
    dependencies:
      - implement-wave-scene
      - design-wave-panel
---

## 用户需求

### User Requirements

在现有 `practice-day1` 项目中新增一个 `practice4` 页面，并按照 `src/docs/practice4.md` 的要求完成一个可交互的波浪 Shader 练习页。页面需能够正常打开，且不出现 Vue 或 TypeScript 报错。

### Product Overview

该页面以深色科技风 3D 场景为主视觉：场景中展示一个高分段、持续起伏的倾斜平面，表面带有两色渐变、边缘发光、扫描线和细微噪声效果。用户可通过鼠标自由旋转与缩放视角，并通过右侧控制面板实时调整画面表现。

### Core Features

- 在现有导航体系中新增 Practice4 页面入口，并可正常切换进入
- 场景中展示一个会起伏的平面，支持 OrbitControls 旋转与缩放观察
- 调节“波浪振幅”时，波高实时变化
- 调节“波浪频率”时，波峰密度实时变化
- 调节“动画速度”时，运动节奏实时变化
- 调节“菲涅尔强度”时，边缘发光强弱立即变化
- 调节“扫描线强度”时，表面科技感条纹明显变化
- 切换颜色 A / B 时，材质渐变颜色立即更新
- 开启线框模式后，可清晰看到高分段网格结构

## Tech Stack Selection

- 现有项目栈已确认：Vue 3、TypeScript、Vite、vue-router
- 3D 与交互栈已确认：Three.js、`@tresjs/core`、`@tresjs/cientos`
- UI 基础已存在：`tdesign-vue-next` 已全局注册，但 Day3 已证明原生表单加自定义样式也符合当前项目风格
- 本次实现不新增依赖，直接复用现有栈，并遵循 `practice4.md` 中“内联 Shader 字符串”的要求

## Implementation Approach

### 高层策略

沿用当前项目已存在的 Day 页面结构：`Page` 负责拼装页面，`components/practice4` 负责场景与控制面板，`composables` 负责共享响应式参数。Shader 相关逻辑集中在单独的波浪网格组件中，避免把材质创建、uniform 同步、渲染循环和 UI 状态耦合在一个文件里。

### 关键技术决策

1. **新增路由与导航，不改现有页面结构**

- 复用 `src/router/index.ts` 的懒加载路由方式
- 复用 `src/App.vue` 的顶部标签导航，新增 Day 4 入口
- 保持现有 Hash 路由与页面切换体验不变

2. **采用“页面 + 场景 + 面板 + 共享状态”的现有模式**

- 参考 `Practice3Page.vue` 的组织方式，页面仅组合 `WaveScene` 与 `WaveControlPanel`
- 用新的 composable 管理 `amplitude`、`frequency`、`speed`、`fresnelPower`、`scanStrength`、`colorA`、`colorB`、`wireframe`
- 这样能减少 prop 层层传递，后续也便于扩展 Day4 预设或更多材质参数

3. **ShaderMaterial 使用内联 vertex/fragment shader**

- 与 `practice4.md` 保持一致，不引入 `.glsl` 文件加载配置
- 降低改动面，避免无关的 Vite 配置变更
- 重点聚焦在波浪位移、菲涅尔、扫描线、噪声和 uniform 绑定

4. **渲染循环与材质逻辑放在 TresCanvas 子组件中**

- 当前项目在 `practice1` 已明确说明 `useLoop()` 需放在 `TresCanvas` 子组件里使用
- 为降低 Tres 上下文风险，Day4 也应把时间驱动与材质更新收敛到 `WaveSurface.vue` 这类场景子组件中
- 这样比在定义 `TresCanvas` 的同级组件里直接驱动更稳妥

### 性能与可靠性

- CPU 侧每帧只更新 `uTime`，复杂度近似 `O(1)`
- GPU 侧主要成本来自高分段平面顶点位移与片元着色；核心瓶颈是 `256 x 256` 分段平面和片元中的扫描线/噪声计算
- 优化方式：
- 只保留一个高分段平面，避免重复网格
- 材质实例只创建一次，通过 `watch` 原地更新 uniforms，不重复 new `ShaderMaterial`
- 颜色切换使用已有 `THREE.Color` 对象的 `.set()` 更新，减少频繁对象分配
- 线框模式直接切换同一材质的 `wireframe`，不重建材质
- 卸载时显式 `dispose()` 材质，避免热更新或页面切换后的 WebGL 资源残留

## Implementation Notes

- 严格对照 `src/docs/practice4.md` 的验证清单实现，不扩展无关功能
- 保持默认参数与文档示例接近，减少联调成本
- 平面建议继续使用高分段配置，保证波浪在普通视角下也足够平滑
- 灯光仅服务空间参照物与画面氛围，不应把 Shader 结果依赖到标准光照链路上
- 保持现有页面和路由行为兼容，不修改 Day1~Day3 的业务逻辑
- 避免把 UI 控件与 Shader 材质实例写死在同一组件，控制 blast radius

## Architecture Design

### 页面层次

- `App.vue`
- 顶部导航新增 Day 4 标签
- `router/index.ts`
- 新增 `/practice4` 路由
- `pages/Practice4Page.vue`
- 组合场景组件与控制面板组件
- `composables/useWaveShaderState.ts`
- 提供共享响应式参数
- `components/practice4/WaveScene.vue`
- 负责 `TresCanvas`、相机、OrbitControls、灯光、参照物与波浪网格挂载
- `components/practice4/WaveSurface.vue`
- 负责高分段平面、ShaderMaterial、uniform 同步、动画时间更新与资源释放
- `components/practice4/WaveControlPanel.vue`
- 负责所有调参与数值展示

### 数据流

控制面板修改共享状态 → 波浪网格组件监听状态 → uniforms / 材质属性实时更新 → 渲染循环持续驱动 `uTime` → 画面即时反馈

## Directory Structure

### Directory Structure Summary

本次改动会在现有 Day1~Day3 架构上补齐 Day4 页面入口，并新增一套 practice4 专属的页面、场景、面板与共享状态文件。

```text
d:/lesson_zp/threejs/practice-day1/src/
├── App.vue                                      # [MODIFY] 顶部导航配置。新增 Day 4 标签入口，保持现有导航交互和样式一致。
├── router/
│   └── index.ts                                # [MODIFY] 路由注册。新增 /practice4 懒加载页面路由与标题元信息。
├── composables/
│   └── useWaveShaderState.ts                   # [NEW] Practice4 共享状态。集中管理振幅、频率、速度、菲涅尔、扫描线、颜色和线框开关。
├── pages/
│   └── Practice4Page.vue                       # [NEW] Day4 页面壳子。仅负责组合 WaveScene 与 WaveControlPanel，保持与 Practice3Page 一致的页面模式。
└── components/
    └── practice4/
        ├── WaveScene.vue                       # [NEW] 波浪场景容器。放置 TresCanvas、相机、OrbitControls、灯光、参照物与 WaveSurface。
        ├── WaveSurface.vue                     # [NEW] 核心 Shader 网格组件。创建高分段平面和 ShaderMaterial，同步 uniforms，驱动 uTime，卸载时释放材质。
        └── WaveControlPanel.vue                # [NEW] 右侧悬浮控制面板。提供滑块、颜色选择器、线框开关，并实时显示当前数值。
```

## Key Code Structures

### 关键状态字段

新的共享状态至少应覆盖以下参数：

- `amplitude`
- `frequency`
- `speed`
- `fresnelPower`
- `scanStrength`
- `colorA`
- `colorB`
- `wireframe`

### 关键职责边界

- `WaveScene.vue`：只负责场景装配，不直接维护 ShaderMaterial
- `WaveSurface.vue`：只负责波浪几何、Shader、uniform 与动画循环
- `WaveControlPanel.vue`：只负责用户输入与当前值展示
- `useWaveShaderState.ts`：只负责跨组件共享状态，不混入 WebGL 实例逻辑

## 设计方向

延续当前项目 Day3 的深色玻璃拟态风格，并强化 Day4 的“科技感波浪材质”主题。页面采用桌面端布局：顶部复用现有全局导航，中间为全屏 3D 视口，右侧悬浮一张半透明控制卡片，形成“沉浸式场景 + 即时调参”的学习型界面。

## 页面结构

- 顶部导航：复用现有标签导航，只新增 Day 4 入口
- 主场景区：深蓝黑背景下的倾斜波浪平面作为视觉焦点
- 场景参照区：保留一个小型发光球体或轻量提示，增强空间感
- 右侧控制台：参数按“波浪形变 / 材质表现 / 颜色与线框”分组排列
- 交互反馈：滑块值即时显示，颜色选择立即反映在材质上，线框切换需让网格结构清晰可见

## 视觉效果

整体以蓝青色高光、低饱和深色底、柔和玻璃面板为主，突出 Shader 材质的边缘辉光与扫描线细节。控制面板不抢主画面，但需要足够清晰、可读、可连续调参。

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 在执行前后复核 Practice4 的接入点、影响文件和现有架构约束
- Expected outcome: 改动范围精确，路由、页面、组件和共享状态的链路清晰且与现有项目一致

### Skill

- **frontend-design**
- Purpose: 优化 Practice4 控制面板与场景叠层的视觉层次、交互可读性和整体一致性
- Expected outcome: 新页面在不脱离现有项目风格的前提下，具备更明确的科技感与高质量调参体验