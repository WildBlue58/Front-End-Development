# Day 6：性能优化与后处理

> 目标：理解 Three.js 场景的性能瓶颈定位方式，掌握 `InstancedMesh`、LOD、像素比限制、`renderer.info` 性能监测和 `EffectComposer` 后处理链路，在保证帧率的同时做出更有质感的画面。

---

## 一、理论目标

### 1.1 为什么 Day 6 先做“测量”，再做“优化”

很多人一提到性能优化，第一反应就是“减面数”“关特效”“少放几个模型”。这些做法不一定错，但如果你**没有先测量瓶颈**，就很容易在错误的地方花掉大量时间。

一个实时 3D 场景大致会经历这样的链路：

```text
用户输入 / 动画状态 / Vue 响应式数据
  ↓
JavaScript 逻辑（更新矩阵、状态、材质参数、后处理参数）
  ↓
Three.js Renderer（组织 Draw Call、提交 GPU 指令）
  ↓
GPU（顶点计算、光栅化、片元着色、后处理）
  ↓
屏幕输出
```

只要链路中的某一段过重，就会导致帧率下降。所以 Day 6 的核心不是“背几个优化名词”，而是建立这样一套判断顺序：

1. **先观察指标**：FPS、Draw Calls、Triangles、Pixel Ratio、GPU 开销
2. **再判断瓶颈位置**：CPU 重，还是 GPU 重
3. **最后选择手段**：是用 `InstancedMesh`、LOD、纹理压缩，还是减少后处理通道

### 1.2 Day 6 最值得盯的性能指标

| 指标 | 代表什么 | 常见问题信号 |
|------|----------|--------------|
| FPS | 每秒渲染帧数 | 低于 60 时交互会变钝，低于 30 会明显卡顿 |
| Frame Time | 每帧耗时 | 一帧超过约 `16.7ms` 时就很难稳定 60fps |
| Draw Calls | GPU 被提交了多少次绘制命令 | 对象多、材质多、状态切换多时会快速上升 |
| Triangles | 当前帧参与渲染的三角形数 | 模型过细、细分过高、LOD 缺失时容易爆炸 |
| Geometries / Textures | 显存资源量 | 重复创建资源、不释放会造成内存压力 |
| Pixel Ratio | 实际渲染分辨率倍率 | 高分屏上不限制时，片元着色和后处理开销会暴涨 |

### 1.3 CPU 瓶颈和 GPU 瓶颈怎么区分

| 瓶颈类型 | 典型表现 | 常见原因 | 优化方向 |
|----------|----------|----------|----------|
| CPU 瓶颈 | JS 主线程忙、交互掉帧明显、Draw Calls 很高 | Mesh 太多、频繁创建销毁对象、每帧遍历过重 | 减少对象数量、实例化、缓存计算结果 |
| GPU 瓶颈 | 分辨率越高越卡、开后处理明显掉帧 | Bloom 太重、像素比过高、片元 Shader 太复杂 | 限制像素比、降低后处理强度、减少屏幕填充成本 |

一个实用经验是：

- **Draw Calls 很高**，通常优先怀疑 CPU / 提交开销
- **开 Bloom、提高分辨率后帧率大跌**，通常优先怀疑 GPU / 片元开销

### 1.4 `InstancedMesh`、LOD、后处理分别解决什么问题

| 技术 | 解决的问题 | 最适合的场景 |
|------|------------|--------------|
| `InstancedMesh` | 大量相同几何体重复绘制导致的 Draw Call 过多 | 森林、粒子块、建筑阵列、道具阵列 |
| LOD | 远处模型没必要保持高精度 | 城市场景、地形、角色群、远景建筑 |
| 像素比限制 | 高 DPI 屏幕让渲染和后处理成本倍增 | 移动端、Retina 屏、高分辨率桌面端 |
| `EffectComposer` | 让多个屏幕后期特效按通道串联 | Bloom、色调映射、描边、故障风、景深 |
| `renderer.info` / `Stats` | 帮你确认优化是否真的生效 | 所有性能调优流程都应该常驻 |

