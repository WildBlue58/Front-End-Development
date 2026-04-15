# 技术美术（前端方向）8天入职前准备攻略

> 针对**技术美术岗位但实际从事前端开发**的情况，重点规划前端环境中3D内容的集成与优化。

---

## 技术栈概览

| 层级 | 技术选型 |
|------|---------|
| 前端框架 | Vue3 + TypeScript |
| 3D渲染 | Three.js / TresJS (`@tresjs/core`) |
| 构建工具 | Vite |
| 模型格式 | glTF / GLB |
| Shader | GLSL (Vertex / Fragment) |
| 3D内容平台 | Sketchfab Viewer API |
| 美术工具 | Blender → glTF → Web |

---

## Day 1：Three.js 核心概念 + Vite 项目搭建

### 理论目标
- 理解 Three.js 渲染管线：Scene → Camera → Renderer → Mesh(Geometry + Material)
- 掌握 Vite + Vue3 + TypeScript 项目结构
- 了解 TresJS 作为 Vue3 3D 渲染层的作用

### 实践任务

```bash
# 1. 初始化项目
npm create vite@latest practice-day1 -- --template vue-ts
cd practice-day1
npm install three @tresjs/core
npm install -D @types/three
```

```vue
<!-- 2. TresJS 基础场景 -->
<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
</script>

<template>
  <TresCanvas clear-color="#1a1a2e" window-size>
    <TresPerspectiveCamera :position="[0, 2, 5]" />
    <TresMesh :position="[0, 0, 0]">
      <TresBoxGeometry :args="[1, 1, 1]" />
      <TresMeshStandardMaterial color="#42b883" />
    </TresMesh>
    <TresDirectionalLight :position="[3, 3, 3]" :intensity="1" />
    <TresAmbientLight :intensity="0.5" />
  </TresCanvas>
</template>
```

### 交付物
- [ ] 可运行的 Vue3 + TresJS 基础场景
- [ ] 场景中包含：相机、光照、几何体、材质
- [ ] 支持鼠标交互（OrbitControls）

---

## Day 2：glTF 模型加载与 Sketchfab 集成

### 理论目标
- glTF / GLB 格式规范：节点层级、Mesh、Material、Animation、Skin
- Sketchfab Viewer API 的嵌入与控制
- Draco / Meshopt 压缩原理

### 实践任务

#### 2.1 加载 glTF 模型

```vue
<script setup lang="ts">
import { useGLTF } from '@tresjs/cientos'

const { scene: model } = await useGLTF('/models/character.glb')
</script>

<template>
  <TresCanvas>
    <TresPerspectiveCamera :position="[0, 2, 5]" />
    <primitive :object="model" />
  </TresCanvas>
</template>
```

#### 2.2 Sketchfab Viewer API 集成

```typescript
// Sketchfab Viewer 初始化
const initSketchfab = (urlid: string, container: HTMLElement) => {
  const iframe = document.createElement('iframe')
  iframe.src = `https://sketchfab.com/models/${urlid}/embed?autostart=1&ui_infos=0&ui_controls=0`
  container.appendChild(iframe)

  const client = new (window as any).Sketchfab(iframe)
  client.init(urlid, {
    success: (api: any) => {
      api.start()
      api.addEventListener('viewerready', () => {
        console.log('Sketchfab Viewer Ready')
      })
    },
    error: () => console.error('Sketchfab API error'),
  })
}
```

#### 2.3 Vue3 SketchfabViewer 组件封装

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

onMounted(() => {
  if (!containerRef.value) return
  const iframe = document.createElement('iframe')
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

defineExpose({
  getApi: () => api,
  playAnimation: (index: number) => api?.playAnimation(index),
  pauseAnimation: () => api?.pauseAnimation(),
  setCamera: (eye: number[], target: number[]) => api?.setCameraLookAt(eye, target),
})
</script>

<template>
  <div ref="containerRef" class="sketchfab-container" />
</template>

<style scoped>
.sketchfab-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
```

### 交付物
- [ ] 成功加载一个 glTF 模型到场景
- [ ] 封装 SketchfabViewer Vue 组件
- [ ] 实现模型动画播放/暂停控制
- [ ] 实现相机视角切换

---

## Day 3：PBR 材质在 WebGL 中的实现

### 理论目标
- PBR (Physically Based Rendering) 核心概念
- Metal-Rough 工作流：BaseColor / Metallic / Roughness / Normal / AO / Emissive
- Three.js MeshStandardMaterial / MeshPhysicalMaterial 参数映射
- 环境贴图 (HDR) 对 PBR 效果的影响

