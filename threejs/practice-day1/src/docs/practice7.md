# Day 7：美术管线搭建（Blender → glTF → Web）

> 目标：理解技术美术在前端项目中的资产流转方式，掌握从 `Blender` 导出 `glTF / GLB`、使用 `gltf-transform` 做资源压缩与整理、在 Vue + Three.js 项目中接入 `GLTFLoader / DRACOLoader`、制作加载进度反馈，并逐步建立一套可复用的 Web 端资产规范。

---

## 一、理论目标

### 1.1 为什么 Day 7 要专门讲“资产管线”

前 6 天我们主要关注的是：

- 如何把 3D 画面跑起来
- 如何把交互、材质、Shader、性能控制接进前端页面
- 如何在 Vue 和 Three.js 之间建立稳定的数据流

但真实项目里，**3D 场景能不能顺利落地，往往不取决于你会不会写某个 Shader，而取决于资产能不能稳定进入 Web 运行环境。**

一个前端技术美术常见的工作链路通常像这样：

```text
美术源文件（Blender / DCC）
  ↓
模型整理（命名、层级、材质、贴图、动画）
  ↓
导出 glTF / GLB
  ↓
压缩与优化（Draco / Meshopt / 纹理缩放 / 格式转换）
  ↓
前端项目接入（GLTFLoader / 进度条 / 错误处理）
  ↓
运行时验证（体积、性能、材质正确性、动画正确性）
```

如果这条链路没有打通，就会出现很多典型问题：

- 模型导出来了，但 Web 里贴图丢失
- 场景里能加载，但体积过大，首屏等待时间太长
- 动画在 DCC 软件里正常，导到 Web 后骨骼错乱
- 贴图明明很清晰，但移动端一开就卡
- 模型结构混乱，前端无法精准选中某个部件做交互

所以 Day 7 的重点不是“会导出一次模型”，而是建立一套你以后可以重复使用的**资产落地方法论**。

### 1.2 为什么 Web 端优先使用 `glTF / GLB`

在 Web 3D 项目里，最推荐的实时模型格式通常是 `glTF 2.0`。

你可以把它理解为：

> **面向实时渲染与跨平台传输的 3D 场景交换格式。**

它之所以适合前端，有几个关键原因：

| 特性 | 为什么重要 |
|------|------------|
| 结构清晰 | 包含节点、Mesh、材质、动画、相机等信息，前端能直接读取 |
| PBR 友好 | 与 Three.js `MeshStandardMaterial` 工作流天然契合 |
| 支持压缩 | 可以配合 Draco、Meshopt、KTX2 等手段降低传输成本 |
| 工具链成熟 | Blender、Three.js、gltf-transform、在线分析工具都支持 |
| 跨平台强 | DCC 工具、引擎和 Web 端之间衔接相对统一 |

`glTF` 通常有两种常见形态：

| 形式 | 特点 | 更适合什么场景 |
|------|------|----------------|
| `.gltf` | JSON + 外部二进制/贴图文件 | 便于调试、拆分管理 |
| `.glb` | 单文件二进制封装 | 发布更方便、加载路径更简单 |

在前端项目里，**最终交付更常见的是 `.glb`**，因为：

- 路径更少
- 不容易漏传资源
- 更方便 CDN 分发
- 更适合练习项目和演示页

### 1.3 技术美术要关心的不只是“导出成功”

很多新手会把“能导出一个 `.glb`”当作结束，但技术美术真正要关注的是：

1. **结构是否适合前端控制**：节点命名是否清晰，部件层级是否可维护
2. **材质是否符合 Web 工作流**：BaseColor / Roughness / Metalness / Normal 是否正确映射
3. **体积是否合理**：模型和贴图大小是否会拖慢首屏加载
4. **动画是否可靠**：骨骼、关键帧、播放逻辑能否在 Web 端保持一致
5. **性能是否可控**：远近观察时是否需要 LOD，贴图是否需要压缩或降采样