---

## 二、项目准备

### 2.1 继续沿用 `practice-day1`

本节继续使用前 5 天已经搭好的 `practice-day1` 项目：

```bash
cd practice-day1
npm install
```

如果你前几天已经装过依赖，通常不需要再补额外包；本节示例主要使用的还是：

```bash
npm install three @tresjs/core @tresjs/cientos
npm install -D @types/three
```

### 2.2 第六天建议的目录分层

Day 6 开始，页面逻辑会同时涉及：

- 场景初始化
- 实例化对象生成
- LOD 示例对象
- Bloom 后处理
- 性能监测 HUD
- 控制台调参

建议一开始就拆成页面壳 + 场景组件 + 面板组件 + 状态 composable：

```text
src/
├── pages/
│   └── Practice6Page.vue
├── components/
│   └── practice6/
│       ├── PerformanceScene.vue
│       ├── InstancedCluster.vue
│       ├── LodProbe.vue
│       ├── PerformanceControlPanel.vue
│       └── PerformanceHud.vue
├── composables/
│   └── usePerformanceSceneState.ts
└── docs/
    └── practice6.md
```

**职责建议：**

- `Practice6Page.vue`：只负责布局和组装
- `PerformanceScene.vue`：负责相机、灯光、渲染器、后处理主链路
- `InstancedCluster.vue`：负责批量实例化对象
- `LodProbe.vue`：负责展示远近切换的模型层级
- `PerformanceControlPanel.vue`：负责右侧调参面板
- `PerformanceHud.vue`：负责 FPS、Draw Calls、Triangles 等状态展示
- `usePerformanceSceneState.ts`：统一保存和共享控制参数

### 2.3 本节的练习目标场景

我们不做“华丽但不可控”的大场景，而是做一个**可度量、可调参、可观察瓶颈的实验场**。它至少包含 3 个部分：

1. **实例化对象簇**：用 `InstancedMesh` 渲染上千个小方块
2. **LOD 观察目标**：一个近看高模、远看低模的演示物体
3. **后处理链路**：开启 Bloom，观察画质提升与性能成本

这样做的好处是：

- 你能清楚看到“优化手段”和“指标变化”之间的关系
- 你不是盲目关特效，而是知道每个开关在影响什么
- 以后面对真实项目时，能更快判断该从哪里下手

### 2.4 为什么本节示例会稍微偏底层一点

前几天的练习以 TresJS 的声明式写法为主；Day 6 会适当把视角拉回到底层，因为性能优化经常需要直接接触这些对象：

- `WebGLRenderer`
- `renderer.info`
- `EffectComposer`
- `RenderPass`
- `UnrealBloomPass`
- `Stats`

这并不是说 TresJS 不适合做性能优化，而是说：

> **要学会在 Vue 组件结构和 Three.js 底层渲染控制之间自由切换。**

---

## 三、实现一个性能优化与后处理实验场

### 3.1 完整代码：`src/App.vue`

将 `src/App.vue` 临时替换为下面这份示例代码，先把 Day 6 的核心链路跑通：

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as THREE from 'three'
import Stats from 'three/addons/libs/stats.module.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

const containerRef = ref<HTMLDivElement | null>(null)

const instanceCount = ref(1500)
const enableBloom = ref(true)
const bloomStrength = ref(0.95)
const bloomRadius = ref(0.35)
const bloomThreshold = ref(0.78)
const pixelRatioCap = ref(1.75)
const autoRotate = ref(true)

const metrics = reactive({
  fps: 0,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  activeLod: 'high',
  cameraDistance: 0,
})

const drawCallHint = computed(() => {
  if (metrics.drawCalls <= 12) return '优秀'
  if (metrics.drawCalls <= 30) return '良好'
  return '偏高'
})

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let composer: EffectComposer | null = null
let bloomPass: UnrealBloomPass | null = null
let stats: Stats | null = null
let clock: THREE.Clock | null = null
let animationFrameId = 0
let instancedMesh: THREE.InstancedMesh | null = null
let lod: THREE.LOD | null = null
let floor: THREE.Mesh | null = null