### PBR 贴图映射关系

| PBR 通道 | Three.js 属性 | 说明 |
|---------|--------------|------|
| BaseColor | `map` | 基础颜色贴图 (sRGB) |
| Metallic | `metalnessMap` | 金属度贴图 (线性) |
| Roughness | `roughnessMap` | 粗糙度贴图 (线性) |
| Normal | `normalMap` | 法线贴图 |
| AO | `aoMap` | 环境遮蔽贴图 |
| Emissive | `emissiveMap` | 自发光贴图 |

### 实践任务

```typescript
// 完整 PBR 材质配置
const pbrMaterial = new THREE.MeshStandardMaterial({
  map: baseColorTex,          // sRGB 颜色空间
  metalnessMap: metallicTex,  // 线性空间
  roughnessMap: roughnessTex, // 线性空间
  normalMap: normalTex,
  normalScale: new THREE.Vector2(1, 1),
  aoMap: aoTex,
  aoMapIntensity: 1.0,
  emissiveMap: emissiveTex,
  emissive: new THREE.Color(0xffffff),
  emissiveIntensity: 1.0,
  envMap: hdrEnvMap,          // HDR 环境贴图
  envMapIntensity: 1.0,
})

// 纹理颜色空间设置（关键！）
baseColorTex.colorSpace = THREE.SRGBColorSpace
metallicTex.colorSpace = THREE.LinearSRGBColorSpace
roughnessTex.colorSpace = THREE.LinearSRGBColorSpace
```

### 交付物
- [ ] 实现完整 PBR 材质球（含6张贴图通道）
- [ ] 加载 HDR 环境贴图并观察反射效果
- [ ] 通过 UI 控制 metalness / roughness 参数实时调节
- [ ] 对比 MeshStandardMaterial vs MeshPhysicalMaterial 效果差异

---

## Day 4：Shader 编程在前端中的应用

### 理论目标
- GLSL 语法基础：uniform / varying / attribute
- Vertex Shader 与 Fragment Shader 的职责
- ShaderMaterial 与 RawShaderMaterial 的区别
- 常用 Shader 技巧：UV 动画、噪声、菲涅尔

### 实践任务

#### 4.1 自定义波浪 Shader

```typescript
// WaveShaderMaterial
const waveMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#42b883') },
    uAmplitude: { value: 0.3 },
    uFrequency: { value: 2.0 },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uAmplitude;
    uniform float uFrequency;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
      vUv = uv;
      vec3 pos = position;
      float elevation = sin(pos.x * uFrequency + uTime) * uAmplitude
                      * sin(pos.z * uFrequency + uTime) * uAmplitude;
      pos.y += elevation;
      vElevation = elevation;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
      float alpha = (vElevation + 0.3) * 1.5;
      vec3 color = mix(uColor * 0.5, uColor, vElevation + 0.5);
      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
})

// 动画循环中更新 uniform
function animate() {
  waveMaterial.uniforms.uTime.value += 0.02
}
```

#### 4.2 常用 GLSL 工具函数

```glsl
// 扫描线效果
float scanLine(float uv_y, float time) {
  return smoothstep(0.0, 0.02, abs(sin(uv_y * 80.0 - time * 3.0)));
}

// 菲涅尔效果
float fresnel(vec3 viewDir, vec3 normal, float power) {
  return pow(1.0 - dot(viewDir, normal), power);
}

// 简易噪声
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
```

### 交付物
- [ ] 实现自定义波浪 Shader 效果
- [ ] 实现菲涅尔边缘光效果
- [ ] 将 Shader 与 Vue3 响应式状态绑定
- [ ] 通过 UI 控制 Shader uniform 参数

---

## Day 5：Vue3 响应式系统与 3D 场景交互

### 理论目标
- Vue3 响应式系统 (ref / reactive / computed / watch) 与 3D 状态绑定
- TresJS 的响应式 3D 绑定机制
- Raycasting 实现鼠标拾取
- 3D 场景事件系统与 Vue 事件系统的桥接

### 实践任务

