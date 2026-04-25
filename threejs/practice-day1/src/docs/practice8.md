# Day 8：引擎对接预研 + 综合项目

> 目标：站在前端技术美术的视角，理解 `Unity WebGL`、`Unreal Pixel Streaming` 与纯 Web 方案的差异，学会根据项目目标选择渲染路线；同时把前 1 到 7 天积累的加载、材质、交互、性能与资产规范能力，收束到一个完整的 3D 产品展示页练习中。

---

## 一、理论目标

### 1.1 为什么 Day 8 不只是“再做一个页面”

如果说前 7 天是在分别学习：

- 3D 基础场景如何搭起来
- 模型怎么加载
- PBR 材质怎么映射
- Shader 怎么接进前端
- Vue 响应式状态怎么驱动 3D 交互
- 性能瓶颈怎么观察与调优
- 资产怎样从 Blender 稳定走到 Web

那么 Day 8 要做的，就是把这些能力汇总成一个更接近真实项目的判断：

> **一个 3D 产品展示需求，应该用什么方案做？页面结构怎么拆？资源、交互、性能和展示模式要怎么组合？**

所以 Day 8 的训练重点有两层：

1. **方案判断层**：什么时候用纯 Web，什么时候考虑引擎输出或远程流式方案
2. **综合实现层**：如何把已有技术点组装成一个能展示、能切换、能讲故事的成品页面

### 1.2 为什么技术美术需要会做“方案预研”

在实际项目里，产品、运营、设计、客户端、后端和内容团队通常不会直接告诉你最优技术路线。他们更可能只给出一个业务目标：

- 做一个高质感 3D 产品展示页
- 做一个可在线浏览的空间或展厅
- 做一个接近游戏画质的交互演示
- 做一个需要大规模终端覆盖的营销落地页

这时候技术美术不能只回答“我能写”，还要回答：

- **什么方案更稳**
- **什么方案上线成本更低**
- **什么方案更容易适配移动端**
- **什么方案更适合当前团队协作方式**

这就是 Day 8 要补上的“产品与技术之间的翻译能力”。

### 1.3 三种常见路线分别在解决什么问题

在面向前端的 3D 项目里，比较常见的路线通常有 3 类：

| 路线 | 核心思路 | 更适合解决的问题 |
|------|----------|------------------|
| 纯 Web (`Three.js / TresJS`) | 直接在浏览器内实时渲染 | 交互灵活、加载快、Web 集成深 |
| `Unity WebGL` | 把 Unity 项目编译成 WebGL / WASM 运行包 | 复用 Unity 资产和交互逻辑 |
| `Unreal Pixel Streaming` | 服务端实时渲染，浏览器接收视频流 | 追求更高画质、终端算力要求低 |

它们没有绝对好坏，只有更适合的上下文。

### 1.4 方案对比：不要只看“画质”

很多团队在早期讨论方案时，最容易掉进一个误区：

> 只比较“谁画面更好看”，却忽略了上线链路、维护成本、终端兼容、内容更新方式和团队已有技术栈。

下面这张表格是一个更适合前端技术美术做初筛的维度：

| 维度 | Unity WebGL | Unreal Pixel Streaming | 纯 Web (`Three.js`) |
|------|-------------|------------------------|---------------------|
| 渲染质量 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 加载速度 | ⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| 交互延迟 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 移动端兼容 | ⭐⭐ | ⭐ | ⭐⭐⭐⭐ |
| 开发效率 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| 前端整合能力 | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 维护成本 | ⭐⭐ | ⭐ | ⭐⭐⭐⭐ |
| 内容热更新灵活度 | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

一个更现实的理解方式是：

- **Unity WebGL**：适合已有 Unity 内容资产或逻辑积累的团队
- **Unreal Pixel Streaming**：适合画质优先、服务端资源充足的展示型项目
- **纯 Web**：适合需要和 Web 业务深度耦合、强调加载速度和交互灵活度的项目

### 1.5 Day 8 的综合项目为什么选“3D 产品展示页”

因为它几乎天然包含了前面所有主题：

| 主题 | 在产品展示页里怎么出现 |
|------|------------------------|
| 模型加载 | 加载产品 GLB 模型 |
| 材质与颜色 | 切换颜色、材质表现 |
| 交互 | 旋转、聚焦、切换模式、热点提示 |
| 性能优化 | 控制像素比、材质复杂度、后处理开关 |
| 资产管线 | 模型命名、贴图压缩、发布版资源管理 |
| 方案预研 | 本地渲染和外部 Viewer / 引擎方案的切换与比较 |