function applyPixelRatio() {
  if (!renderer) return
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap.value))
}

function createLights() {
  if (!scene) return

  const ambient = new THREE.AmbientLight('#dbeafe', 0.55)
  scene.add(ambient)

  const directional = new THREE.DirectionalLight('#ffffff', 2.2)
  directional.position.set(6, 10, 8)
  directional.castShadow = true
  directional.shadow.mapSize.set(2048, 2048)
  scene.add(directional)

  const point = new THREE.PointLight('#38bdf8', 35, 40)
  point.position.set(-8, 4, 6)
  scene.add(point)
}

function createFloor() {
  if (!scene) return

  const geometry = new THREE.PlaneGeometry(60, 60, 1, 1)
  const material = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.92,
    metalness: 0.08,
  })

  floor = new THREE.Mesh(geometry, material)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -2.2
  floor.receiveShadow = true
  scene.add(floor)
}

function disposeInstancedMesh() {
  if (!scene || !instancedMesh) return
  scene.remove(instancedMesh)
  instancedMesh.geometry.dispose()
  ;(instancedMesh.material as THREE.Material).dispose()
  instancedMesh = null
}

function buildInstancedCluster() {
  if (!scene) return

  disposeInstancedMesh()

  const geometry = new THREE.BoxGeometry(0.55, 0.55, 0.55)
  const material = new THREE.MeshStandardMaterial({
    color: '#42b883',
    roughness: 0.35,
    metalness: 0.22,
  })

  instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount.value)
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  instancedMesh.castShadow = true
  instancedMesh.receiveShadow = true

  const dummy = new THREE.Object3D()
  const color = new THREE.Color()
  const columns = Math.ceil(Math.cbrt(instanceCount.value))

  for (let i = 0; i < instanceCount.value; i++) {
    const x = i % columns
    const y = Math.floor(i / columns) % columns
    const z = Math.floor(i / (columns * columns))

    dummy.position.set(
      (x - columns / 2) * 1.15,
      y * 0.95 - 0.5,
      (z - columns / 2) * 1.15,
    )
    dummy.rotation.set(i * 0.013, i * 0.021, 0)
    dummy.scale.setScalar(0.6 + (i % 5) * 0.08)
    dummy.updateMatrix()

    instancedMesh.setMatrixAt(i, dummy.matrix)

    color.setHSL(0.42 + (x / columns) * 0.18, 0.78, 0.52 + (y / columns) * 0.08)
    instancedMesh.setColorAt(i, color)
  }

  instancedMesh.instanceMatrix.needsUpdate = true
  if (instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true
  }

  instancedMesh.position.set(0, -1.5, 0)
  scene.add(instancedMesh)
}

function disposeLod() {
  if (!scene || !lod) return

  lod.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    child.geometry.dispose()
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose())
    } else {
      child.material.dispose()
    }
  })

  scene.remove(lod)
  lod = null
}

function buildLodProbe() {
  if (!scene) return

  disposeLod()

  const createMaterial = (color: string) =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: '#1e1b4b',
      emissiveIntensity: 0.2,
      roughness: 0.28,
      metalness: 0.35,
    })

  const highPoly = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, 5),
    createMaterial('#fb923c'),
  )

  const midPoly = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, 2),
    createMaterial('#f59e0b'),
  )

  const lowPoly = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.1, 0),
    createMaterial('#fde68a'),
  )

  lod = new THREE.LOD()
  lod.position.set(0, 1.4, -10)
  lod.addLevel(highPoly, 0)
  lod.addLevel(midPoly, 8)
  lod.addLevel(lowPoly, 18)
  scene.add(lod)
}

