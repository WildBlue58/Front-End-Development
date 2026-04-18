# Day 5：Vue3 响应式系统与 3D 场景交互

> 目标：掌握 Vue3 `ref / reactive / computed / watch` 与 TresJS 场景的联动方式，理解如何用响应式状态驱动模型变换、材质参数、鼠标拾取反馈与控制面板交互。

---

## 一、理论目标

### 1.1 为什么 3D 场景也需要响应式系统

在普通 Vue 页面里，我们习惯用响应式状态去驱动 DOM；在 3D 场景里，本质上也是一样的，只不过“被驱动的对象”从 HTML 元素变成了相机、网格、材质和灯光。

```text
Vue 状态层（ref / reactive / computed）
  └─ 保存：位置、旋转、颜色、选中状态、悬停状态、材质参数

TresJS 模板层
  └─ 把响应式数据绑定到 <TresMesh> / <TresMaterial> / <TresLight>

Three.js 场景对象
  └─ 实时更新 position / rotation / scale / color / metalness / roughness

用户交互
  └─ click / pointer-enter / pointer-leave / 控制面板输入

结果
  └─ UI 改状态 → 3D 立即反馈
  └─ 3D 交互 → 状态面板同步变化
```

**这就是前端技术美术里很核心的一条链路：**

- **控制面板修改状态**
- **状态驱动 3D 场景更新**
- **3D 交互反过来更新状态**
- **形成双向联动闭环**

### 1.2 Vue3 响应式 API 在 3D 场景中的分工

| API | 适合存什么 | 在本练习中的典型用途 |
|-----|------------|----------------------|
| `ref` | 单个简单值 | 当前是否选中、当前悬停对象、自动旋转开关 |
| `reactive` | 一组结构化状态 | 模型位置、旋转、材质参数、UI 面板配置 |
| `computed` | 派生状态 | 当前标签文本、选中提示色、是否显示高亮 |
| `watch` | 监听副作用 | 状态变化时打印日志、同步非声明式对象、做限制和校验 |

一个常见的状态结构会长这样：

```ts
const modelState = reactive({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1,
  color: '#42b883',
  metalness: 0.35,
  roughness: 0.55,
  wireframe: false,
})

const isSelected = ref(false)
const hoveredName = ref<string | null>(null)
```

### 1.3 TresJS 的“声明式响应式绑定”是什么意思

Three.js 原生写法通常是命令式更新：

```ts
mesh.position.x = 1.2
mesh.material.color.set('#42b883')
mesh.scale.setScalar(1.5)
```

而在 TresJS 中，你会更常看到这种写法：

```vue
<TresMesh
  :position="[modelState.position.x, modelState.position.y, modelState.position.z]"
  :scale="modelState.scale"
>
  <TresBoxGeometry />
  <TresMeshStandardMaterial :color="modelState.color" />
</TresMesh>
```

**区别在于：**

- 原生 Three.js：你要自己手动找到对象并赋值
- TresJS：你把状态绑定到模板，Vue 会帮你在状态变化时刷新对应属性

所以，TresJS 很适合拿来做“**前端式交互场景**”：

- 右侧参数面板
- hover / click 反馈
- 材质和变换实时预览
- 多对象状态同步切换

### 1.4 什么是 Raycasting（射线拾取）

在 3D 场景里，鼠标点击的不是 DOM 元素，而是屏幕上一块投影出来的 3D 物体。

为了知道鼠标到底点中了哪个物体，Three.js 会做一件事：

```text
鼠标屏幕坐标
  ↓
转换成标准化设备坐标（NDC）
  ↓
从相机发出一条射线
  ↓
和场景中的 Mesh 做相交检测
  ↓
得到命中的对象、命中点、法线、距离等信息
```

这套机制就叫 **Raycasting（射线拾取）**。

在 TresJS 中，很多基础拾取交互已经帮你桥接成了组件事件，例如：

