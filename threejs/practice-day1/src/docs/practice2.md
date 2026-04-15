# Day 2：glTF 模型加载与 Sketchfab 集成

> 目标：掌握 glTF/GLB 模型加载流程，封装 SketchfabViewer Vue 组件，实现模型动画控制与相机视角切换。

---

## 一、理论目标

### 1.1 glTF / GLB 格式规范

glTF（GL Transmission Format）是 Khronos Group 制定的 3D 模型开放标准，被称为"3D 领域的 JPEG"。

```
glTF 文件结构
├── scenes[]        → 场景（根节点入口）
├── nodes[]         → 节点（变换层级 + Mesh/Skin/Camera 引用）
├── meshes[]        → 网格（一组 primitives）
│   └── primitives[] → 图元（geometry + material 引用）
├── materials[]     → PBR 材质（Metal-Rough 工作流）
├── textures[]      → 纹理（image + sampler 引用）
├── images[]        → 图片（URI 或 bufferView 引用）
├── skins[]         → 蒙皮（关节矩阵 + inverseBindMatrices）
├── animations[]    → 动画（通道 + 采样器）
│   ├── channels[]  → 动画通道（target: node + path）
│   └── samplers[]  → 采样器（input + output + interpolation）
├── accessors[]     → 访问器（数据视图：类型、数量、偏移）
├── bufferViews[]   → 缓冲区视图（buffer 的切片）
└── buffers[]       → 缓冲区（二进制数据源）
```

**两种文件格式对比：**

| 格式 | 扩展名 | 结构 | 适用场景 |
|------|--------|------|---------|
| glTF | `.gltf` + `.bin` + 纹理文件 | 多文件分离 | 需要单独编辑纹理/材质 |
| **GLB** | **`.glb`** | **单文件二进制打包** | **Web 加载首选，一次 HTTP 请求** |

> **重点：Web 项目推荐使用 GLB 格式**。GLB 将 JSON、二进制数据、纹理图片全部打包成一个文件，加载更快、部署更简单。`useGLTF` 对 `.gltf` 和 `.glb` 的加载方式完全一致，只是传入的文件扩展名不同。

**glTF 核心概念速查：**

| 概念 | 说明 | 类比 |
|------|------|------|
| Scene | 场景入口，包含多个根 Node | 舞台 |
| Node | 场景节点，有变换层级（TRS） | 演员/道具的位置标记 |
| Mesh | 可渲染网格，由 primitives 组成 | 演员的身体 |
| Material | PBR 材质定义 | 演员的服装/妆容 |
| Skin | 骨骼蒙皮，驱动 Mesh 变形 | 演员的骨骼 |
| Animation | 关键帧动画，驱动 Node 变换 | 剧本中的动作指导 |

### 1.2 Sketchfab Viewer API