function createComposer() {
  if (!renderer || !scene || !camera || !containerRef.value) return

  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(containerRef.value.clientWidth, containerRef.value.clientHeight),
    bloomStrength.value,
    bloomRadius.value,
    bloomThreshold.value,
  )
  composer.addPass(bloomPass)
}

function updateBloomSettings() {
  if (!bloomPass) return
  bloomPass.strength = bloomStrength.value
  bloomPass.radius = bloomRadius.value
  bloomPass.threshold = bloomThreshold.value
}

function handleResize() {
  if (!containerRef.value || !renderer || !camera) return

  const width = Math.max(containerRef.value.clientWidth, 1)
  const height = Math.max(containerRef.value.clientHeight, 1)

  camera.aspect = width / height
  camera.updateProjectionMatrix()

  renderer.setSize(width, height)
  composer?.setSize(width, height)
}

function updateMetrics(delta: number) {
  if (!renderer) return

  metrics.fps = delta > 0 ? Math.round(1 / delta) : 0
  metrics.drawCalls = renderer.info.render.calls
  metrics.triangles = renderer.info.render.triangles
  metrics.geometries = renderer.info.memory.geometries
  metrics.textures = renderer.info.memory.textures

  if (camera && lod) {
    const distance = camera.position.distanceTo(lod.position)
    metrics.cameraDistance = Number(distance.toFixed(2))
    if (distance < 8) metrics.activeLod = 'high'
    else if (distance < 18) metrics.activeLod = 'mid'
    else metrics.activeLod = 'low'
  }
}

function animate() {
  if (!renderer || !scene || !camera || !clock) return

  animationFrameId = window.requestAnimationFrame(animate)
  stats?.begin()

  const delta = clock.getDelta()
  controls?.update()

  if (autoRotate.value && instancedMesh) {
    instancedMesh.rotation.y += delta * 0.18
  }

  if (enableBloom.value && composer) {
    composer.render()
  } else {
    renderer.render(scene, camera)
  }

  updateMetrics(delta)
  stats?.end()
}

watch(instanceCount, () => {
  buildInstancedCluster()
})

watch(pixelRatioCap, () => {
  applyPixelRatio()
  handleResize()
})

watch([bloomStrength, bloomRadius, bloomThreshold], () => {
  updateBloomSettings()
})

onMounted(() => {
  if (!containerRef.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#050816')
  scene.fog = new THREE.Fog('#050816', 16, 42)

  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120)
  camera.position.set(8, 6, 12)

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace

  applyPixelRatio()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  containerRef.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 1, 0)

  createLights()
  createFloor()
  buildInstancedCluster()
  buildLodProbe()
  createComposer()
  updateBloomSettings()
  handleResize()

  stats = new Stats()
  stats.dom.style.cssText = 'position:absolute;left:12px;top:12px;z-index:30;'
  containerRef.value.appendChild(stats.dom)

  clock = new THREE.Clock()
  window.addEventListener('resize', handleResize)
  animate()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.cancelAnimationFrame(animationFrameId)

  controls?.dispose()
  disposeInstancedMesh()
  disposeLod()

  if (floor) {
    floor.geometry.dispose()
    ;(floor.material as THREE.Material).dispose()
    floor = null
  }

  if (renderer && containerRef.value?.contains(renderer.domElement)) {
    containerRef.value.removeChild(renderer.domElement)
  }

  if (stats && containerRef.value?.contains(stats.dom)) {
    containerRef.value.removeChild(stats.dom)
  }

  renderer?.dispose()
  composer = null
  bloomPass = null
  scene = null
  camera = null
  renderer = null
  controls = null
  stats = null
  clock = null
})
</script>