```vue
<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { useRenderLoop } from '@tresjs/core'

// 响应式状态
const modelState = reactive({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1,
  color: '#42b883',
  metalness: 0.5,
  roughness: 0.5,
  wireframe: false,
})

const isSelected = ref(false)
const hoveredObject = ref<string | null>(null)

// watch 响应式状态变化 → 更新3D场景
watch(
  () => modelState.scale,
  (newScale) => {
    console.log('Scale changed:', newScale)
    // TresJS 自动响应式绑定，无需手动更新
  }
)

// 渲染循环
const { onLoop } = useRenderLoop()
onLoop(({ delta }) => {
  if (isSelected.value) {
    modelState.rotation.y += delta * 0.5
  }
})

// Raycasting 鼠标拾取
const onPointerEnter = (event: any) => {
  hoveredObject.value = event.object.name
  document.body.style.cursor = 'pointer'
}
const onPointerLeave = () => {
  hoveredObject.value = null
  document.body.style.cursor = 'default'
}
const onClick = (event: any) => {
  isSelected.value = !isSelected.value
}
</script>

<template>
  <div class="scene-container">
    <TresCanvas>
      <TresPerspectiveCamera :position="[0, 2, 5]" />
      <TresMesh
        :position="[modelState.position.x, modelState.position.y, modelState.position.z]"
        :scale="modelState.scale"
        @pointer-enter="onPointerEnter"
        @pointer-leave="onPointerLeave"
        @click="onClick"
      >
        <TresBoxGeometry />
        <TresMeshStandardMaterial
          :color="modelState.color"
          :metalness="modelState.metalness"
          :roughness="modelState.roughness"
          :wireframe="modelState.wireframe"
        />
      </TresMesh>
      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight :position="[5, 5, 5]" />
    </TresCanvas>

    <!-- 控制面板 -->
    <div class="control-panel">
      <label>颜色: <input type="color" v-model="modelState.color" /></label>
      <label>金属度: <input type="range" v-model.number="modelState.metalness" min="0" max="1" step="0.01" /></label>
      <label>粗糙度: <input type="range" v-model.number="modelState.roughness" min="0" max="1" step="0.01" /></label>
      <label>缩放: <input type="range" v-model.number="modelState.scale" min="0.1" max="3" step="0.1" /></label>
      <label><input type="checkbox" v-model="modelState.wireframe" /> 线框模式</label>
    </div>
  </div>
</template>

<style scoped>
.scene-container { position: relative; width: 100%; height: 100vh; }
.control-panel {
  position: absolute; top: 20px; right: 20px;
  background: rgba(0,0,0,0.7); padding: 16px; border-radius: 8px;
  color: white; display: flex; flex-direction: column; gap: 8px;
}
</style>
```

### 交付物
- [ ] Vue3 响应式状态驱动 3D 场景更新
- [ ] Raycasting 鼠标拾取 + 高亮反馈
- [ ] 控制面板实时调参（颜色/材质/变换）
- [ ] 3D 对象点击选中 + 状态面板联动

---

## Day 6：性能优化与后处理

### 理论目标
- Three.js 性能瓶颈定位：Draw Call、三角形数、Shader 复杂度
- 实例化渲染 (InstancedMesh) 批量绘制
- LOD (Level of Detail) 距离切换
- 视锥剔除 (Frustum Culling) 原理
- 后处理管线：EffectComposer → Pass 链

### 实践任务

#### 6.1 InstancedMesh 批量渲染

```typescript
// 1000个实例化物体
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
const material = new THREE.MeshStandardMaterial({ color: '#42b883' })
const instancedMesh = new THREE.InstancedMesh(geometry, material, 1000)

const dummy = new THREE.Object3D()
const color = new THREE.Color()

for (let i = 0; i < 1000; i++) {
  dummy.position.set(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
  )
  dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
  dummy.scale.setScalar(Math.random() * 0.5 + 0.5)
  dummy.updateMatrix()
  instancedMesh.setMatrixAt(i, dummy.matrix)

  // 随机颜色
  color.setHSL(Math.random(), 0.7, 0.5)
  instancedMesh.setColorAt(i, color)
}
instancedMesh.instanceMatrix.needsUpdate = true
instancedMesh.instanceColor!.needsUpdate = true
```

#### 6.2 LOD 设置

```typescript
const lod = new THREE.LOD()

// 高精度模型（近处）
const highPoly = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshStandardMaterial({ color: '#ff6b6b' })
)
lod.addLevel(highPoly, 0)

// 中精度模型
const midPoly = new THREE.Mesh(
  new THREE.SphereGeometry(1, 16, 16),
  new THREE.MeshStandardMaterial({ color: '#ff6b6b' })
)
lod.addLevel(midPoly, 10)

// 低精度模型（远处）
const lowPoly = new THREE.Mesh(
  new THREE.SphereGeometry(1, 8, 8),
  new THREE.MeshStandardMaterial({ color: '#ff6b6b' })
)
lod.addLevel(lowPoly, 30)
```