[Sketchfab](https://sketchfab.com) 是最大的 3D 模型在线平台，其 Viewer API 允许在前端嵌入和控制 3D 模型展示。

```
Sketchfab Viewer API
├── 初始化
│   ├── new Sketchfab(iframe)      → 创建客户端
│   └── client.init(urlid, config) → 初始化查看器
├── 生命周期
│   ├── viewerready                → 模型加载完成
│   └── error                      → 加载失败
├── 动画控制
│   ├── getAnimations()            → 获取动画列表
│   ├── playAnimation(index)       → 播放指定动画
│   ├── pauseAnimation()           → 暂停动画
│   └── setCurrentAnimationByUID() → 按 UID 切换动画
├── 相机控制
│   ├── setCameraLookAt(eye, target) → 设置相机位置和朝向
│   ├── getCamera()                  → 获取当前相机参数
│   └── setCameraFov(fov)           → 设置视场角
└── 材质控制
    ├── getMaterialList()            → 获取材质列表
    └── setMaterial(id, params)      → 修改材质属性
```

**iframe 嵌入 URL 参数：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `autostart` | 自动开始加载 | `autostart=1` |
| `ui_infos` | 显示模型信息栏 | `ui_infos=0` 隐藏 |
| `ui_controls` | 显示控制按钮 | `ui_controls=0` 隐藏 |
| `transparent` | 透明背景 | `transparent=1` |

### 1.3 Draco / Meshopt 压缩原理

| 维度 | Draco | Meshopt |
|------|-------|---------|
| 压缩率 | ⭐⭐⭐⭐⭐ (60-80%) | ⭐⭐⭐ (40-60%) |
| 解码速度 | ⭐⭐ (需 WASM ~150KB) | ⭐⭐⭐⭐⭐ (~20KB JS) |
| 精度 | 有损 | 无损 |
| 适合场景 | 静态大模型 | 动画/角色模型 |

---

## 二、项目初始化

```bash
cd practice-day1

# 安装 cientos（包含 useGLTF、OrbitControls、useAnimations 等）
npm install @tresjs/cientos
```

**模型资源准备：** 在 `public/models/` 下放置 `.glb` 文件

```
practice-day1/
├── public/
│   ├── models/          ← 模型文件放在这里
│   │   ├── character.glb
│   │   ├── robot.glb
│   │   └── scene.gltf
│   ├── favicon.svg
│   └── icons.svg
├── src/
├── index.html
└── ...
```

**为什么放 `public/` 而不是 `src/assets/`？**

| 位置 | 访问方式 | 特点 |
|------|----------|------|
| `public/models/xxx.glb` | `/models/xxx.glb`（绝对路径） | **原样复制**到 dist，适合大文件 |
| `src/assets/xxx.glb` | `import xxx from './assets/xxx.glb'` | **被 Vite 处理**，大文件会 base64 内嵌或 hash 重命名 |

3D 模型文件通常很大（几 MB 到几十 MB），所以：
- ❌ 不建议放 `src/assets/` — 可能被内联成 base64 导致打包体积爆炸
- ✅ **推荐放 `public/models/`** — 按原文件名直接提供访问

使用时直接用绝对路径引用，不需要 import：

```typescript
// ✅ 正确：public/models/ 下的文件，用绝对路径 /models/xxx.glb 访问
const { scene } = await useGLTF('/models/character.glb')

// ❌ 错误：不要用 import 导入大模型文件
// import model from '@/assets/character.glb'  // 可能导致 base64 内嵌
```

> **免费模型资源：**
> - glTF 示例模型：https://github.com/KhronosGroup/glTF-Sample-Models
> - 推荐测试模型：`DamagedHelmet`、`FlightHelmet`、`Fox`

---

## 三、加载 GLB / glTF 模型

### 3.1 核心代码：useGLTF + primitive

> **glTF 和 GLB 加载方式完全一致**，只需改文件路径即可。

```vue
<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { useGLTF, OrbitControls } from '@tresjs/cientos'

// ✅ 加载 GLB（推荐，单文件）
const { scene: model, animations } = await useGLTF('/models/character.glb')

// ✅ 加载 glTF 也可以（多文件，需确保 .bin 和纹理在同目录）
// const { scene: model, animations } = await useGLTF('/models/character.gltf')

console.log('动画数量:', animations.length)
</script>

<template>
  <Suspense>
    <TresCanvas clear-color="#1a1a2e" window-size shadows>
      <TresPerspectiveCamera :position="[0, 2, 5]" />
      <OrbitControls />
      <primitive :object="model" />
      <TresDirectionalLight :position="[5, 5, 5]" :intensity="1" />
      <TresAmbientLight :intensity="0.5" />
    </TresCanvas>
    <template #fallback>
      <div class="loading">模型加载中...</div>
    </template>
  </Suspense>
</template>
```

### 3.2 关键概念

#### `useGLTF` 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `scene` | `THREE.Group` | 模型根场景对象 → 传给 `<primitive :object>` |
| `nodes` | `object` | 按名称索引的节点映射 |
| `materials` | `object` | 按名称索引的材质映射 |
| `animations` | `THREE.AnimationClip[]` | 动画剪辑数组 |

#### `<primitive>` vs `<TresMesh>`

- `<TresMesh>` — 创建**新**的 Three.js 对象
- `<primitive :object>` — 插入**已有**的 Three.js 对象（如 useGLTF 返回的 scene）

#### `<Suspense>` 的必要性

`await useGLTF()` 是异步操作，必须用 `<Suspense>` 包裹，否则 Vue 无法渲染。

### 3.3 加载进度（需用原生 GLTFLoader）

`useGLTF` 不支持进度回调，如需进度条需用原生方式：

```typescript
import * as THREE from 'three'

const loader = new THREE.GLTFLoader()
loader.load(
  '/models/character.glb',
  (gltf) => { /* 加载完成，gltf.scene 即模型 */ },
  (progress) => {
    if (progress.total > 0) {
      const percent = Math.round(progress.loaded / progress.total * 100)
      console.log(`加载: ${percent}%`)
    }
  },
  (error) => { console.error('加载失败', error) },
)
```

---

## 四、Sketchfab Viewer API 集成

### 4.1 引入脚本

在 `public/index.html` 的 `<head>` 中添加：

```html
<script type="text/javascript" src="https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js"></script>
```

### 4.2 SketchfabViewer 组件核心代码

```vue
<!-- SketchfabViewer.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelId: string
  autoplay?: boolean
  transparent?: boolean
}>()

const emit = defineEmits<{
  ready: [api: any]
  error: [err: Error]
}>()

const containerRef = ref<HTMLDivElement>()
let api: any = null
let iframe: HTMLIFrameElement | null = null

onMounted(() => {
  if (!containerRef.value) return

  iframe = document.createElement('iframe')
  iframe.src = `https://sketchfab.com/models/${props.modelId}/embed?autostart=1`
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  containerRef.value.appendChild(iframe)

  const client = new (window as any).Sketchfab(iframe)
  client.init(props.modelId, {
    success: (sketchApi: any) => {
      api = sketchApi
      api.start()
      api.addEventListener('viewerready', () => emit('ready', api))
    },
    error: () => emit('error', new Error('Failed to init')),
  })
})