这意味着你在 Day 7 里要学的，不只是一个软件按钮的位置，而是一种“**从源资产反推运行时表现**”的思维方式。

### 1.4 Web 端常见的资产成本来自哪里

在项目里，一个模型“重”不重，往往不只取决于网格面数。

常见成本主要来自 4 类：

| 成本来源 | 典型表现 | 常见优化方向 |
|----------|----------|--------------|
| 几何体过细 | 三角形数太高、移动端掉帧 | 减面、LOD、Draco / Meshopt |
| 贴图过大 | 首屏加载慢、显存占用高 | 缩放尺寸、改格式、纹理压缩 |
| 材质过多 | Draw Calls 增加、资源切换频繁 | 合并材质、整理 atlas |
| 结构混乱 | 前端难选中、难绑定交互、难做局部替换 | 统一命名、规范节点层级 |

所以在 Day 7 里，你要把“模型资源”看成一种需要被工程化管理的前端输入，而不是只属于美术同学的黑盒文件。

### 1.5 Blender → glTF → Web 的核心心智模型

建议你把这条链路记成下面这张图：

```text
Blender 里解决“内容正确性”
  ├─ 模型结构、坐标轴、材质、贴图、动画、命名
  ↓
导出时解决“格式正确性”
  ├─ glTF Binary、材质通道、动画、Draco、贴图引用
  ↓
工具链解决“传输成本”
  ├─ gltf-transform、减面、纹理缩放、压缩
  ↓
前端运行时解决“体验正确性”
  ├─ 加载器、进度反馈、错误处理、性能验证、交互接线
```

这四层分别回答的是：

- **内容对不对**
- **格式对不对**
- **体积合不合理**
- **上线后好不好用**

---

## 二、项目准备

### 2.1 继续沿用 `practice-day1`

本节继续使用前 6 天已经搭好的 `practice-day1` 项目：

```bash
cd practice-day1
npm install
```

如果你前面已经安装过基础依赖，通常只需要确认这些包可用：

```bash
npm install three @tresjs/core @tresjs/cientos
npm install -D @types/three
```

如果你打算直接手写 `GLTFLoader` + `DRACOLoader` 链路，Three.js 自带的 addons 就已经够用了，不一定要额外引入更复杂的资源管理库。

### 2.2 第七天建议的目录分层

Day 7 的重点不在“把页面做花”，而在于把资产路径、贴图路径、加载器与信息面板理清楚。建议结构像这样：

```text
src/
├── pages/
│   └── Practice7Page.vue
├── components/
│   └── practice7/
│       ├── AssetPipelineScene.vue
│       ├── ModelLoaderPanel.vue
│       ├── AssetChecklistCard.vue
│       └── LoadingProgressHud.vue
├── composables/
│   └── useAssetPipelineState.ts
├── docs/
│   └── practice7.md
public/
├── models/
│   ├── character.glb
│   └── character-draco.glb
└── textures/
    └── practice7/
```

**职责建议：**

- `Practice7Page.vue`：负责页面壳和整体布局
- `AssetPipelineScene.vue`：负责加载模型、相机、灯光和运行时验证
- `ModelLoaderPanel.vue`：负责显示体积、导出规范、压缩建议
- `LoadingProgressHud.vue`：负责展示进度、错误信息、加载状态
- `useAssetPipelineState.ts`：负责共享加载状态、资源信息和检查项

### 2.3 建议的资产目录规范

即使是练习项目，也建议尽早建立资源目录规则。一个更稳妥的做法是：

```text
public/
├── models/
│   ├── raw/              # 原始导出模型（仅开发对比）
│   ├── optimized/        # 压缩或整理后的主交付模型
│   └── previews/         # 缩略图、海报图等辅助素材
├── textures/
│   ├── source/           # 原始贴图备份
│   └── compressed/       # Web 端实际使用贴图
└── hdr/
    └── studio.hdr
```