- `@pointer-enter`
- `@pointer-leave`
- `@click`
- `@pointer-move`

这意味着你不一定每次都要手写完整的 `Raycaster` 流程，但你要理解：

> **这些事件背后，本质上就是 Raycasting。**

### 1.5 3D 交互状态一般分哪几层

做交互式场景时，建议把状态拆成 3 层：

| 层级 | 内容 | 示例 |
|------|------|------|
| 基础状态 | 物体自身参数 | 位置、旋转、缩放、颜色、材质 |
| 交互状态 | 用户当前操作反馈 | hovered、selected、dragging |
| 派生状态 | 由前两层计算出来 | 高亮颜色、提示文本、面板标题 |

例如：

```ts
const interactionState = reactive({
  hoveredId: '',
  selectedId: '',
  autoRotateWhenSelected: true,
})

const highlightColor = computed(() => {
  return interactionState.selectedId ? '#f59e0b' : '#42b883'
})
```

这样做的好处是：

- **逻辑更清晰**：哪些是原始状态，哪些是派生结果，一眼能看懂
- **更容易扩展**：后面加多个物体、加拖拽、加 HUD 都不会乱
- **更符合组件化设计**：场景组件和面板组件可以共享状态源

---

## 二、项目准备

### 2.1 继续沿用 `practice-day1`

本节继续使用前 4 天已经搭好的 `practice-day1` 项目：

```bash
cd practice-day1
npm install
```

确保至少有这些基础依赖：

```bash
npm install three @tresjs/core @tresjs/cientos
npm install -D @types/three
```

### 2.2 第五天建议的目录分层

为了保持和前几天一致的结构，建议把 Day 5 拆成“页面壳 + 场景组件 + 控制面板 + 状态仓库”：

```text
src/
├── pages/
│   └── Practice5Page.vue
├── components/
│   └── practice5/
│       ├── InteractiveScene.vue
│       ├── InteractiveMesh.vue
│       ├── SceneHud.vue
│       └── InteractionControlPanel.vue
├── composables/
│   └── useInteractiveSceneState.ts
└── docs/
    └── practice5.md
```

**职责建议：**

- `Practice5Page.vue`：只负责组装页面
- `InteractiveScene.vue`：负责 `TresCanvas`、相机、灯光、轨道控制
- `InteractiveMesh.vue`：负责真正的 3D 对象和交互事件
- `InteractionControlPanel.vue`：负责右侧 UI 控制台
- `useInteractiveSceneState.ts`：负责共享状态

### 2.3 本节的练习目标场景

我们这次不追求复杂模型，而是先做一个 **可交互的材质方块 / 球体实验台**。它至少要满足这些功能：

1. 通过面板控制位置、旋转、缩放
2. 通过面板实时修改颜色、金属度、粗糙度、线框模式
3. 鼠标移入时高亮，移出时恢复
4. 点击物体后切换选中状态
5. 选中后物体自动旋转
6. HUD 面板同步显示当前交互状态

这类练习非常适合打通“**Vue 业务状态 ↔ 3D 表现 ↔ 用户交互**”的闭环。

---

## 三、实现一个响应式 3D 交互场景

### 3.1 完整代码：`src/App.vue`

将 `src/App.vue` 临时替换为下面这份示例代码，先把核心交互链路跑通：

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { TresCanvas, useRenderLoop } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'

// --------------------------------------------------
// 一、共享状态：控制面板 + 场景共用
// --------------------------------------------------
const modelState = reactive({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1,
  color: '#42b883',
  metalness: 0.35,
  roughness: 0.55,
  wireframe: false,
})

const hoveredObject = ref<string | null>(null)
const selectedObject = ref<string | null>(null)
const autoRotate = ref(true)
const interactionCount = ref(0)

// --------------------------------------------------
// 二、派生状态：给 UI 和材质反馈使用
// --------------------------------------------------
const isSelected = computed(() => selectedObject.value === 'hero-box')
const isHovered = computed(() => hoveredObject.value === 'hero-box')