onUnmounted(() => {
  if (iframe && containerRef.value) containerRef.value.removeChild(iframe)
  api = null
  iframe = null
})

defineExpose({
  getApi: () => api,
  playAnimation: (index: number) => api?.setCurrentAnimationByUID(index.toString()),
  pauseAnimation: () => api?.pauseAnimation?.(),
  setCamera: (eye: number[], target: number[]) => api?.setCameraLookAt(eye, target),
})
</script>

<template>
  <div ref="containerRef" class="sketchfab-container" />
</template>

<style scoped>
.sketchfab-container { width: 100%; height: 100%; min-height: 400px; }
</style>
```

### 4.3 关键点

- **初始化流程**：创建 iframe → `new Sketchfab(iframe)` → `client.init()` → `api.start()` → 监听 `viewerready`
- **`defineExpose`**：让父组件通过 `ref` 访问子组件方法，如 `viewerRef.value?.playAnimation(0)`
- **必须清理 iframe**：`onUnmounted` 中移除，否则内存泄漏

---

## 五、模型动画控制

### 5.1 核心代码：useAnimations

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { TresCanvas, useRenderLoop } from '@tresjs/core'
import { useGLTF, useAnimations, OrbitControls } from '@tresjs/cientos'

const { scene: model, animations } = await useGLTF('/models/character.glb')
const { actions, mixer, currentAction } = useAnimations(animations, model)

// 播放指定动画（带淡入淡出切换）
const currentName = ref('')
const play = (name: string) => {
  if (!actions[name]) return
  currentAction.value?.fadeOut(0.5)
  actions[name].reset().fadeIn(0.5).play()
  currentName.value = name
}

// 速度控制
const speed = ref(1)
watch(speed, v => { if (mixer.value) mixer.value.timeScale = v })

// 渲染循环中更新动画
const { onLoop } = useRenderLoop()
onLoop(({ delta }) => { mixer.value?.update(delta) })

// 自动播放第一个动画
const names = Object.keys(actions)
if (names.length > 0) play(names[0])
</script>

<template>
  <Suspense>
    <TresCanvas clear-color="#1a1a2e" window-size>
      <TresPerspectiveCamera :position="[0, 2, 5]" />
      <OrbitControls />
      <primitive :object="model" />
      <TresDirectionalLight :position="[5, 5, 5]" :intensity="1" />
      <TresAmbientLight :intensity="0.5" />
    </TresCanvas>
    <template #fallback><div>加载中...</div></template>
  </Suspense>

  <!-- 动画控制 -->
  <div class="anim-panel">
    <button v-for="name in names" :key="name"
      :class="{ active: currentName === name }"
      @click="play(name)">{{ name }}</button>
    <input type="range" v-model.number="speed" min="0.1" max="3" step="0.1" />
  </div>
</template>
```