为什么要这样分层：

- 原始文件和交付文件分开，避免上线时误传大资源
- 后续做压缩对比时，能明确知道哪个是优化版本
- 当团队协作时，前端、美术、技术美术更容易对齐“发布版资源”

### 2.4 Blender 导出前应该先检查什么

在你点导出之前，建议先在 Blender 里自查以下内容：

1. **命名是否清楚**：不要留下 `Cube.001`、`Plane.012` 这种无语义名称
2. **坐标和朝向是否统一**：避免导入 Web 后模型朝向颠倒
3. **缩放是否已应用**：防止运行时尺寸异常
4. **贴图路径是否有效**：避免导出后外链丢失
5. **材质通道是否符合 PBR 逻辑**：别把 Roughness / Metallic 混乱接线
6. **骨骼和动画是否清理干净**：删除无用 Action 和测试骨骼

这个步骤看似基础，但它决定了后面的所有优化工作是不是在正确资产上进行。

---

## 三、实现一个资产管线与加载规范实验场

### 3.1 Blender glTF 导出清单

在 Blender 导出 `.glb` 时，可以优先参考下面这套配置：

| 设置项 | 推荐值 | 说明 |
|--------|-------|------|
| Format | `glTF Binary (.glb)` | 单文件更利于前端分发与调试 |
| Include | 仅导出需要的 Collection / Object | 避免把测试对象一起打包 |
| Mesh | ✅ Apply Modifiers | 保证修改器结果进入最终模型 |
| Materials | ✅ Materials | 保留 PBR 材质通道 |
| Skin | ✅ Skinning | 角色或骨骼动画必开 |
| Shape Keys | ✅ Shape Keys | 表情和形变动画需要 |
| Animation | ✅ Animations | 导出关键帧动画 |
| Compression | ✅ Draco（按需） | 降低体积，但要评估解码成本 |
| Textures | 根据项目策略选择内嵌或外置 | 小型演示可内嵌，大项目更常拆分 |

这张表不是死规矩，而是一套“**面向 Web 实时渲染的默认值**”。

### 3.2 模型优化工具链

在实际项目里，导出通常只是中间步骤，发布前还会再走一遍资源整理流程。一个常见的 CLI 工具链是 `gltf-transform`：

```bash
# 复制并规范化文件
npx gltf-transform copy input.glb output.glb

# 开启 Draco 压缩
npx gltf-transform draco input.glb output-draco.glb

# 开启 Meshopt 压缩
npx gltf-transform meshopt input.glb output-meshopt.glb

# 缩放贴图分辨率
npx gltf-transform resize input.glb output-resized.glb --width 1024 --height 1024

# 合并多个模型
npx gltf-transform merge model1.glb model2.glb merged.glb
```

这些命令背后的意义不是“记住几个参数”，而是要理解它们分别在控制什么：

- `copy`：生成一个更干净的中间产物，适合继续处理
- `draco`：压缩几何体，通常能显著降低模型体积
- `meshopt`：进一步优化网格传输和解析表现
- `resize`：防止贴图尺寸超出真实使用需求
- `merge`：适合整理多个资产为统一交付包

### 3.3 在线分析工具可以帮你省很多时间

做资产管线时，非常建议搭配两个工具：

- `gltf-report.dev`：检查模型体积、节点、材质、贴图等结构
- `modelviewer.dev/editor`：快速预览材质与动画表现

它们能帮你快速回答这些问题：

- 体积到底大在哪
- 贴图是不是特别重
- 模型节点是否过深
- 材质和动画在 Web 端是否大致正确

你越早养成“先分析再优化”的习惯，后面就越少靠猜。

### 3.4 完整代码：`src/App.vue`

下面这份示例代码演示了一个 Day 7 练习版加载实验台：