换句话说，产品展示页既能体现前端技术美术的工程能力，也能体现设计理解与内容组织能力，很适合作为 8 天练习的收束项目。

---

## 二、项目准备

### 2.1 继续沿用 `practice-day1`

本节继续使用前 7 天已经搭好的 `practice-day1` 项目：

```bash
cd practice-day1
npm install
```

确保你已经具备这些基础依赖：

```bash
npm install three @tresjs/core @tresjs/cientos
npm install -D @types/three
```

如果你打算复用 Day 2 的 Sketchfab 集成方案，还需要确保已经有可用的 `SketchfabViewer` 组件或等价封装。

### 2.2 第八天建议的目录分层

Day 8 的页面不再只是单一实验场，而是接近一个完整页面模块。建议结构像这样：

```text
src/
├── pages/
│   └── Practice8Page.vue
├── components/
│   └── practice8/
│       ├── ProductShowcaseScene.vue
│       ├── ProductConfigPanel.vue
│       ├── RenderModeSwitch.vue
│       ├── ProductHotspotHud.vue
│       └── SolutionCompareCard.vue
├── composables/
│   └── useProductShowcaseState.ts
├── docs/
│   └── practice8.md
public/
├── models/
│   └── product.glb
└── posters/
    └── practice8-cover.webp
```

如果你已经在 Day 2 做过 `SketchfabViewer.vue`，可以继续沿用，而不需要重新写一套嵌入逻辑。

### 2.3 本节的练习目标页面

这次我们要做的不是纯技术 Demo，而是一个更像“可交付展示页”的页面。它至少包含：

1. **主视区**：本地 3D 渲染或 Sketchfab 备用模式
2. **配置面板**：颜色、材质模式、自动旋转、后处理开关等配置
3. **状态区 / HUD**：显示当前模式、当前产品变体、热点信息或系统提示
4. **方案说明区**：用简短内容说明当前为什么优先选择纯 Web 路线

这样做的目的，是让你从“技术点练习”升级到“页面级产品思维”。

### 2.4 综合项目最重要的不是功能堆叠，而是结构收束

Day 8 很容易做着做着就把所有学过的内容都往里塞：

- 又想接复杂后处理
- 又想做很重的动画
- 又想接很多热点
- 又想把所有平台方案全塞进去

这样最后往往会失控。所以 Day 8 的一个关键训练点反而是：

> **只保留最能代表前 1 到 7 天能力的主干功能。**

推荐优先保留的就是：

- 模型加载
- 颜色 / 变体切换
- 渲染模式切换
- 自动旋转 / 画质开关
- HUD 状态反馈
- 页面结构完整性

---

## 三、实现一个综合 3D 产品展示页

### 3.1 页面结构先想清楚

在进入代码之前，建议先把综合页面拆成下面这几层：

```text
Practice8Page.vue
  ├─ 顶部说明区 / 项目简介
  ├─ ProductShowcaseScene.vue      # 3D 主视区
  ├─ ProductConfigPanel.vue        # 右侧配置面板
  ├─ ProductHotspotHud.vue         # 左下角状态反馈
  └─ SolutionCompareCard.vue       # 页面底部或侧边的方案说明卡
```

这几层分别解决的是：

- **Scene**：画面与交互
- **Panel**：用户控制入口
- **HUD**：即时反馈
- **Compare Card**：把技术选择转成可解释内容

### 3.2 完整代码：`src/App.vue`

下面这份示例代码演示一个 Day 8 练习版产品展示页：

- 使用 `TresCanvas` 做本地渲染主视区
- 通过 `useGLTF()` 加载产品模型
- 使用 Vue 响应式状态切换颜色、线框、自动旋转和渲染模式
- 支持在 **本地渲染** 和 **Sketchfab 备用方案** 间切换
- 右侧面板承担配置职责，左下 HUD 承担状态说明职责
- 页面底部补充方案选择说明，体现“技术预研”结果