#### 6.3 后处理管线

```typescript
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'

const composer = new EffectComposer(renderer)

// 1. 渲染通道
composer.addPass(new RenderPass(scene, camera))

// 2. 泛光 (Bloom)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.8,  // 强度
  0.4,  // 半径
  0.85, // 阈值
)
composer.addPass(bloomPass)

// 渲染循环
function animate() {
  composer.render() // 替换 renderer.render(scene, camera)
}
```

### 性能调优清单

```typescript
// 1. 限制像素比
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// 2. 按需渲染（非持续渲染）
renderer.setAnimationLoop(null) // 停止自动渲染
// 只在状态变化时调用 render()

// 3. 几何体合并
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
const merged = mergeGeometries([geo1, geo2, geo3])

// 4. 纹理压缩
// 使用 Basis Universal / KTX2 格式
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'

// 5. 性能监控
import Stats from 'three/addons/libs/stats.module.js'
const stats = new Stats()
document.body.appendChild(stats.dom)
```

### 交付物
- [ ] InstancedMesh 渲染 1000+ 物体保持 60fps
- [ ] LOD 距离切换效果
- [ ] Unreal Bloom 后处理效果
- [ ] 性能面板 (Stats + Spector.js) 集成

---

## Day 7：美术管线搭建（Blender → glTF → Web）

### 理论目标
- 美术资产生产流程：建模 → UV → 材质 → 骨骼 → 动画 → 导出
- Blender glTF 导出设置与注意事项
- 模型优化策略：减面、纹理压缩、Draco 压缩
- 纹理格式选择：PNG vs WebP vs KTX2

### Blender glTF 导出清单

| 设置项 | 推荐值 | 说明 |
|--------|-------|------|
| Format | glTF Binary (.glb) | 单文件，加载最快 |
| Mesh | ✅ Apply Modifiers | 应用修改器 |
| Skin | ✅ Skinning | 骨骼蒙皮 |
| Shape Keys | ✅ Shape Keys | 表情/形变 |
| Animation | ✅ Animations | 骨骼动画 |
| Compression | ✅ Draco | 几何压缩 60-80% |
| Materials | ✅ Materials | PBR 材质 |
| Textures | ✅ Textures | 内嵌或外置 |

### 模型优化工具链

```bash
# gltf-transform CLI 工具
npx gltf-transform copy input.glb output.glb
npx gltf-transform draco input.glb output.glb
npx gltf-transform meshopt input.glb output.glb
npx gltf-transform resize input.glb output.glb --width 1024 --height 1024
npx gltf-transform merge model1.glb model2.glb merged.glb

# 在线分析工具
# https://gltf-report.dev — 模型体积分析
# https://modelviewer.dev/editor — 快速预览
```

### 实践任务

```typescript
// 前端加载优化：Draco 解码器
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// 加载进度
gltfLoader.load(
  '/models/character.glb',
  (gltf) => {
    scene.add(gltf.scene)
    // 打印模型信息
    console.log('Animations:', gltf.animations.length)
    console.log('Scenes:', gltf.scene.children.length)
  },
  (progress) => {
    const percent = (progress.loaded / progress.total * 100).toFixed(0)
    console.log(`Loading: ${percent}%`)
  },
  (error) => console.error('Load error:', error),
)
```

### 交付物
- [ ] Blender 模型导出 glTF 并在 Web 中加载
- [ ] 使用 gltf-transform 进行 Draco 压缩，记录压缩率
- [ ] 编写模型加载进度条组件
- [ ] 整理美术资产规范文档

---

## Day 8：引擎对接预研 + 综合项目

### 理论目标
- Unity WebGL 导出方案与限制
- Unreal Pixel Streaming 方案原理
- 纯 Web 方案 (Three.js) vs 引擎方案对比
- 前端项目架构设计

### 方案对比

| 维度 | Unity WebGL | Unreal Pixel Streaming | 纯 Web (Three.js) |
|------|------------|----------------------|-------------------|
| 渲染质量 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 加载速度 | ⭐⭐ (WASM大) | ⭐ (需服务端) | ⭐⭐⭐⭐⭐ |
| 交互延迟 | ⭐⭐⭐ | ⭐⭐ (网络延迟) | ⭐⭐⭐⭐⭐ |
| 移动端兼容 | ⭐⭐ | ⭐ | ⭐⭐⭐⭐ |
| 开发效率 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| 维护成本 | ⭐⭐ | ⭐ | ⭐⭐⭐⭐ |

