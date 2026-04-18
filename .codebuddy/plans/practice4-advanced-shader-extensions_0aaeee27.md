---
name: practice4-advanced-shader-extensions
overview: 扩展 `practice-day1` 的 `practice4` 页面，围绕文档第 714-719 行新增 Shader 预设、鼠标扰动、法线细节增强、`RawShaderMaterial` 对比、可复用 `WaveSurface` 组件能力，以及科技面板背景模式。
design:
  architecture:
    framework: vue
    component: tdesign
  styleKeywords:
    - 深色科技风
    - Glassmorphism
    - 蓝青高光
    - Shader 实验台
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
      - "#F8FAFC"
      - "#E2E8F0"
      - "#94A3B8"
    functional:
      - "#22C55E"
      - "#F59E0B"
      - "#EF4444"
      - "#60A5FA"
todos:
  - id: audit-practice4-scope
    content: 使用 [subagent:code-explorer] 复核 Practice4 扩展边界与贴图复用点
    status: completed
  - id: extend-wave-state
    content: 扩展 `useWaveShaderState.ts` 管理预设、Raw 模式与高级参数
    status: completed
    dependencies:
      - audit-practice4-scope
  - id: refactor-wave-surface
    content: 使用 [mcp:Context7] 重构 `WaveSurface.vue` 和 `waveShaderFactory.ts`
    status: completed
    dependencies:
      - extend-wave-state
  - id: add-hud-surface
    content: 新增 `HudPanelSurface.vue` 并扩展 `WaveScene.vue` 鼠标与 HUD 背景
    status: completed
    dependencies:
      - refactor-wave-surface
  - id: upgrade-wave-panel
    content: 使用 [skill:frontend-design] 重做 `WaveControlPanel.vue` 高级控制台
    status: completed
    dependencies:
      - extend-wave-state
      - add-hud-surface
  - id: validate-practice4-advanced
    content: 校验 `practice4` 预设联动、类型检查与生产构建
    status: completed
    dependencies:
      - refactor-wave-surface
      - add-hud-surface
      - upgrade-wave-panel
---

## User Requirements

在现有 `practice4` 页面基础上继续扩展 `practice4.md` 第 714-719 行的能力，不新开页面。扩展后的页面需要继续保持可正常打开、交互实时、无 Vue / TypeScript 报错。

## Product Overview

页面仍以深色科技风 3D 视口为主，但从“单一波浪演示”升级为“Shader 实验台”。主场景中的波浪平面需要支持多种视觉预设、鼠标扰动、法线细节增强，以及 `ShaderMaterial` 与 `RawShaderMaterial` 的切换体验；同时新增一个去掉波浪形变的 2D 科技面板背景材质，用于展示扫描线、菲涅尔和噪声在 HUD 风格中的表现。

## Core Features

- 新增四种 Shader 预设：海面、能量池、全息屏、熔岩面，切换后颜色、节奏与材质风格立即变化
- 增加鼠标交互扰动，让鼠标附近出现额外涟漪或能量波动
- 叠加现有贴图细节，将程序噪声与法线贴图思路结合，增强表面纹理层次
- 提供 `ShaderMaterial` 与 `RawShaderMaterial` 渲染模式切换，直观看到两种写法差异
- 将 `WaveSurface.vue` 真正改造成可复用组件，通过 props 暴露核心参数
- 新增 2D HUD 科技面板背景材质，保留扫描线、菲涅尔、噪声，去掉波浪形变

## Tech Stack Selection

- 继续复用已确认项目栈：Vue 3、TypeScript、Vite、vue-router
- 继续复用 3D 栈：Three.js、`@tresjs/core`、`@tresjs/cientos`
- 继续使用内联 shader 字符串，不新增 GLSL loader
- 复用现有资源：`d:/lesson_zp/threejs/practice-day1/public/textures/normal.png` 及其他 `public/textures` 贴图

## Implementation Approach

### 高层策略

在现有 Practice4 架构上做“增强而非重写”：保留 `WaveScene.vue + WaveControlPanel.vue + useWaveShaderState.ts` 的组织方式，但把 `WaveSurface.vue` 从“直接依赖全局状态”重构成“props 驱动的可复用渲染组件”。Shader 字符串与材质创建逻辑从组件内拆出为独立工厂，统一支持 `ShaderMaterial` 与 `RawShaderMaterial` 两套实现。

### 关键技术决策

1. **预设驱动，而非写死多个材质组件**

- 在 `useWaveShaderState.ts` 中新增预设键、模式键、鼠标扰动、贴图细节和 HUD 背景参数
- 预设切换主要通过 uniform 默认值、颜色方案和局部 shader 分支控制，避免复制四套场景组件

2. **`WaveSurface.vue` props 化，状态仍由 composable 统一管理**

- `WaveSurface.vue` 不再直接 `useWaveShaderState()`
- `WaveScene.vue` 从 composable 取状态，再通过 props 传给 `WaveSurface.vue`
- 这样既符合当前项目共享状态模式，也真正满足“可复用组件”要求

3. **用 shader 工厂同时生成 `ShaderMaterial` 与 `RawShaderMaterial`**

- `RawShaderMaterial` 需要显式声明 `projectionMatrix`、`modelViewMatrix`、`modelMatrix`、`viewMatrix`、`cameraPosition`、`position`、`normal`、`uv`
- 两种模式共用同一套 uniform 结构和视觉算法，只在声明层与内置变量接入方式上区分
- 这样既便于对比，也能控制维护成本

4. **鼠标扰动用 Raycaster 命中平面并写入 uniform**