const displayColor = computed(() => {
  if (isSelected.value) return '#f59e0b'
  if (isHovered.value) return '#38bdf8'
  return modelState.color
})

const statusText = computed(() => {
  if (isSelected.value) return '已选中：点击可取消'
  if (isHovered.value) return '悬停中：点击可选中'
  return '空闲中：移动鼠标到模型上试试'
})

// --------------------------------------------------
// 三、watch：监听状态变化做副作用
// --------------------------------------------------
watch(
  () => modelState.scale,
  (value) => {
    console.log('[Practice5] 当前缩放：', value)
  },
)

watch(selectedObject, (value) => {
  console.log('[Practice5] 选中对象：', value ?? '无')
})

// --------------------------------------------------
// 四、交互事件
// --------------------------------------------------
const onPointerEnter = (event: any) => {
  hoveredObject.value = event.object?.name ?? 'unknown'
  document.body.style.cursor = 'pointer'
}

const onPointerLeave = () => {
  hoveredObject.value = null
  document.body.style.cursor = 'default'
}

const onClick = (event: any) => {
  const name = event.object?.name ?? 'unknown'
  selectedObject.value = selectedObject.value === name ? null : name
  interactionCount.value += 1
}

// --------------------------------------------------
// 五、渲染循环：选中时自动旋转
// --------------------------------------------------
const { onLoop } = useRenderLoop()

onLoop(({ delta }) => {
  if (!autoRotate.value || !isSelected.value) return
  modelState.rotation.y += delta * 0.85
})

onBeforeUnmount(() => {
  document.body.style.cursor = 'default'
})
</script>