```vue
<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import * as THREE from 'three'
import { TresCanvas, useRenderLoop } from '@tresjs/core'
import { OrbitControls, useGLTF } from '@tresjs/cientos'
import SketchfabViewer from './components/SketchfabViewer.vue'

const renderMode = ref<'local' | 'sketchfab'>('local')
const sketchfabModelId = 'your-model-id'

const config = reactive({
  currentColor: '#42b883',
  currentVariant: 'standard',
  autoRotate: true,
  wireframe: false,
  bloom: true,
  focusLabel: '整机预览',
})

const variantOptions = [
  { id: 'standard', label: '标准版', accent: '#42b883' },
  { id: 'sport', label: '运动版', accent: '#6366f1' },
  { id: 'luxury', label: '高配版', accent: '#f59e0b' },
]

const colorOptions = ['#42b883', '#6366f1', '#f43f5e', '#f59e0b', '#38bdf8']

const { scene: productModel, animations } = await useGLTF('/models/product.glb')

const statusText = computed(() => {
  if (renderMode.value === 'sketchfab') {
    return '当前为外部 Viewer 方案，适合快速验证资产展示与嵌入能力。'
  }

  return config.bloom
    ? '当前为本地渲染方案，已开启质感增强模式。'
    : '当前为本地渲染方案，优先保证更稳的性能预算。'
})

const currentVariantLabel = computed(() => {
  return variantOptions.find((item) => item.id === config.currentVariant)?.label ?? '未知版本'
})

watchEffect(() => {
  productModel.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (!(child.material instanceof THREE.MeshStandardMaterial)) return

    child.material.color = new THREE.Color(config.currentColor)
    child.material.wireframe = config.wireframe
    child.material.metalness = config.currentVariant === 'luxury' ? 0.75 : 0.32
    child.material.roughness = config.currentVariant === 'sport' ? 0.24 : 0.46
    child.material.emissive = new THREE.Color(config.bloom ? '#111827' : '#000000')
    child.material.emissiveIntensity = config.bloom ? 0.22 : 0
    child.material.needsUpdate = true
  })
})

const { onLoop } = useRenderLoop()
onLoop(({ delta }) => {
  if (!config.autoRotate || renderMode.value !== 'local') return
  productModel.rotation.y += delta * 0.45
})

function applyVariant(variantId: string) {
  config.currentVariant = variantId
  const matched = variantOptions.find((item) => item.id === variantId)
  if (matched) {
    config.currentColor = matched.accent
    config.focusLabel = `${matched.label} 展示`
  }
}

function onSketchfabReady() {
  config.focusLabel = 'Sketchfab 外部预览'
}
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Day 8 · Tech Art Frontend Final</p>
        <h1>3D 产品展示综合练习</h1>
        <p>
          这个页面把前面几天练到的 <strong>模型加载</strong>、<strong>材质调节</strong>、
          <strong>交互状态</strong>、<strong>性能意识</strong> 和 <strong>方案预研</strong>
          汇总到一个可切换模式的展示页中。
        </p>
      </div>

      <div class="mode-switch">
        <button :class="{ active: renderMode === 'local' }" @click="renderMode = 'local'">
          本地渲染
        </button>
        <button :class="{ active: renderMode === 'sketchfab' }" @click="renderMode = 'sketchfab'">
          Sketchfab 备用
        </button>
      </div>
    </header>

    <main class="layout">
      <section class="viewport-shell">
        <div class="viewport-title">
          <strong>{{ currentVariantLabel }}</strong>
          <span>{{ statusText }}</span>
        </div>

        <div class="viewport">
          <TresCanvas v-if="renderMode === 'local'" clear-color="#060b16" window-size shadows>
            <TresPerspectiveCamera :position="[0, 1.4, 4.6]" />
            <OrbitControls />

            <primitive :object="productModel" :position="[0, -0.8, 0]" />

            <TresMesh :rotation="[-Math.PI / 2, 0, 0]" :position="[0, -1.15, 0]" receive-shadow>
              <TresPlaneGeometry :args="[10, 10, 1, 1]" />
              <TresMeshStandardMaterial color="#111827" roughness="0.96" metalness="0.05" />
            </TresMesh>

            <TresAmbientLight :intensity="0.45" />
            <TresDirectionalLight :position="[4, 6, 4]" :intensity="1.8" cast-shadow />
            <TresPointLight :position="[-3, 2, 3]" color="#38bdf8" :intensity="18" :distance="18" />
          </TresCanvas>

          <SketchfabViewer
            v-else
            :model-id="sketchfabModelId"
            @ready="onSketchfabReady"
          />
        </div>
      </section>

      <aside class="panel">
        <h3>产品配置</h3>
        <p class="panel-copy">
          通过统一状态源控制颜色、版本、渲染模式和展示节奏，模拟真实产品展示页里的配置逻辑。
        </p>

        <section>
          <h4>版本 Variant</h4>
          <div class="variant-grid">
            <button
              v-for="item in variantOptions"
              :key="item.id"
              :class="['variant-btn', { active: config.currentVariant === item.id }]"
              @click="applyVariant(item.id)"
            >
              {{ item.label }}
            </button>
          </div>
        </section>

        <section>
          <h4>颜色 Color</h4>
          <div class="color-grid">
            <button
              v-for="color in colorOptions"
              :key="color"
              :style="{ background: color }"
              :class="['color-dot', { active: config.currentColor === color }]"
              @click="config.currentColor = color"
            />
          </div>
        </section>

        <section>
          <h4>显示策略</h4>
          <label class="checkbox">
            <input v-model="config.autoRotate" type="checkbox" />
            自动旋转产品
          </label>
          <label class="checkbox">
            <input v-model="config.wireframe" type="checkbox" />
            线框模式
          </label>
          <label class="checkbox">
            <input v-model="config.bloom" type="checkbox" />
            质感增强开关
          </label>
        </section>

        <section>
          <h4>当前状态</h4>
          <div class="stat-row"><span>渲染模式</span><strong>{{ renderMode }}</strong></div>
          <div class="stat-row"><span>当前版本</span><strong>{{ currentVariantLabel }}</strong></div>
          <div class="stat-row"><span>动画片段数</span><strong>{{ animations.length }}</strong></div>
          <div class="stat-row"><span>焦点说明</span><strong>{{ config.focusLabel }}</strong></div>
        </section>
      </aside>
    </main>

    <div class="hud">
      <div><strong>Mode</strong>：{{ renderMode }}</div>
      <div><strong>Variant</strong>：{{ currentVariantLabel }}</div>
      <div><strong>Color</strong>：{{ config.currentColor }}</div>
      <div><strong>Bloom</strong>：{{ config.bloom ? 'on' : 'off' }}</div>
      <div><strong>Focus</strong>：{{ config.focusLabel }}</div>
    </div>

    <section class="compare-card">
      <h3>方案预研结论</h3>
      <p>
        当前练习优先采用 <strong>纯 Web 本地渲染</strong>，因为它与业务页面耦合更自然，
        在加载速度、交互灵活度和维护成本之间更适合做产品展示页；
        `Sketchfab` 作为备用方案，用于快速嵌入或替代本地渲染验证。
      </p>
      <ul>
        <li><strong>需要快速落地营销页</strong>：优先纯 Web</li>
        <li><strong>需要复用第三方内容平台展示</strong>：可切 Sketchfab</li>
        <li><strong>若画质要求远高于浏览器实时渲染预算</strong>：再评估 Unity / Unreal 路线</li>
      </ul>
    </section>
  </div>
</template>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
  background: #020617;
}

body {
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #e2e8f0;
}

.page {
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(15, 23, 42, 0.96) 0%, rgba(2, 6, 23, 1) 52%),
    linear-gradient(180deg, #020617 0%, #020617 100%);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 20px;
}

.hero-copy {
  max-width: 760px;
}

.hero-copy h1 {
  margin: 6px 0 12px;
  font-size: 36px;
  line-height: 1.15;
  color: #f8fafc;
}

.hero-copy p {
  margin: 0;
  line-height: 1.75;
  color: #cbd5e1;
}

.eyebrow {
  margin: 0;
  color: #7dd3fc;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 12px;
}

.mode-switch {
  display: flex;
  gap: 10px;
}

.mode-switch button,
.variant-btn,
.color-dot {
  border: none;
  cursor: pointer;
}

.mode-switch button {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.8);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.mode-switch button.active,
.variant-btn.active {
  background: rgba(14, 165, 233, 0.18);
  color: #e0f2fe;
  border-color: rgba(56, 189, 248, 0.4);
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;
}

.viewport-shell,
.panel,
.compare-card {
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(3, 7, 18, 0.72);
  backdrop-filter: blur(14px);
  box-shadow: 0 24px 80px rgba(2, 6, 23, 0.38);
}

.viewport-shell {
  position: relative;
  overflow: hidden;
  min-height: 640px;
}

.viewport-title {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 10;
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(2, 6, 23, 0.58);
  border: 1px solid rgba(125, 211, 252, 0.16);
}

.viewport-title strong {
  color: #f8fafc;
}

.viewport-title span {
  color: #cbd5e1;
  font-size: 13px;
}

.viewport {
  width: 100%;
  height: 640px;
}

.panel {
  padding: 18px;
  display: grid;
  gap: 16px;
}

.panel h3,
.panel h4,
.compare-card h3 {
  margin: 0;
}

.panel h3,
.compare-card h3 {
  color: #a5f3fc;
  font-size: 18px;
}

.panel h4 {
  margin-bottom: 8px;
  color: #e2e8f0;
  font-size: 14px;
}

.panel-copy {
  margin: 0;
  line-height: 1.7;
  color: #94a3b8;
  font-size: 13px;
}

.panel section {
  display: grid;
  gap: 10px;
}

.variant-grid,
.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.variant-btn {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.8);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.color-dot {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 2px solid transparent;
}

.color-dot.active {
  border-color: rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.18);
}

.checkbox {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: center;
  color: #dbeafe;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #cbd5e1;
}

.stat-row strong {
  color: #f8fafc;
}

.hud {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 30;
  min-width: 240px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(2, 6, 23, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.18);
  backdrop-filter: blur(12px);
  color: #dbeafe;
  line-height: 1.7;
  font-size: 13px;
}

.compare-card {
  margin-top: 20px;
  padding: 18px;
}

.compare-card p,
.compare-card li {
  color: #cbd5e1;
  line-height: 1.75;
}

.compare-card ul {
  margin: 12px 0 0;
  padding-left: 18px;
}

@media (max-width: 1080px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .panel {
    order: -1;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .hero {
    flex-direction: column;
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .viewport {
    height: 480px;
  }

  .hud {
    position: static;
    margin-top: 16px;
  }
}
</style>
```