<template>
  <div class="page">
    <div ref="containerRef" class="viewport"></div>

    <aside class="panel">
      <h3>Performance Lab</h3>
      <p class="desc">
        这个实验场同时演示 <strong>实例化渲染</strong>、<strong>LOD 距离切换</strong> 和
        <strong>Bloom 后处理</strong>。调节参数时，观察左下角 HUD 的性能指标变化。
      </p>

      <section>
        <h4>实例化</h4>
        <label>
          实例数量
          <input v-model.number="instanceCount" type="range" min="200" max="3000" step="50" />
          <span>{{ instanceCount }}</span>
        </label>
      </section>

      <section>
        <h4>渲染分辨率</h4>
        <label>
          像素比上限
          <input v-model.number="pixelRatioCap" type="range" min="1" max="2" step="0.05" />
          <span>{{ pixelRatioCap.toFixed(2) }}</span>
        </label>
      </section>

      <section>
        <h4>Bloom</h4>
        <label class="checkbox">
          <input v-model="enableBloom" type="checkbox" />
          启用 Bloom
        </label>
        <label>
          强度
          <input v-model.number="bloomStrength" type="range" min="0" max="2" step="0.01" />
          <span>{{ bloomStrength.toFixed(2) }}</span>
        </label>
        <label>
          半径
          <input v-model.number="bloomRadius" type="range" min="0" max="1" step="0.01" />
          <span>{{ bloomRadius.toFixed(2) }}</span>
        </label>
        <label>
          阈值
          <input v-model.number="bloomThreshold" type="range" min="0" max="1" step="0.01" />
          <span>{{ bloomThreshold.toFixed(2) }}</span>
        </label>
      </section>

      <section class="toggles">
        <label class="checkbox">
          <input v-model="autoRotate" type="checkbox" />
          自动旋转实例簇
        </label>
      </section>
    </aside>

    <div class="hud">
      <div><strong>FPS</strong>：{{ metrics.fps }}</div>
      <div><strong>Draw Calls</strong>：{{ metrics.drawCalls }}（{{ drawCallHint }}）</div>
      <div><strong>Triangles</strong>：{{ metrics.triangles }}</div>
      <div><strong>Geometries</strong>：{{ metrics.geometries }}</div>
      <div><strong>Textures</strong>：{{ metrics.textures }}</div>
      <div><strong>LOD</strong>：{{ metrics.activeLod }}</div>
      <div><strong>距离</strong>：{{ metrics.cameraDistance }}</div>
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
  position: relative;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at top, #0f172a 0%, #020617 55%, #020617 100%);
}

.viewport {
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
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: #e2e8f0;
  backdrop-filter: blur(14px);
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
  font-size: 16px;
  color: #a5f3fc;
}

.panel h4 {
  margin-bottom: 8px;
  color: #cbd5e1;
  font-size: 13px;
}