### 5.2 AnimationMixer 核心概念

```
AnimationClip    → 一个完整动画（如"行走"、"奔跑"），来自 glTF 的 animations 数组
AnimationAction  → clip 的播放实例，控制 play/stop/fadeIn/fadeOut/timeScale
AnimationMixer   → 管理所有 action，每帧调用 mixer.update(delta) 驱动动画

三者关系：
  useGLTF() → 返回 AnimationClip[]
  useAnimations(clips, model) → 创建 mixer + 为每个 clip 生成 action
  渲染循环 → mixer.update(delta) → 驱动所有 action
```

---

## 六、相机视角切换

```typescript
// 预设视角配置
const cameraPresets = [
  { name: '正面',  position: [0, 1.5, 5],   target: [0, 1, 0] },
  { name: '侧面',  position: [5, 1.5, 0],   target: [0, 1, 0] },
  { name: '顶部',  position: [0, 6, 0.1],   target: [0, 0, 0] },
  { name: '45度',  position: [3.5, 3.5, 3.5], target: [0, 0.5, 0] },
]

// 切换相机
const switchCamera = (preset: typeof cameraPresets[0], camera: any) => {
  camera.position.set(...preset.position)
  camera.lookAt(...preset.target)
}
```

---

## 七、Draco / Meshopt 压缩模型加载

### 7.1 Draco 压缩模型

```typescript
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// 之后用 gltfLoader.load() 加载 .glb 即可自动 Draco 解码
```

### 7.2 Meshopt 压缩模型

```typescript
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const gltfLoader = new GLTFLoader()
gltfLoader.setMeshoptDecoder(MeshoptDecoder)
```

### 7.3 压缩工具

```bash
npx gltf-transform draco input.glb output.glb       # Draco 压缩（有损，体积最小）
npx gltf-transform meshopt input.glb output.glb      # Meshopt 压缩（无损）
npx gltf-transform resize input.glb output.glb --width 1024 --height 1024  # 纹理缩放
npx gltf-transform inspect input.glb                  # 查看模型信息
```

---

## 八、运行与验证

```bash
cd practice-day1
npm run dev
# 浏览器访问 http://localhost:5173
```

### 验证清单

- [ ] 终端无报错（TypeScript / 模块导入错误）
- [ ] 本地 GLB 模型成功加载并显示
- [ ] 模型有正确的光照效果（非全黑/全白）
- [ ] OrbitControls 鼠标交互正常
- [ ] 模型动画可以播放、暂停、切换
- [ ] 动画速度可以调节
- [ ] Sketchfab 查看器可以嵌入显示
- [ ] Sketchfab 模型就绪后可以控制动画

---

## 九、常见问题排查

| 问题 | 原因 | 解决方法 |
|------|------|---------|
| 模型不显示 | 文件路径错误 | 确认模型在 `public/models/` 下，路径以 `/` 开头 |
| 模型全黑 | 缺少光照 | 添加 DirectionalLight，检查 glTF 是否包含材质 |
| 动画不播放 | 未调用 mixer.update | 在渲染循环中调用 `mixer.value?.update(delta)` |
| Suspense 报错 | 未用 Suspense 包裹 | `<Suspense>` 包裹含 `await useGLTF()` 的组件 |
| Sketchfab 不加载 | 未引入脚本 | `index.html` 中添加 Sketchfab Viewer API `<script>` |
| Draco 模型加载失败 | 未配置解码器 | 使用 `DRACOLoader` 并设置解码器路径 |
| 模型尺寸过大/过小 | 模型单位不匹配 | 调整模型 `scale` 或相机 `position` |
| 内存泄漏 | 组件卸载未清理 | `onUnmounted` 中清理 mixer、iframe 等 |

---

## 十、扩展练习（可选）

1. **多模型切换**：准备 2-3 个不同 GLB 模型，实现点击按钮切换
2. **模型信息面板**：显示顶点数、面数、材质数、动画数
3. **截图功能**：`renderer.domElement.toDataURL()` 实现场景截图
4. **Draco 压缩对比**：同一模型分别压缩，对比加载时间和体积
5. **模型热替换**：通过拖拽文件动态替换场景中的模型

---

> **下一步**：Day 3 将学习 PBR 材质在 WebGL 中的实现，理解 Metal-Rough 工作流与 HDR 环境贴图。