### 3.3 跑起来后你应该看到什么

页面正常时，应该出现以下效果：

- 顶部有完整的项目说明与模式切换按钮
- 中央主视区支持在 **本地渲染** 与 **Sketchfab 备用模式** 间切换
- 右侧配置面板可以切换产品版本、颜色和显示策略
- 左下 HUD 会展示当前模式、当前版本、当前颜色和焦点说明
- 底部方案说明卡会解释为什么当前页面优先采用纯 Web 路线
- 本地渲染模式下，模型可通过轨道控制查看，且在自动旋转开启时缓慢转动

---

## 四、关键概念逐段解释

### 4.1 为什么综合项目要保留“本地渲染 + 外部 Viewer”双模式

这不是为了炫技，而是在模拟真实项目里的**方案弹性**。

很多时候你不会只拥有一种展示手段：

- 正式生产环境可能走本地渲染
- 某些营销页快速上线可能优先嵌入第三方 Viewer
- 某些阶段资产还没完全接好，本地渲染尚未完成时，外部 Viewer 可以先承担预览职责

所以双模式不是冗余，而是在训练你：

> **页面架构要允许技术路线切换，而不是把所有展示逻辑绑死在一种实现上。**

### 4.2 为什么 Day 8 强调“统一状态源”

你会发现本例里的：