- 使用 `GLTFLoader + DRACOLoader` 加载模型
- 用 `LoadingManager` 驱动加载进度
- 场景中展示模型、灯光和地面参考
- 右侧信息面板展示体积、动画数、节点数和导出检查项
- 左下角 HUD 展示加载状态、进度和错误信息

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

const containerRef = ref<HTMLDivElement | null>(null)
const modelPath = ref('/models/character.glb')
const useDracoVersion = ref(true)
const autoRotate = ref(true)

const loading = reactive({
  progress: 0,
  stage: 'idle',
  error: '',
})

const assetInfo = reactive({
  sceneChildren: 0,
  meshCount: 0,
  materialCount: 0,
  animationCount: 0,
  roughSizeLabel: '待分析',
})

const exportChecklist = reactive([
  { label: '对象命名清晰', done: true },
  { label: '应用模型缩放与修改器', done: true },
  { label: 'PBR 贴图通道核对', done: true },
  { label: '贴图尺寸已压缩到合理范围', done: false },
  { label: 'Draco / Meshopt 版本已生成', done: false },
])

const progressText = computed(() => {
  if (loading.error) return '加载失败'
  if (loading.stage === 'complete') return '加载完成'
  if (loading.stage === 'loading') return `加载中 ${loading.progress}%`
  return '等待开始'
})

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let clock: THREE.Clock | null = null
let animationFrameId = 0
let currentModel: THREE.Object3D | null = null
let mixer: THREE.AnimationMixer | null = null

function countMeshes(root: THREE.Object3D) {
  let meshCount = 0
  const materials = new Set<THREE.Material>()

  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshCount += 1
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => materials.add(material))
      } else if (child.material) {
        materials.add(child.material)
      }
    }
  })

  return { meshCount, materialCount: materials.size }
}

function estimateAssetSize(path: string) {
  if (path.includes('draco')) return '约 2~5MB（压缩版示例）'
  return '约 6~12MB（原始版示例）'
}

function createBaseScene() {
  if (!containerRef.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#060b16')
  scene.fog = new THREE.Fog('#060b16', 14, 44)

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(3.6, 2.6, 6.6)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  containerRef.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 1.1, 0)

  const ambient = new THREE.AmbientLight('#dbeafe', 0.65)
  scene.add(ambient)

  const keyLight = new THREE.DirectionalLight('#ffffff', 2.3)
  keyLight.position.set(6, 10, 5)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  scene.add(keyLight)

  const rimLight = new THREE.PointLight('#38bdf8', 25, 30)
  rimLight.position.set(-4, 3, 3)
  scene.add(rimLight)

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.95, metalness: 0.04 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.9
  floor.receiveShadow = true
  scene.add(floor)
}

function disposeCurrentModel() {
  if (!scene || !currentModel) return

  currentModel.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    child.geometry.dispose()
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose())
    } else {
      child.material.dispose()
    }
  })

  scene.remove(currentModel)
  currentModel = null
  mixer = null
}

async function loadModel() {
  if (!scene) return

  disposeCurrentModel()
  loading.stage = 'loading'
  loading.progress = 0
  loading.error = ''

  const manager = new THREE.LoadingManager()
  manager.onProgress = (_url, itemsLoaded, itemsTotal) => {
    loading.progress = itemsTotal > 0 ? Math.round((itemsLoaded / itemsTotal) * 100) : 0
  }
  manager.onError = (url) => {
    loading.error = `资源加载失败：${url}`
  }

  const dracoLoader = new DRACOLoader(manager)
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

  const loader = new GLTFLoader(manager)
  loader.setDRACOLoader(dracoLoader)

  const path = useDracoVersion.value ? '/models/character-draco.glb' : modelPath.value

  try {
    const gltf = await loader.loadAsync(path)
    currentModel = gltf.scene
    currentModel.position.set(0, 0, 0)
    currentModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    scene.add(currentModel)

    const { meshCount, materialCount } = countMeshes(gltf.scene)
    assetInfo.sceneChildren = gltf.scene.children.length
    assetInfo.meshCount = meshCount
    assetInfo.materialCount = materialCount
    assetInfo.animationCount = gltf.animations.length
    assetInfo.roughSizeLabel = estimateAssetSize(path)

    exportChecklist[3].done = useDracoVersion.value
    exportChecklist[4].done = useDracoVersion.value

    if (gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(gltf.scene)
      mixer.clipAction(gltf.animations[0]).play()
    }

    loading.progress = 100
    loading.stage = 'complete'
  } catch (error) {
    loading.error = error instanceof Error ? error.message : '未知错误'
    loading.stage = 'error'
  } finally {
    dracoLoader.dispose()
  }
}