<template>
  <div class="page">
    <TresCanvas clear-color="#08111f" window-size shadows>
      <TresPerspectiveCamera :position="[0, 1.6, 5.2]" />
      <OrbitControls />

      <!-- 主交互物体 -->
      <TresMesh
        name="hero-box"
        :position="[modelState.position.x, modelState.position.y, modelState.position.z]"
        :rotation="[modelState.rotation.x, modelState.rotation.y, modelState.rotation.z]"
        :scale="modelState.scale"
        cast-shadow
        receive-shadow
        @pointer-enter="onPointerEnter"
        @pointer-leave="onPointerLeave"
        @click="onClick"
      >
        <TresBoxGeometry :args="[1.25, 1.25, 1.25]" />
        <TresMeshStandardMaterial
          :color="displayColor"
          :metalness="modelState.metalness"
          :roughness="modelState.roughness"
          :wireframe="modelState.wireframe"
          :emissive="isHovered ? '#0ea5e9' : '#000000'"
          :emissive-intensity="isHovered ? 0.35 : 0"
        />
      </TresMesh>

      <!-- 地面参考 -->
      <TresMesh :rotation="[-Math.PI / 2, 0, 0]" :position="[0, -1.15, 0]" receive-shadow>
        <TresPlaneGeometry :args="[10, 10, 1, 1]" />
        <TresMeshStandardMaterial color="#111827" roughness="0.95" metalness="0.05" />
      </TresMesh>

      <!-- 辅助参照球 -->
      <TresMesh :position="[2.2, -0.3, -0.8]">
        <TresSphereGeometry :args="[0.5, 48, 48]" />
        <TresMeshStandardMaterial color="#a78bfa" metalness="0.1" roughness="0.2" />
      </TresMesh>

      <TresAmbientLight :intensity="0.45" />
      <TresDirectionalLight
        :position="[4, 6, 3]"
        :intensity="1.8"
        color="#ffffff"
        cast-shadow
      />
      <TresPointLight :position="[-3, 2, 2]" color="#38bdf8" :intensity="18" :distance="18" />
    </TresCanvas>

    <!-- 右侧控制面板 -->
    <aside class="panel">
      <h3>响应式交互控制台</h3>
      <p class="status">{{ statusText }}</p>

      <section>
        <h4>位置 Position</h4>
        <label>
          X
          <input v-model.number="modelState.position.x" type="range" min="-2.5" max="2.5" step="0.01" />
          <span>{{ modelState.position.x.toFixed(2) }}</span>
        </label>
        <label>
          Y
          <input v-model.number="modelState.position.y" type="range" min="-0.2" max="2.2" step="0.01" />
          <span>{{ modelState.position.y.toFixed(2) }}</span>
        </label>
        <label>
          Z
          <input v-model.number="modelState.position.z" type="range" min="-2.5" max="2.5" step="0.01" />
          <span>{{ modelState.position.z.toFixed(2) }}</span>
        </label>
      </section>

      <section>
        <h4>材质 Material</h4>
        <label>
          颜色
          <input v-model="modelState.color" type="color" />
        </label>
        <label>
          金属度
          <input v-model.number="modelState.metalness" type="range" min="0" max="1" step="0.01" />
          <span>{{ modelState.metalness.toFixed(2) }}</span>
        </label>
        <label>
          粗糙度
          <input v-model.number="modelState.roughness" type="range" min="0" max="1" step="0.01" />
          <span>{{ modelState.roughness.toFixed(2) }}</span>
        </label>
      </section>

      <section>
        <h4>变换 Transform</h4>
        <label>
          缩放
          <input v-model.number="modelState.scale" type="range" min="0.5" max="2.4" step="0.01" />
          <span>{{ modelState.scale.toFixed(2) }}</span>
        </label>
        <label>
          Y 旋转
          <input v-model.number="modelState.rotation.y" type="range" min="-3.14" max="3.14" step="0.01" />
          <span>{{ modelState.rotation.y.toFixed(2) }}</span>
        </label>
      </section>

      <section class="toggles">
        <label class="checkbox">
          <input v-model="modelState.wireframe" type="checkbox" />
          线框模式
        </label>
        <label class="checkbox">
          <input v-model="autoRotate" type="checkbox" />
          选中后自动旋转
        </label>
      </section>
    </aside>

    <!-- 左下角 HUD -->
    <div class="hud">
      <div><strong>Hovered</strong>：{{ hoveredObject ?? '无' }}</div>
      <div><strong>Selected</strong>：{{ selectedObject ?? '无' }}</div>
      <div><strong>交互次数</strong>：{{ interactionCount }}</div>
      <div><strong>当前颜色</strong>：{{ displayColor }}</div>
    </div>
  </div>
</template>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.page {
  width: 100%;
  height: 100%;
}