- 颜色
- 版本
- 自动旋转
- 线框模式
- 画质增强开关
- 焦点说明

都被放在一个共享状态里管理。

这是因为综合页面里，状态不再只驱动 3D 场景，还会同步影响：

- 右侧配置面板
- 左下 HUD
- 顶部文案说明
- 技术模式切换结果

这其实是在把 Day 5 的“响应式交互”升级为页面级的数据组织方式。

### 4.3 为什么产品变体切换不只是改一个颜色

真实项目里的“标准版 / 运动版 / 高配版”切换，通常并不只是主色变化，它还可能连带影响：

- 材质参数
- 局部零件可见性
- 热点说明文字
- 对应海报图或卖点文案
- 某些动画或相机机位

所以本练习里虽然只是先用颜色和金属度 / 粗糙度做示意，但你要建立一个更重要的意识：

> **Variant 是一组状态配置，不只是一个单独枚举。**

### 4.4 为什么 Day 8 里“方案说明卡”也算页面的一部分

很多技术演示页只放一个 3D 画面和几个按钮，但真正可交付的展示页通常还需要：

- 告诉人当前方案为什么这样设计
- 说明本地渲染与外部嵌入的区别
- 为产品、设计或业务同学提供可理解的解释

也就是说，Day 8 的页面不是只给工程师看的，它也应该具备一定的“**沟通能力**”。