function handleResize() {
  if (!containerRef.value || !renderer || !camera) return
  const width = Math.max(containerRef.value.clientWidth, 1)
  const height = Math.max(containerRef.value.clientHeight, 1)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function animate() {
  if (!renderer || !scene || !camera || !clock) return
  animationFrameId = window.requestAnimationFrame(animate)

  const delta = clock.getDelta()
  controls?.update()
  mixer?.update(delta)

  if (autoRotate.value && currentModel) {
    currentModel.rotation.y += delta * 0.25
  }

  renderer.render(scene, camera)
}

watch(useDracoVersion, () => {
  loadModel()
})

onMounted(async () => {
  createBaseScene()
  clock = new THREE.Clock()
  window.addEventListener('resize', handleResize)
  handleResize()
  await loadModel()
  animate()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.cancelAnimationFrame(animationFrameId)
  disposeCurrentModel()
  controls?.dispose()

  if (renderer && containerRef.value?.contains(renderer.domElement)) {
    containerRef.value.removeChild(renderer.domElement)
  }

  renderer?.dispose()
  renderer = null
  camera = null
  scene = null
  controls = null
  clock = null
})
</script>

<template>
  <div class="page">
    <div ref="containerRef" class="viewport"></div>

    <aside class="panel">
      <h3>Asset Pipeline Lab</h3>
      <p class="desc">
        这个实验场的目标不是做复杂效果，而是验证一份模型资源在 Web 端是否
        <strong>可加载、可分析、可压缩、可维护</strong>。
      </p>

      <section>
        <h4>加载策略</h4>
        <label class="checkbox">
          <input v-model="useDracoVersion" type="checkbox" />
          优先加载 Draco 压缩版
        </label>
        <label class="checkbox">
          <input v-model="autoRotate" type="checkbox" />
          自动旋转模型
        </label>
      </section>

      <section>
        <h4>资源概览</h4>
        <div class="stat-row"><span>估算体积</span><strong>{{ assetInfo.roughSizeLabel }}</strong></div>
        <div class="stat-row"><span>节点数量</span><strong>{{ assetInfo.sceneChildren }}</strong></div>
        <div class="stat-row"><span>Mesh 数量</span><strong>{{ assetInfo.meshCount }}</strong></div>
        <div class="stat-row"><span>材质数量</span><strong>{{ assetInfo.materialCount }}</strong></div>
        <div class="stat-row"><span>动画数量</span><strong>{{ assetInfo.animationCount }}</strong></div>
      </section>

      <section>
        <h4>导出检查项</h4>
        <ul class="checklist">
          <li v-for="item in exportChecklist" :key="item.label">
            <span :class="['dot', item.done ? 'done' : 'pending']"></span>
            {{ item.label }}
          </li>
        </ul>
      </section>
    </aside>

    <div class="hud">
      <div><strong>状态</strong>：{{ progressText }}</div>
      <div><strong>进度</strong>：{{ loading.progress }}%</div>
      <div><strong>路径</strong>：{{ useDracoVersion ? '/models/character-draco.glb' : modelPath }}</div>
      <div><strong>错误</strong>：{{ loading.error || '无' }}</div>
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
  background: radial-gradient(circle at top, #111827 0%, #020617 60%, #020617 100%);
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
  width: 340px;
  max-height: calc(100vh - 40px);
  overflow: auto;
  padding: 16px;
  border-radius: 18px;
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

.panel section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.desc {
  margin: 0;
  line-height: 1.6;
  color: #cbd5e1;
}

.checkbox {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: center;
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

.checklist {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.checklist li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #dbeafe;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
}

.dot.done {
  background: #22c55e;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.55);
}

.dot.pending {
  background: #f59e0b;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
}

.hud {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 20;
  min-width: 280px;
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

### 3.5 跑起来后你应该看到什么

页面正常时，应该出现以下效果：

- 主视区有一个已加载的角色或产品模型
- 右侧面板能看到当前模型的体积估算、节点数、Mesh 数和动画数
- 左下角 HUD 会显示当前加载状态、进度和错误信息
- 勾选 **优先加载 Draco 压缩版** 后，模型路径会切换到压缩版本
- 如果模型带动画，场景会播放第一段动画
- 模型可以通过轨道控制进行观察，方便验证材质、结构和法线表现

---

## 四、关键概念逐段解释

### 4.1 为什么加载实验台要显示“节点数 / Mesh 数 / 材质数”

很多人只盯文件体积，但对前端来说，**结构复杂度同样重要**。

例如：

- 节点太多 → 场景树复杂，遍历和局部控制更麻烦
- Mesh 太多 → Draw Calls 可能上升
- 材质太多 → 渲染状态切换更频繁

所以我们不只关心“这个模型有多大”，还关心“它内部长什么样”。

### 4.2 为什么 `LoadingManager` 比单纯的 `loader.load()` 更适合项目练习

直接 `loader.load()` 当然也能工作，但一旦项目里资源变多，你很快就会发现：

- 你需要统一的加载进度
- 你需要更明确的错误来源
- 你需要知道失败的是模型、贴图还是其他附属资源

`LoadingManager` 的价值就在于它帮你把“加载状态”抽成一个更容易接给 UI 的层。

这也是前端技术美术非常常见的一种职责：

> **把底层资源加载过程翻译成页面层可展示、可调试、可运营的反馈信息。**

### 4.3 为什么 Draco 压缩不能只看“体积变小了多少”

Draco 的确能显著缩小几何体体积，但它不是无成本的。

引入 Draco 后，实际成本会变成两部分：

1. 网络传输更小，下载更快
2. 浏览器端需要额外解码时间

所以在判断是否启用时，你要结合场景来想：

- 模型是否真的很大
- 目标设备是否偏弱
- 首屏带宽是不是主要瓶颈
- 你的加载体验更在意“下载时间”还是“解码等待”

**经验上：**

- 大模型、弱网环境、首屏远程加载 → 更推荐使用 Draco
- 小模型、本地演示、对秒开交互要求高 → 可能无需过度压缩

### 4.4 为什么“贴图尺寸合理”常常比“网格压缩”更重要

在很多实际项目里，真正的大头不是几何体，而是贴图。

例如一张：

- `4096 x 4096` 的 BaseColor
- `4096 x 4096` 的 Normal
- `4096 x 4096` 的 Roughness / Metallic

哪怕模型本体只有几 MB，整体资源也可能被贴图迅速拉爆。

因此 Day 7 一定要建立这样的意识：

- 不要为了“可能会放大看”就默认全上 4K
- 不同平台要有不同资源预算
- 很多场景里 `1024` 或 `2048` 已经够用
- 优先让贴图分辨率匹配真实展示尺寸

### 4.5 为什么节点命名对前端交互至关重要

如果模型里的节点都是：

- `Cube.001`
- `Cube.002`
- `Plane.014`

那后续做这些事情都会很痛苦：

- 点击车门高亮车门
- 切换某个零件材质
- 给某个部位挂 tooltip
- 根据部件名联动右侧面板

相反，如果你在 Blender 里先整理成：

- `body_shell`
- `front_wheel_l`
- `front_wheel_r`
- `headlight_group`

前端就能更自然地读取与映射这些对象。

所以命名规范不只是美术习惯，而是**交互开发接口设计的一部分**。

### 4.6 为什么 Day 7 要把“资源规范”写进面板或文档里

当项目变大后，资源问题不可能只靠口头记忆解决。你最终需要把这些经验沉淀成：

- 检查清单
- 导出规范文档
- 目录约定
- 命名规范
- 发布前验证流程

这也是为什么本练习里右侧会专门保留一块 **导出检查项**：

它不是给页面装饰用的，而是在训练你把“经验”变成“可执行标准”。

---

## 五、把资产管线变成可复用的工作流

### 5.1 推荐的资源处理顺序

如果你后面要做真实项目，建议按下面这个顺序处理模型：

1. **先在 Blender 中清理内容**
   - 删除无用对象
   - 应用缩放与修改器
   - 确认朝向和单位
2. **导出基础 `.glb`**
   - 验证材质、动画、层级是否完整
3. **使用分析工具检查结构**
   - 看节点深度、贴图大小、材质数量
4. **使用工具链做压缩和缩放**
   - Draco、Meshopt、贴图 resize
5. **放入前端项目验证运行时表现**
   - 加载速度、进度条、阴影、动画、交互命中
6. **整理发布版资源与规范文档**
   - 明确哪个文件是最终交付版

### 5.2 原始资产、优化资产、发布资产最好分开管理

非常建议你不要只保留一个 `final-final-v3.glb`。

更稳妥的做法是明确区分：

| 类型 | 用途 |
|------|------|
| 原始导出资产 | 用于回滚、比对和重新处理 |
| 优化中间产物 | 用于测试 Draco / resize / merge 等步骤 |
| 发布版资产 | 前端项目最终引用版本 |

这样做的好处是：

- 出问题时更容易定位问题出在哪一阶段
- 可以回头比较压缩前后的质量差异
- 团队协作时不会因为文件覆盖导致混乱

### 5.3 什么时候该考虑 `KTX2 / Basis` 纹理压缩

Day 7 主要围绕模型与基础贴图规范，但你要先有这个意识：

如果后面项目里贴图很多、尺寸很大、目标平台跨度大，那么**几何压缩只是第一步**，纹理压缩才是决定显存与下载体验的关键战场。

通常会在这些场景里认真考虑：

- 产品展示页里材质贴图多
- 大型场景里需要大量共享贴图
- 移动端设备要控制显存
- 需要兼顾画质与首屏速度

也就是说，Day 7 练完之后，你应该能知道：

> **模型压缩不是资源优化的终点，它只是进入完整资产工程化管理的起点。**

---

## 六、运行与验证

```bash
cd practice-day1
npm run dev
# 浏览器访问 http://localhost:5173
```

### 验证清单

- [ ] 如果你已经把 Day 7 页面接到路由中，通过顶部导航或直接访问 `/#/practice7` 可以打开页面，且控制台没有明显 Three.js / 资源路径报错
- [ ] 页面主视区能正常看到已加载的模型、地面、基础灯光和可拖拽观察的相机视角
- [ ] 左下角 HUD 会显示 `状态 / 进度 / 路径 / 错误` 等信息，切换模型版本时会同步刷新
- [ ] 勾选 **优先加载 Draco 压缩版** 后，加载路径会切换到压缩版本，模型仍能正常显示
- [ ] 如果模型包含动画，加载完成后第一段动画会自动播放；若无动画，页面也不会报错中断
- [ ] 右侧信息面板中的 `节点数量 / Mesh 数量 / 材质数量 / 动画数量` 能正确显示当前模型概览
- [ ] 导出检查项可以明确区分哪些资源规范已经完成，哪些仍待补齐
- [ ] 删除或改错模型路径时，HUD 的错误信息会出现可读提示，而不是静默失败
- [ ] 切换窗口大小后，画面不会被拉伸，轨道控制和场景渲染仍然正常
- [ ] 重新进入页面后，不会因为旧渲染器或旧模型未释放而导致 DOM 叠加或页面越来越卡

---

## 七、常见问题排查

| 问题 | 原因 | 解决方法 |
|------|------|---------|
| 模型完全加载不出来 | 路径错误、资源未放在 `public`、文件名不一致 | 检查实际访问路径，确认 `public/models` 中的文件名与代码一致 |
| 材质看起来发灰或颜色不对 | 颜色空间设置不正确，或贴图导出有问题 | 检查 `renderer.outputColorSpace`、贴图色彩空间和 Blender 材质通道 |
| 模型方向不对 | DCC 坐标轴与运行时坐标系存在差异 | 在 Blender 中统一朝向，或在前端对根节点做一次旋转修正 |
| 模型尺寸异常 | 没有应用缩放，或单位不统一 | Blender 中执行 Apply Scale，并建立统一单位约定 |
| Draco 版本加载失败 | 解码器路径错误或网络不可达 | 检查 `setDecoderPath()`，确保线上环境也可访问解码资源 |
| 动画没播放 | 模型没有导出动画，或没有创建 `AnimationMixer` | 检查导出时是否勾选 `Animations`，并确认 `gltf.animations.length` 大于 0 |
| 贴图明明存在但显示异常 | UV、法线、压缩流程或贴图格式处理有误 | 先用在线预览工具确认原始模型是否正常，再排查 Web 端设置 |
| 模型文件不大但加载依旧慢 | 实际瓶颈可能来自贴图、解码或首屏阻塞 | 同时检查贴图体积、解码成本和页面初始加载链路 |
| 前端很难定位某个部件 | 节点命名和层级不清晰 | 在 Blender 中先整理语义化命名，再导出新的交付版本 |

---

## 八、扩展练习（可选）

1. **做原始版 vs 压缩版切换实验**：同一个模型支持 `raw / draco / meshopt` 三种版本切换，记录加载时间与体积差异
2. **增加模型预检面板**：自动统计节点、材质、贴图数量，并提示是否超出预算
3. **加入缩略图与元数据清单**：为每个模型补充预览图、作者、导出日期、贴图尺寸信息
4. **把贴图策略也纳入实验场**：加入一套低清贴图和一套高清贴图，比较视觉差异与性能成本
5. **做一个模型命名校验器**：遍历场景树，标记像 `Cube.001` 这类不规范节点名称
6. **扩展动画控制区**：支持切换多个动画片段、播放速度和循环方式
7. **加入资源发布清单**：在页面里显示“原始资产 / 中间产物 / 发布资产”的版本映射关系

---

## 九、补充：什么时候技术美术该提前介入资产流程

### 9.1 越早介入，后面返工越少

如果技术美术直到模型已经批量导出、贴图已经全部做完才开始介入，那么很多问题都会变得很贵：

- 命名不规范 → 前端交互要重写映射
- 贴图过大 → 需要重新批量处理
- 材质流程不统一 → Web 端表现不一致
- 动画切片混乱 → 运行时状态机很难接

所以更理想的方式是：

- 资产规范在前期就写清楚
- 导出与命名规则尽早对齐
- 前端和美术共用一套发布标准

### 9.2 推荐原则

> **越靠近运行时的问题，越要在源资产阶段尽早解决。**
>
> **Web 端的加载问题、交互问题和性能问题，很多都能在 Day 7 这类资产规范阶段提前避免。**

---

> **下一步**：Day 8 将进入方案预研与综合项目，把前 1 到 7 天积累的加载、材质、交互、性能和资源管理能力汇总到一个完整的 3D 产品展示练习里。