.desc {
  margin: 0;
  line-height: 1.6;
  color: #cbd5e1;
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

.panel span {
  min-width: 48px;
  text-align: right;
  color: #86efac;
}

.checkbox {
  grid-template-columns: auto 1fr;
}

.toggles {
  padding-top: 6px;
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
  background: rgba(2, 6, 23, 0.8);
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

- 中央偏下区域有一大簇批量渲染的立方体阵列
- 远处有一个橙色发光的观察目标，用来演示 LOD 距离切换
- 右侧控制面板可以实时调节实例数量、像素比上限和 Bloom 参数
- 左下角 HUD 会实时显示 `FPS / Draw Calls / Triangles / LOD` 等指标
- 拖动相机远近时，LOD 状态会在 `high / mid / low` 之间切换
- 打开和关闭 Bloom 时，画面高光会变化，同时性能指标也会出现差异

---

## 四、关键概念逐段解释

### 4.1 为什么 `InstancedMesh` 能明显降低 Draw Calls

普通写法如果创建 1500 个 `Mesh`，即便它们长得一样，浏览器和渲染器也会把它们当作很多次独立绘制处理。

而 `InstancedMesh` 的思路是：

- **几何体只保留一份**
- **材质只保留一份**
- **每个实例只记录自己的矩阵和颜色等差异数据**

示例中的核心代码就是：

```ts
const geometry = new THREE.BoxGeometry(0.55, 0.55, 0.55)
const material = new THREE.MeshStandardMaterial({ color: '#42b883' })
const instancedMesh = new THREE.InstancedMesh(geometry, material, 1500)
```

这意味着渲染器不需要为每个立方体都单独切换一次状态，从而显著减少 Draw Calls。

### 4.2 `dummy.updateMatrix()` 和 `setMatrixAt()` 在做什么

你会看到我们没有直接创建 1500 个对象加入场景，而是复用一个临时对象 `dummy`：

```ts
const dummy = new THREE.Object3D()

dummy.position.set(...)
dummy.rotation.set(...)
dummy.scale.setScalar(...)
dummy.updateMatrix()
instancedMesh.setMatrixAt(i, dummy.matrix)
```

这段逻辑的含义是：

1. 先用 `dummy` 计算某个实例的位置、旋转、缩放
2. 再把这个实例的最终变换矩阵写入 `InstancedMesh`
3. 下一次循环继续复用同一个 `dummy`

这种做法的优点是：

- 不用维护大量独立 `Mesh`
- 数据组织更紧凑
- 更适合做大规模重复对象

### 4.3 为什么 Day 6 要一直盯着 `renderer.info`

`Stats` 很适合让你快速看 FPS，但真正决定优化方向的，往往是 `renderer.info`：

```ts
metrics.drawCalls = renderer.info.render.calls
metrics.triangles = renderer.info.render.triangles
metrics.geometries = renderer.info.memory.geometries
metrics.textures = renderer.info.memory.textures
```

这些数据能告诉你：

- 当前一帧提交了多少次绘制
- 当前渲染了多少三角形
- 场景里积累了多少几何体和纹理资源

所以它不是“好看用的小面板”，而是优化是否生效的直接证据。

### 4.4 为什么要限制像素比 `pixelRatio`

很多人会忽略这一点，但它在移动端和 Retina 屏上非常关键。

如果你直接让渲染器使用：

```ts
renderer.setPixelRatio(window.devicePixelRatio)
```

在高分屏设备上，真实渲染分辨率可能瞬间翻倍甚至更多。对于有 Bloom、景深、屏幕后处理的页面来说，片元着色成本会大幅增加。

所以更稳妥的写法通常是：

```ts
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
```

本练习进一步把它做成了可调参数：

```ts
renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap.value))
```

这样你可以直观看到：

- 画面会不会更锐利
- FPS 会不会下降
- 后处理成本是不是明显上升

### 4.5 `EffectComposer` 为什么叫“通道链路”

后处理的本质不是“神秘黑箱”，而是把渲染结果当成纹理，再经过一层层屏幕特效处理。

示例代码里我们这样创建后处理：

```ts
composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
composer.addPass(bloomPass)
```

这里可以这样理解：

1. `RenderPass`：先把正常场景渲染出来
2. `UnrealBloomPass`：在前一步图像上提取高亮并做泛光扩散
3. 如果继续叠加别的 Pass，就会形成更长的后处理链

因此后处理本质上是：

```text
场景原始渲染
  ↓
一号屏幕特效 Pass
  ↓
二号屏幕特效 Pass
  ↓
最终输出到屏幕
```

### 4.6 LOD 不只是“省性能”，更是在管理视觉优先级

LOD 的关键思想是：

> **离玩家越远、越不重要的对象，不需要占用近距离同样的精度预算。**

示例中我们给同一个目标物体准备了 3 个层级：

```ts
lod.addLevel(highPoly, 0)
lod.addLevel(midPoly, 8)
lod.addLevel(lowPoly, 18)
```

这意味着：

- 距离很近时，用高模保证细节
- 中等距离时，用中模平衡细节和性能
- 很远时，用低模保留轮廓即可

这类做法对大型场景尤其重要，因为真正昂贵的往往不是“一个模型很复杂”，而是“远处大量看不清的模型还在按最高规格渲染”。

---

## 五、性能优化的实战判断顺序

### 5.1 推荐的排查优先级

实际项目里，建议按下面这个顺序做判断：

1. **先看像素比和屏幕尺寸**：是不是渲染分辨率太高
2. **再看 Draw Calls**：是不是对象过多、实例化缺失
3. **再看 Triangles**：是不是几何复杂度过高、LOD 缺失
4. **再看纹理和后处理**：是不是贴图太重、Pass 太多
5. **最后看 Shader 和业务逻辑**：是不是每帧 JS / GPU 算法过重

很多时候，前两步就能解决大部分问题。

### 5.2 `InstancedMesh`、`mergeGeometries()`、普通 `Mesh` 怎么选

| 方案 | 优点 | 缺点 | 适合场景 |
|------|------|------|----------|
| 普通 `Mesh` | 最灵活，单个对象最好控制 | 对象一多 Draw Calls 快速上涨 | 少量核心对象、交互对象 |
| `InstancedMesh` | 批量渲染效率高 | 每个实例不适合挂太复杂的独立逻辑 | 大量重复物体 |
| `mergeGeometries()` | 可以进一步合并成更少对象 | 后续单体控制和交互更困难 | 静态、不需要独立交互的组合场景 |

简单记忆：

- **要大量重复 → 优先想 `InstancedMesh`**
- **完全静态、不需要单体控制 → 可以考虑合并几何体**
- **少量高价值对象 → 普通 `Mesh` 更合适**

### 5.3 Bloom 并不是“越强越高级”

Bloom 之所以容易拖慢性能，是因为它本质上做了额外的屏幕空间处理。

如果你把这些参数全都拉高：

- `strength` 很大
- `radius` 很大
- `threshold` 很低
- 分辨率又很高

就会出现两个问题：

1. 性能下降明显
2. 画面会变得“糊”和“发白”

更合理的做法是：

- 只给真正需要发光的区域制造亮度对比
- 保持中等强度的 Bloom
- 配合像素比上限一起控制成本

### 5.4 “优化有效”应该怎么定义

不是帧率从 52 提到 56 就一定算成功，也不是把效果全关掉跑到 120fps 就算合理。

更好的标准是：

- **在目标设备上稳定达到体验要求**
- **在可接受的视觉损失范围内完成调优**
- **关键交互期间没有明显掉帧和卡顿**

所以 Day 6 的真正训练目标是：

> **学会在“性能预算”和“视觉预算”之间做取舍，而不是单纯追求某一个数字。**

---

## 六、运行与验证

```bash
cd practice-day1
npm run dev
# 浏览器访问 http://localhost:5173
```

### 验证清单

- [ ] 如果你已经把 Day 6 页面接到路由中，通过顶部导航或直接访问 `/#/practice6` 可以打开页面，且控制台没有明显 Three.js / TypeScript 报错
- [ ] 页面主视区能看到一组大规模立方体实例、远处的 LOD 观察目标、右侧控制面板和左下角性能 HUD
- [ ] 拖动 **实例数量** 滑杆时，场景中的立方体阵列规模会立即变化，HUD 中的 `Triangles` 会同步变化
- [ ] 即使实例数量升到 `1000+`，`Draw Calls` 依然保持在较低水平，不会随着实例数量线性暴涨
- [ ] 拖动 **像素比上限** 滑杆时，画面清晰度会有变化，同时 FPS 也会出现可观察差异
- [ ] 关闭 **Bloom** 后，画面高光泛光会减弱，通常 GPU 压力也会下降一些
- [ ] 调整 `Bloom 强度 / 半径 / 阈值` 后，远处观察目标周围的发光表现会实时变化
- [ ] 旋转或缩放相机观察远处目标时，HUD 中的 `LOD` 字段会在 `high / mid / low` 之间切换
- [ ] 勾选 **自动旋转实例簇** 后，大批量实例会缓慢转动；取消勾选后停止
- [ ] 刷新页面或重新进入场景后，不会因为重复创建渲染器、Stats 面板或几何体而导致页面叠加异常

---

## 七、常见问题排查

| 问题 | 原因 | 解决方法 |
|------|------|---------|
| 实例数量很多，但 `Draw Calls` 还是很高 | 实际上没有用 `InstancedMesh`，而是创建了很多普通 `Mesh` | 检查是否用了 `new THREE.InstancedMesh(...)`，并确保重复对象共享同一份几何体和材质 |
| 改了实例变换但画面没更新 | 写入矩阵后没标记更新 | 确认有 `instancedMesh.instanceMatrix.needsUpdate = true` |
| 实例颜色没有变化 | 没有调用 `setColorAt()` 或 `instanceColor` 没更新 | 检查 `setColorAt()` 是否执行，并在需要时设置 `instanceColor.needsUpdate = true` |
| Bloom 打开后完全看不出来 | 阈值太高、场景里没有足够亮的区域 | 降低 `threshold`，或者提高发光区域亮度 |
| Bloom 一开就很卡 | 像素比太高或后处理强度过重 | 先限制 `pixelRatio`，再调低 `strength` / `radius` |
| LOD 没有切换 | 相机距离变化不够明显，或阈值设置不合理 | 检查相机是否真的远离对象，并调整 `addLevel()` 的距离参数 |
| `renderer.info` 数值看起来不对 | 读取时机不对，或场景还没完成一帧渲染 | 尽量在每帧 render 之后再读取 `renderer.info` |
| 页面尺寸变化后画面被拉伸 | 没有同步更新相机宽高比和渲染器尺寸 | 在 `resize` 回调里同时更新 `camera.aspect`、`renderer.setSize()` 和 `composer.setSize()` |
| 重进页面后越来越卡 | 旧的渲染器、几何体、材质没有释放 | 在组件卸载时 `dispose()` 相关资源，并移除 DOM 挂载节点 |

---

## 八、扩展练习（可选）

1. **做一个“普通 Mesh vs InstancedMesh”对比模式**：同一批对象支持两种渲染方式切换，观察 Draw Calls 和 FPS 的实际差异
2. **补一条 FXAA 或色调映射链路**：在 Bloom 之外再加入抗锯齿或色调映射，对比画质和成本变化
3. **为 LOD 目标加入更多层级**：例如 `ultra / high / mid / low` 四档，并把阈值做成可调参数
4. **加上可见性剔除思路**：只在相机可见区域生成或激活对象，体会“减少无效渲染”的收益
5. **加入纹理压缩实验**：准备一张原始贴图和一张压缩贴图，对比显存和加载体验
6. **把性能指标写进统一 HUD**：除了 FPS，再加入内存占用、当前分辨率倍率、当前激活 Pass 数量等信息
7. **做移动端降级方案**：检测设备能力，在低性能设备上自动降低像素比、关闭 Bloom、减少实例数量

---

## 九、补充：什么时候先做“减法优化”，什么时候再做“画面增强”

### 9.1 更适合先做减法优化的情况

- 页面已经明显卡顿
- 交互响应发黏
- 设备差异很大，需要先保底体验
- 模型、贴图、后处理一起堆上来后已经超预算

这时最应该先做的是：

- 限制像素比
- 降低 Draw Calls
- 给远景做 LOD
- 关闭或弱化高成本后处理

### 9.2 更适合在稳定后做画面增强的情况

- 已经能稳定跑在目标帧率附近
- 关键交互流程不卡
- 场景主体层次已经清楚
- 团队开始进入“质感提升”阶段

这时再去加：

- Bloom
- 色调映射
- 轻量屏幕后处理
- 更好的材质与光照表现

### 9.3 推荐原则

> **先把帧率保住，再把气质做出来。**
>
> **优化不是和画面对立，而是为了让画面在真实设备上可持续地成立。**

---

> **下一步**：Day 7 将进入美术管线搭建，重点学习 `Blender → glTF → Web` 的资产导出流程、模型减面、纹理压缩以及前端加载优化策略。