技术美术的价值，很多时候就在于：

- 能把复杂技术路线解释清楚
- 能把页面结构做成团队可协作的样子

### 4.5 为什么 Day 8 的本地渲染方案通常优先纯 Web

对于大多数产品展示页、营销页或内容化页面来说，纯 Web 路线往往更有综合优势：

- 更容易和页面布局、埋点、SEO、业务组件结合
- 首屏体积和交互链路更容易控制
- 移动端兼容和响应式改造相对更直接
- 维护团队通常就是前端团队，协作更顺

这不意味着 Unity 或 Unreal 没价值，而是意味着：

> **在产品展示这类需求里，默认首选项通常不是“最强画质”，而是“最平衡的交付效率”。**

### 4.6 为什么 Day 8 是一个“作品集视角”的练习

如果你把前 8 天的练习当成求职准备，那么 Day 8 的页面非常适合做成一个小作品，因为它同时能体现：

- 你会组织页面结构
- 你会接 3D 内容
- 你会处理状态与交互
- 你知道性能和资源预算
- 你能说清方案判断逻辑

这类项目往往比单一的 Shader Demo 更能体现技术美术在前端岗位里的综合能力。

---

## 五、如何把前 1 到 7 天能力真正串起来

### 5.1 一张能力映射表

你可以把 Day 8 看成下面这张表的汇总：

| 前面所学 | 在 Day 8 中如何体现 |
|----------|---------------------|
| Day 1 基础场景 | 画布、相机、灯光和基础页面壳 |
| Day 2 模型加载 / Sketchfab | 本地模型与备用 Viewer 的双模式 |
| Day 3 PBR 材质 | 颜色、金属度、粗糙度等参数映射 |
| Day 4 Shader 思维 | 质感增强、风格层表现与特效预留 |
| Day 5 响应式交互 | 右侧配置面板与场景状态联动 |
| Day 6 性能优化 | 画质增强开关、性能预算意识 |
| Day 7 资产管线 | `product.glb` 的组织、命名、发布与体积控制 |

如果你能在 Day 8 的页面里自然体现这些能力，就说明这 8 天不只是“学了 8 个点”，而是已经形成了一个连贯的方法体系。

### 5.2 推荐的实现顺序

真正落地时，建议按下面顺序实现：

1. **先把页面壳和主视区搭起来**
2. **再接本地模型加载**
3. **再接右侧配置面板和共享状态**
4. **再做本地渲染 / 外部 Viewer 切换**
5. **最后补 HUD、说明区和质感增强开关**

这样做的原因是：

- 先保证主路径跑通
- 再叠加增强能力
- 避免一开始就把页面做得过重过杂

### 5.3 Day 8 最容易犯的三个错误

| 错误 | 典型表现 | 调整建议 |
|------|----------|----------|
| 功能堆太满 | 页面做得很重，但每块都不完整 | 只保留最代表能力的主链路 |
| 只做画面不做解释 | 页面能动，但别人不知道你为什么这样做 | 补方案说明、状态反馈和验证逻辑 |
| 忘了工程约束 | 只关注效果，忽略模型体积、移动端与可维护性 | 把 Day 6、Day 7 的意识继续保留 |

---

## 六、运行与验证

```bash
cd practice-day1
npm run dev
# 浏览器访问 http://localhost:5173
```

### 验证清单

- [ ] 如果你已经把 Day 8 页面接到路由中，通过顶部导航或直接访问 `/#/practice8` 可以打开页面，且控制台没有明显 Vue / Three.js / 资源路径报错
- [ ] 页面顶部能看到项目简介和渲染模式切换按钮，整体布局不只是一个裸画布，而是完整展示页结构
- [ ] 默认进入 **本地渲染** 模式时，产品模型会正常出现在主视区，轨道控制可用，地面与基础灯光显示正常
- [ ] 点击 **Sketchfab 备用** 后，主视区会切换到外部 Viewer 方案，HUD 和焦点文案也会同步更新
- [ ] 在右侧 **版本 Variant** 分区切换 `标准版 / 运动版 / 高配版` 时，当前颜色和焦点说明会一起变化
- [ ] 点击颜色圆点后，本地渲染模型材质颜色会立即变化；切换到外部 Viewer 模式时，页面状态仍然保持一致
- [ ] 勾选 **自动旋转产品** 后，本地模式下模型会缓慢自转；关闭后旋转停止
- [ ] 勾选 **线框模式** 后，模型材质会切换到线框显示，取消后恢复实体渲染
- [ ] 勾选或关闭 **质感增强开关** 后，页面文案与本地材质表现会出现可观察变化
- [ ] 左下 HUD 中的 `Mode / Variant / Color / Bloom / Focus` 会随着操作持续刷新
- [ ] 页面底部方案说明卡能解释当前为什么优先采用纯 Web 方案，而不是仅停留在“功能已经做完”层面