- 通过 Tres 上下文拿到相机和渲染器，监听指针移动
- 用射线与波浪平面求交，得到命中点或 UV，再写入 `uPointer`、`uRippleStrength`、`uRippleRadius`
- 单次事件和单帧更新复杂度均为 `O(1)`，不会引入遍历型热点

5. **法线贴图思路采用“细节扰动”，不引入完整 PBR 法线链路**

- 当前材质是自定义着色，不走标准光照
- 因此更合理的做法是采样 `normal.png`，将其作为额外 detail noise 参与扫描线、边缘光或颜色扰动
- 这样能体现“程序噪声 + 贴图细节”的教学目标，同时避免无谓增加切线空间复杂度

### 性能与可靠性

- 滑块变化只更新 uniforms，不重建材质，常规联动为 `O(1)`
- 仅在“预设切换”或“材质模式切换”时重建材质实例，避免每次拖动都重新编译 shader
- 贴图只加载一次并复用，组件卸载时释放材质与纹理引用
- 鼠标交互使用目标值缓动写入 uniform，减少快速抖动带来的视觉跳变
- 保持 Day1 至 Day4 现有路由与页面结构不变，避免扩大影响面

## Implementation Notes

- 严格复用现有 `public/textures/normal.png`，不新增无必要资源
- `WaveSurface.vue` 只负责几何、材质、交互采样和 uniform，同步逻辑不回流到控制面板
- 2D HUD 背景材质建议独立为新组件，避免把主波浪 shader 继续膨胀
- 保持默认参数向下兼容，未启用高级功能时仍接近当前 practice4 视觉效果
- 不做无关路由、导航、全局样式重构

## Architecture Design

### 组件关系

- `useWaveShaderState.ts` 负责 Practice4 高级状态
- `WaveScene.vue` 负责场景组装、把状态传给可复用 `WaveSurface.vue`
- `WaveSurface.vue` 负责主波浪材质、鼠标扰动、`ShaderMaterial` / `RawShaderMaterial` 切换
- `HudPanelSurface.vue` 负责独立的 2D 科技面板背景材质
- `WaveControlPanel.vue` 负责预设、模式、扰动、细节、HUD 背景控制

## Directory Structure

### Directory Structure Summary

- `d:/lesson_zp/threejs/practice-day1/src/composables/useWaveShaderState.ts`  
[MODIFY] 扩展 Practice4 共享状态。新增预设键、材质模式、鼠标扰动、贴图细节、HUD 背景参数，以及预设列表等只读配置。

- `d:/lesson_zp/threejs/practice-day1/src/components/practice4/WaveScene.vue`  
[MODIFY] 场景装配层。把共享状态映射为 `WaveSurface.vue` props，接入 HUD 背景预览组件、模式提示和扩展说明。

- `d:/lesson_zp/threejs/practice-day1/src/components/practice4/WaveSurface.vue`  
[MODIFY] 主波浪渲染组件。改造成 props 驱动，支持预设、鼠标扰动、贴图细节、`ShaderMaterial` / `RawShaderMaterial` 切换与资源释放。

- `d:/lesson_zp/threejs/practice-day1/src/components/practice4/WaveControlPanel.vue`  
[MODIFY] 高级控制面板。新增预设切换、材质模式、鼠标扰动、细节贴图和 HUD 背景控制区，并保持当前深色玻璃风格。

- `d:/lesson_zp/threejs/practice-day1/src/components/practice4/HudPanelSurface.vue`  
[NEW] 2D HUD 背景材质组件。复用扫描线、菲涅尔、噪声思路，去掉波浪形变，用于展示科技面板风格。

- `d:/lesson_zp/threejs/practice-day1/src/components/practice4/waveShaderFactory.ts`  
[NEW] Shader 工厂文件。集中维护主波浪与 Raw 模式所需的 shader 字符串、uniform 结构和材质创建逻辑，避免单文件失控。

## Key Code Structures

建议统一以下关键类型与字段命名：

- `WavePresetKey`：`ocean | energy_pool | hologram | lava`
- `WaveMaterialMode`：`shader | raw`
- `WaveSurface` props：`amplitude`、`frequency`、`speed`、`fresnelPower`、`scanStrength`、`colorA`、`colorB`、`wireframe`、`preset`、`materialMode`、`rippleStrength`、`rippleRadius`、`normalDetailStrength`

## Design Approach

延续当前 Practice4 的深色科技风，但把右侧控制区升级为“高级实验控制台”，分成预设、渲染模式、鼠标交互、细节增强、HUD 背景五个层级。主场景保持沉浸式全屏画布，左上信息区增强为实验说明卡，新增 2D HUD 材质预览块，让“主波浪效果”和“科技面板背景”形成一组互相关联的视觉演示。

控制面板应继续使用玻璃态深色卡片、蓝青高光、清晰数值反馈和明显 hover 态；预设按钮建议做成卡片式切换，材质模式建议做成分段切换，HUD 背景建议带小型实时预览条或预览块。

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 复核 Practice4 扩展时的影响文件、材质切换链路与现有资源复用点
- Expected outcome: 改动范围准确，新增 shader 工厂与 HUD 组件的职责边界清晰

### Skill

- **frontend-design**
- Purpose: 优化高级控制台、预设卡片和 HUD 信息层的层次与视觉统一性
- Expected outcome: 扩展后的 Practice4 在功能增多后仍保持高可读性和强科技感

### MCP

- **Context7**
- Purpose: 查证 Three.js `RawShaderMaterial` 的内置矩阵、attribute 和 uniform 显式声明方式
- Expected outcome: Raw 模式实现完整可靠，不遗漏 `projectionMatrix`、`modelViewMatrix`、`cameraPosition` 等关键输入