### 综合项目：3D 产品展示页

```vue
<!-- ProductShowcase.vue 综合项目结构 -->
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { useGLTF } from '@tresjs/cientos'

// 产品配置
const config = reactive({
  currentColor: '#42b883',
  currentVariant: 0,
  autoRotate: true,
  bloom: true,
  wireframe: false,
})

// 加载产品模型
const { scene: productModel, animations } = await useGLTF('/models/product.glb')

// Sketchfab 备用方案
const useSketchfab = ref(false)
const sketchfabModelId = 'your-model-id'
</script>

<template>
  <div class="showcase">
    <!-- 3D 场景 / Sketchfab 切换 -->
    <div class="viewport">
      <TresCanvas v-if="!useSketchfab" clear-color="#0a0a1a" window-size>
        <TresPerspectiveCamera :position="[0, 1, 3]" />
        <primitive :object="productModel" />
        <TresAmbientLight :intensity="0.3" />
        <TresDirectionalLight :position="[5, 5, 5]" :intensity="1" />
        <TresPointLight :position="[-3, 2, -3]" color="#6366f1" :intensity="0.5" />
      </TresCanvas>

      <SketchfabViewer
        v-else
        :model-id="sketchfabModelId"
        @ready="onSketchfabReady"
      />
    </div>

    <!-- 产品配置面板 -->
    <div class="panel">
      <h2>产品定制</h2>
      <div class="color-picker">
        <button
          v-for="color in ['#42b883', '#6366f1', '#f43f5e', '#f59e0b']"
          :key="color"
          :style="{ background: color }"
          :class="{ active: config.currentColor === color }"
          @click="config.currentColor = color"
        />
      </div>
      <label>
        <input type="checkbox" v-model="config.autoRotate" />
        自动旋转
      </label>
      <label>
        <input type="checkbox" v-model="config.bloom" />
        泛光效果
      </label>
      <label>
        <input type="checkbox" v-model="config.wireframe" />
        线框模式
      </label>
      <button @click="useSketchfab = !useSketchfab">
        切换到{{ useSketchfab ? '本地渲染' : 'Sketchfab' }}
      </button>
    </div>
  </div>
</template>
```

### 交付物
- [ ] 完整的 3D 产品展示页面
- [ ] 颜色/材质配置交互
- [ ] Sketchfab 与本地渲染切换
- [ ] 后处理效果开关
- [ ] 引擎方案对比文档

---

## 附录

### 推荐资源

| 类别 | 资源 |
|------|------|
| Three.js 文档 | https://threejs.org/docs/ |
| TresJS 文档 | https://tresjs.org/ |
| Sketchfab API | https://sketchfab.com/developers/viewer |
| glTF 规范 | https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html |
| Shader 教程 | https://thebookofshaders.com/ |
| Blender glTF | https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html |
| gltf-transform | https://gltf-transform.dev/ |
| 模型分析 | https://gltf-report.dev |

### 开发调试工具

| 工具 | 用途 |
|------|------|
| Spector.js | WebGL 调用抓帧分析 |
| Chrome DevTools → Performance | 帧率 / 内存分析 |
| Stats.js | 实时 FPS / 内存 / DrawCall |
| three.js Inspector | 场景树浏览器扩展 |
| gltf-report.dev | 模型体积/结构分析 |

### 项目目录结构参考

```
threejs/
├── practice-day1/          # Day1 基础场景
├── practice-day2/          # Day2 模型加载 + Sketchfab
├── practice-day3/          # Day3 PBR 材质
├── practice-day4/          # Day4 Shader 编程
├── practice-day5/          # Day5 Vue3 + 3D 交互
├── practice-day6/          # Day6 性能优化
├── practice-day7/          # Day7 美术管线
├── practice-day8/          # Day8 综合项目
├── models/                 # 共享模型资源
│   ├── character.glb
│   ├── product.glb
│   └── environment.hdr
└── shaders/                # 共享 Shader 代码
    ├── wave.vert
    ├── wave.frag
    ├── fresnel.frag
    └── utils.glsl
```

---

> **核心原则**：每天先跑通 Demo 再深究原理，边做边学，确保入职第一天就能上手实际项目。