---

## 七、常见问题排查

| 问题 | 原因 | 解决方法 |
|------|------|---------|
| 本地渲染模式下模型不显示 | `product.glb` 路径错误，或模型缩放 / 位置不合适 | 检查资源路径，先把模型放到镜头前可见区域，再逐步调位置 |
| 切到 Sketchfab 后页面空白 | `SketchfabViewer` 没正确初始化，或 `modelId` 无效 | 检查 Viewer 组件封装与模型 ID，确认 iframe 是否正常渲染 |
| 切换颜色没有效果 | 模型材质不是 `MeshStandardMaterial`，或没有正确遍历子 Mesh | 在 `traverse()` 中判断材质类型，并确认模型层级 |
| 自动旋转无效 | 没有在渲染循环里更新，或当前处于外部 Viewer 模式 | 检查 `useRenderLoop()` 是否执行，以及模式判断条件 |
| 线框模式只对部分部件生效 | 模型包含多种材质或部分部件材质类型不同 | 遍历所有 Mesh 并分别判断材质类型 |
| 页面结构很完整，但交互很乱 | 没有把所有配置统一放到共享状态源 | 把 `renderMode / color / variant / bloom / focusLabel` 等状态集中管理 |
| 本地模式画质不错，但移动端卡 | 模型过大、材质太重、后处理预算过高 | 回到 Day 6 / Day 7 思路，先控体积和渲染成本 |
| 方案说明写不出来 | 只关注代码实现，没有提前思考“为什么选这个方案” | 重新从加载速度、维护成本、终端兼容和团队能力角度梳理 |

---

## 八、扩展练习（可选）

1. **加入热点讲解系统**：点击模型不同部件时，在 HUD 和右侧面板里展示对应卖点信息
2. **补一组相机机位预设**：支持“正面 / 侧面 / 细节 / 爆炸图”视角切换
3. **把 Day 6 的后处理真正接进页面**：让 Bloom 或色调映射不再只是开关，而成为完整链路
4. **加入 Day 7 的资源元数据区**：展示模型版本、压缩策略、贴图尺寸和发布日期
5. **做移动端降级策略**：在小屏设备自动关闭线框或质感增强，限制像素比
6. **把变体切换升级成完整配置组**：不同版本切换时，不只改颜色，还切换文案、镜头和局部部件可见性
7. **补一个“方案切换成本表”**：用 UI 形式展示纯 Web / Unity / Pixel Streaming 的上线代价与收益对比

---

## 九、补充：什么时候该从纯 Web 升级到引擎或流式方案

### 9.1 更适合继续坚持纯 Web 的情况

- 页面要深度嵌入现有 Web 业务系统
- 需要较强的 SEO、埋点、响应式和内容运营能力
- 交互重点是配置、展示、讲解，而不是超复杂实时模拟
- 团队主力是前端工程师与技术美术协作

### 9.2 更值得评估引擎方案的情况

- 项目核心卖点高度依赖高保真实时画质
- 已有大量 Unity / Unreal 内容资产和逻辑积累
- 服务端预算和部署链路允许更重的方案
- 对浏览器本地性能预算不敏感，反而更重视内容一致性与画质上限

### 9.3 推荐原则

> **先用最轻、最稳、最容易交付的方案完成目标，再考虑向更重的技术路线升级。**
>
> **技术预研的价值，不是证明你会用最强方案，而是证明你能选对当下最合适的方案。**

---

> **完成本阶段后**：你已经走完整个“前端技术美术 8 天入门路线”。下一步最值得做的，不是继续堆新知识点，而是把 Day 5 到 Day 8 的练习整理成一个更完整的个人作品集案例。