.panel {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 20;
  width: 320px;
  max-height: calc(100vh - 40px);
  overflow: auto;
  padding: 16px;
  border-radius: 16px;
  background: rgba(7, 12, 28, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(12px);
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-size: 13px;
}

.panel h3,
.panel h4 {
  margin: 0;
}

.panel h3 {
  color: #a5f3fc;
  font-size: 16px;
}

.panel h4 {
  margin-bottom: 8px;
  color: #cbd5e1;
  font-size: 13px;
}

.panel section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel label {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
}

.panel input[type='range'] {
  grid-column: 1 / span 1;
}

.panel input[type='color'] {
  width: 100%;
  height: 34px;
  border: none;
  background: transparent;
}

.panel span {
  min-width: 46px;
  text-align: right;
  color: #86efac;
}

.status {
  margin: 0;
  color: #7dd3fc;
  line-height: 1.5;
}

.checkbox {
  grid-template-columns: auto 1fr;
}

.toggles {
  padding-top: 4px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.hud {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 20;
  min-width: 220px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(2, 6, 23, 0.78);
  border: 1px solid rgba(56, 189, 248, 0.18);
  color: #dbeafe;
  backdrop-filter: blur(10px);
  line-height: 1.7;
  font-size: 13px;
}
</style>
```

### 3.2 跑起来后你应该看到什么

页面正常时，应该出现以下效果：

- 一个可以被 hover 和 click 的立方体
- 右侧控制面板可以实时调节位置、缩放、材质参数
- 鼠标移入物体后会有高亮反馈和光标变化
- 点击后物体进入“选中”状态
- 如果开启自动旋转，选中后会持续绕 Y 轴旋转
- 左下角 HUD 会实时显示当前悬停对象、选中对象和交互次数

---

## 四、关键概念逐行解释

### 4.1 为什么 `reactive` 很适合存 3D 参数组

像位置、旋转、材质参数这种值通常不是孤立的，而是一组相关数据。

```ts
const modelState = reactive({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1,
  color: '#42b883',
  metalness: 0.35,
  roughness: 0.55,
})
```

这样比把它们拆成十几个 `ref()` 更适合做“控制台式”的交互场景，因为：

- 参数集中，便于统一管理
- 可以直接整组传给组件
- 更符合“一个物体拥有一组属性”的建模方式

### 4.2 为什么 `computed` 适合做交互反馈色

我们不一定要把“悬停高亮色”也存成一个独立状态，因为它其实是派生结果：

```ts
const displayColor = computed(() => {
  if (isSelected.value) return '#f59e0b'
  if (isHovered.value) return '#38bdf8'
  return modelState.color
})
```

这段逻辑表达得很清楚：

1. 选中优先级最高
2. 悬停其次
3. 默认才使用用户设置的基础颜色

这种写法的好处是：

- 减少冗余状态
- 逻辑集中在一个地方
- UI 与材质都能复用同一个结果

### 4.3 `watch` 在 3D 场景里最常做什么

在 TresJS 的声明式绑定里，很多属性更新并不需要你手动写 `watch`。但 `watch` 依然非常重要，因为它适合处理“**副作用**”：

```ts
watch(
  () => modelState.scale,
  (value) => {
    console.log('[Practice5] 当前缩放：', value)
  },
)
```

常见用途包括：

- 打印调试日志
- 限制参数范围
- 当状态变化时同步到本地存储
- 和非声明式对象联动
- 触发音效、提示、埋点等副作用

**判断原则：**

- 只是把值绑定到模板 → 直接 `:` 绑定即可
- 需要额外动作 → 用 `watch`

### 4.4 为什么选中旋转要写进 `useRenderLoop`

物体持续转动这件事，属于“**每帧都要更新**”的行为，所以应该放在渲染循环里：

```ts
onLoop(({ delta }) => {
  if (!autoRotate.value || !isSelected.value) return
  modelState.rotation.y += delta * 0.85
})
```

这里有两个关键点：

- `delta` 是这一帧距离上一帧过去的时间，适合做与帧率无关的动画
- 是否旋转不是写死的，而是由 `autoRotate` 和 `isSelected` 两个状态共同决定

这正是“响应式状态 + 实时渲染循环”结合的典型写法。

### 4.5 Pointer 事件和 DOM 事件有什么相似与不同

在 TresJS 中，你会觉得这些写法很像 Vue 的 DOM 事件：

```vue
<TresMesh
  @pointer-enter="onPointerEnter"
  @pointer-leave="onPointerLeave"
  @click="onClick"
>
```

确实很像，但要知道两者并不完全一样：

| 维度 | DOM 元素事件 | 3D Mesh 事件 |
|------|--------------|--------------|
| 命中依据 | 盒模型 / 真实 DOM 区域 | Raycasting 射线检测 |
| 目标对象 | HTML 元素 | Three.js 对象 |
| 返回信息 | 鼠标位置、键盘修饰键等 | 命中对象、交点、面法线、UV 等 |
| 常见用途 | 表单、按钮、拖拽 | 拾取、高亮、选中、3D HUD |

所以你可以把 TresJS 事件理解成：

> **“看起来像 Vue 事件，但底层是 3D 拾取系统。”**

### 4.6 为什么 HUD 面板也应该从同一份状态读数据

左下角的 HUD 并没有单独维护自己的数据，而是直接使用：

- `hoveredObject`
- `selectedObject`
- `interactionCount`
- `displayColor`

这样做的好处是：

- HUD 和场景不会出现显示不一致
- 控制面板、提示文案、材质反馈都共用同一数据源
- 更容易拆成独立组件，例如 `SceneHud.vue`

这也是后续做复杂交互系统时非常重要的原则：

> **单一数据源（Single Source of Truth）**。

---

## 五、把交互逻辑进一步组件化

### 5.1 推荐的拆分方式

当 Day 5 练习开始变复杂时，不建议把所有内容都堆在 `App.vue` 里，可以拆成下面这种结构：

```text
Practice5Page.vue
  ├─ InteractiveScene.vue          # 画布、相机、灯光、环境
  ├─ InteractionControlPanel.vue   # 参数调节面板
  └─ SceneHud.vue                  # 状态展示 HUD
```

场景里的主物体还可以继续拆：

```text
InteractiveScene.vue
  └─ InteractiveMesh.vue           # hover / select / click 交互对象
```

### 5.2 状态仓库 `useInteractiveSceneState.ts` 示例

```ts
import { computed, reactive, ref } from 'vue'

const modelState = reactive({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1,
  color: '#42b883',
  metalness: 0.35,
  roughness: 0.55,
  wireframe: false,
})

const hoveredObject = ref<string | null>(null)
const selectedObject = ref<string | null>(null)
const autoRotate = ref(true)

const isSelected = computed(() => selectedObject.value === 'hero-box')
const isHovered = computed(() => hoveredObject.value === 'hero-box')

export function useInteractiveSceneState() {
  return {
    modelState,
    hoveredObject,
    selectedObject,
    autoRotate,
    isSelected,
    isHovered,
  }
}
```

这种写法会让：

- 场景组件负责渲染
- 面板组件负责控制
- HUD 组件负责显示
- 状态 composable 负责统一管理数据

和前几天的 `useSceneState.ts`、`useModelState.ts`、`usePBRState.ts`、`useWaveShaderState.ts` 的模式完全一致。

### 5.3 什么时候应该用 props，什么时候应该读共享状态

这是组件设计里很常见的一个问题：

| 场景 | 更推荐的方式 |
|------|--------------|
| 组件只在当前页面用一次，且所有控制都共享 | 直接读 composable 共享状态 |
| 组件未来可能被复用到多个页面 | 用 `props` 暴露参数，再由上层传入 |
| 既要复用，又要连接全局状态 | 外层页面读状态，内层组件吃 `props` |

**经验建议：**

- 页面级实验场：共享状态优先
- 通用 3D 组件：`props` 优先

这样后面升级为更大项目时，结构不会失控。

---

## 六、手写 Raycaster 的思路补充

虽然本节示例主要使用 TresJS 事件，但理解手写 Raycaster 仍然很重要。

### 6.1 原生 Three.js 版本的核心流程

```ts
import * as THREE from 'three'

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

function handlePointerMove(event: PointerEvent, camera: THREE.Camera, targets: THREE.Object3D[]) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(targets, true)

  if (intersects.length > 0) {
    console.log('命中对象：', intersects[0].object.name)
  }
}
```

### 6.2 `intersectObjects()` 返回了什么

返回值通常是一个按距离排序的数组，每一项都包含：

| 字段 | 含义 |
|------|------|
| `object` | 被命中的 Three.js 对象 |
| `point` | 射线命中的世界坐标点 |
| `distance` | 命中点到射线原点的距离 |
| `face` | 命中的三角面信息 |
| `uv` | 命中点对应的 UV 坐标 |

这些信息在很多场景都很有用：

- 点击模型某个局部显示 tooltip
- 在平面上点击生成标记点
- 根据命中的 UV 做局部贴花 / 涂抹
- 根据交点位置触发粒子或涟漪效果

---

## 七、运行与验证

```bash
cd practice-day1
npm run dev
# 浏览器访问 http://localhost:5173
```

### 验证清单

- [ ] 通过顶部导航或直接访问 `/#/practice5` 可以打开 Day 5 页面，且控制台没有 Vue / TypeScript 报错
- [ ] 页面主视区能看到一个可交互立方体、一个深色地面、一个右后方参照球，以及顶部说明卡、右侧控制台、左下角 HUD
- [ ] 在右侧 **Position** 面板拖动 `X / Y / Z` 滑杆时，立方体会立即在场景中同步移动
- [ ] 在 **Rotation** 面板拖动 `X / Y / Z` 滑杆时，立方体朝向会实时变化；拖动 **统一缩放** 时，立方体会整体放大或缩小
- [ ] 修改 **基础颜色 / 金属度 / 粗糙度** 后，立方体材质会即时变化，左下角 HUD 中的“当前颜色”也会同步更新
- [ ] 勾选 **线框模式** 后，立方体会切换为线框显示；取消勾选后恢复为实体材质
- [ ] 鼠标移入立方体时，光标会变为手型，立方体颜色切换为高亮蓝色，并出现轻微自发光反馈
- [ ] 鼠标移出立方体后，光标会恢复默认样式；若当前未选中，立方体颜色也会恢复为面板设定的基础颜色
- [ ] 点击立方体后会进入选中状态：顶部说明卡与左下角 HUD 中的 `Selected` 字段同步显示 `hero-box`，立方体颜色切换为选中橙色
- [ ] 再次点击已选中的立方体时，会取消选中；HUD 中的 `Selected` 会恢复为“无”，状态提示文案也会切回悬停或空闲状态
- [ ] 保持立方体处于选中状态时，勾选 **选中后自动旋转** 会让它持续绕 `Y` 轴旋转；取消勾选或取消选中后旋转会停止
- [ ] 左下角 HUD 中的 `Hovered`、`Selected`、`交互次数` 会随着 hover / click / 取消选中持续刷新，交互次数会在每次点击时递增


---

## 八、常见问题排查

| 问题 | 原因 | 解决方法 |
|------|------|---------|
| 鼠标移到物体上没有任何反馈 | 物体没有绑定 Pointer 事件 | 检查是否添加 `@pointer-enter` / `@pointer-leave` / `@click` |
| 面板改了值但场景没变化 | 没有把响应式状态绑定到 Tres 组件属性 | 检查 `:position`、`:scale`、`:color` 等是否直接引用了状态 |
| 自动旋转没有效果 | 渲染循环没有执行或条件判断未满足 | 检查 `useRenderLoop()` 是否正常调用，以及 `isSelected` / `autoRotate` 条件 |
| hover 后颜色不对 | 高亮颜色逻辑和基础颜色逻辑混在一起 | 用 `computed` 单独生成 `displayColor` |
| 点击后状态不更新 | 没有正确读取事件对象的名称 | 检查 `event.object?.name` 是否存在，并确保 Mesh 设置了 `name` |
| 光标移出后仍然是手型 | 忘记在离开或卸载时重置 cursor | 在 `onPointerLeave` 和 `onBeforeUnmount` 中恢复 `document.body.style.cursor` |
| 材质高亮不明显 | 光照太弱或 emissive 强度太低 | 提高光照强度，或调大 `emissive-intensity` |
| 物体看起来“变形”而不是缩放 | 绑定错了属性或传参格式不对 | `:scale="modelState.scale"` 为统一缩放；非统一缩放需传数组 |
| 3D 事件表现和预期不一致 | 误把 Tres 事件完全当作 DOM 事件理解 | 记住其底层是 Raycasting，命中判定依赖相机与物体位置 |

---

## 九、扩展练习（可选）

1. **多对象选中系统**：场景中放 3 个不同几何体，实现点击任意对象后右侧面板显示对应对象的独立参数
2. **拖拽式移动**：结合鼠标射线与地面平面交点，实现拖动物体在地面上移动
3. **材质预设切换**：为当前物体制作“塑料 / 金属 / 陶瓷 / 发光体”四种预设，一键切换
4. **交互事件时间轴**：把 hover、click、取消选中等行为记录成日志列表，显示在 HUD 中
5. **状态持久化**：用 `watch` 把位置、颜色、材质参数保存到 `localStorage`，刷新页面后恢复
6. **模型拾取升级**：把当前的立方体替换成 GLB 模型，并实现点击模型不同部位显示不同提示
7. **UI 与 Shader 联动**：把 Day 4 的 Shader 材质参数也接到 Day 5 的控制台里，让交互系统直接驱动 Shader uniform

### 9.1 扩展功能验收清单

- [ ] 进入 `/#/practice5` 后，场景中可以同时看到 **主控立方体 / 信号球体 / Porsche 911 模型** 三个可编辑目标，右侧控制台会显示当前聚焦对象名称
- [ ] 点击不同对象时，右侧控制台的滑杆、颜色卡和材质预设会切换到该对象的独立参数，左上说明卡与左下 HUD 的 `Focused` 状态同步变化
- [ ] 按住任意对象并在地面上移动鼠标时，对象会沿地面平面拖拽移动；拖拽期间 OrbitControls 会被锁定，松开鼠标后恢复
- [ ] 在 **材质预设** 分区切换 `塑料 / 金属 / 陶瓷 / 发光体` 时，当前对象的颜色、金属度、粗糙度和发光强度会整组变化，并在时间轴记录一条 `preset-change`
- [ ] 左下 HUD 的 **事件时间轴** 会记录 `hover-start / hover-end / select / drag-start / drag-end / part-hit / preset-change / restore-from-storage` 等关键事件，且最新事件排在最上方
- [ ] 调整对象位置、旋转、缩放、材质参数后刷新页面，场景会优先从 `localStorage` 恢复上次编辑现场；点击 **恢复默认** 后会回到初始工作台布局
- [ ] 点击 Porsche 911 模型不同部位（如漆面、轮毂、灯组、格栅等）时，左上说明卡、右侧控制台和左下 HUD 都会显示对应部位提示文案
- [ ] 打开 **Shader 联动** 分区后，场景右后方的 Shader 预览会随着当前对象颜色、拖拽状态和面板中的波幅 / 速度 / 涟漪强度 / HUD 强度等参数变化而同步更新
- [ ] 关闭 **跟随当前对象颜色** 后，Shader 预览会改为读取控制台中的自定义 `颜色 A / 颜色 B`；重新打开后又会回到跟随当前对象主色的模式

---

## 十、补充：什么时候用响应式绑定，什么时候直接操作 Three.js 对象


不是所有场景都必须“纯响应式”，实际项目里常常是两种方式混合使用。

### 10.1 更适合用 Vue 响应式绑定的情况

- 面板参数调整
- 选中 / 悬停 / 激活状态
- 场景模式切换
- 配置驱动的材质和灯光参数
- 需要和业务 UI 保持同步的交互

### 10.2 更适合直接操作 Three.js 对象的情况

- 高频粒子系统
- 大量实例化对象的矩阵更新
- 复杂后处理或自定义渲染管线
- 需要精细控制性能的底层逻辑

### 10.3 推荐原则

> **和 UI / 业务强相关的交互状态，优先放进 Vue 响应式系统；**
> **和底层渲染性能强相关的高频计算，优先直接操作 Three.js 对象。**

掌握这个边界，你就能在“前端工程思维”和“实时渲染思维”之间切换得更自然。

---

> **下一步**：Day 6 将进入性能优化与后处理，重点学习 `InstancedMesh`、LOD、后处理通道以及如何在保证画面效果的同时控制 Draw Call 与帧率。