# Day 4：Shader 编程在前端中的应用

> 目标：掌握 GLSL Shader 的基础语法与渲染思路，在 Three.js / TresJS 中实现一个可交互的自定义波浪材质，并通过菲涅尔边缘光、扫描线和噪声增强画面表现力。

---

## 一、理论目标

### 1.1 Shader 在渲染管线中的位置

在 Three.js 中，最终画面并不是“材质自己画出来”的，而是 GPU 按照 Shader 程序逐顶点、逐像素计算出来的。

```text
CPU（JavaScript / Vue）
  └─ 准备 Geometry、Material、uniform、纹理、相机参数

GPU Vertex Shader（顶点着色器）
  └─ 逐顶点执行：决定顶点位置、传递插值数据

GPU Rasterization（光栅化）
  └─ 把三角形拆成很多片元（fragment）

GPU Fragment Shader（片元着色器）
  └─ 逐片元执行：决定每个像素最终颜色

FrameBuffer
  └─ 输出到屏幕
```

**一句话理解：**

- **Vertex Shader** 决定“物体长什么形状、顶点去哪里”
- **Fragment Shader** 决定“表面每个像素显示什么颜色”

### 1.2 `uniform` / `attribute` / `varying` 是什么

Shader 里最常见的三个概念：

| 关键字 | 数据来源 | 作用阶段 | 典型用途 |
|--------|----------|----------|----------|
| `attribute` | Geometry 顶点属性 | Vertex Shader | `position`、`normal`、`uv` |
| `uniform` | CPU 每帧传入 | Vertex + Fragment | 时间、颜色、强度、纹理 |
| `varying` | Vertex 输出后插值 | Fragment Shader | 把顶点数据传给片元阶段 |

```glsl
uniform float uTime;   // CPU 传入的统一变量
varying vec2 vUv;      // 顶点阶段传给片元阶段

void main() {
  vUv = uv;
}
```

> 在 WebGL2 / 新版 GLSL 中，`varying` 被拆成 `out` / `in`；但在 Three.js 常用的 Shader 写法里，仍然会看到 `varying` 形式。

### 1.3 `ShaderMaterial` vs `RawShaderMaterial`

| 材质 | 特点 | 适用场景 |
|------|------|----------|
| `THREE.ShaderMaterial` | Three.js 会自动注入常用内置变量，如 `projectionMatrix`、`modelViewMatrix`、`cameraPosition` | **最常用，学习和业务开发首选** |
| `THREE.RawShaderMaterial` | 几乎不做额外注入，Shader 更底层、更接近原生 WebGL | 需要完全自定义底层输入时使用 |

**建议：Day 4 先用 `ShaderMaterial`。**

这样你可以先专注在“形变和颜色算法”，不用一开始就处理太多底层样板代码。

### 1.4 常见 Shader 技巧与适用场景

| 技巧 | 作用 | 典型用途 |
|------|------|----------|
| UV 动画 | 让纹理坐标随时间偏移 | 水流、能量流动、屏幕扫描 |
| 顶点位移 | 直接改变顶点位置 | 波浪、旗帜、地形起伏 |
| 菲涅尔（Fresnel） | 视角越贴边，边缘越亮 | 能量罩、玻璃边缘光、科技描边 |
| 噪声（Noise） | 增加随机细节 | 云、火焰、电流、扰动 |
| 扫描线（ScanLine） | 周期性高亮条纹 | HUD、科幻屏幕、雷达面板 |

---

## 二、项目准备

### 2.1 继续沿用 `practice-day1`

本节继续使用前 3 天已经搭好的 `practice-day1` 项目：

```bash
cd practice-day1
npm install
```

确保至少有这些依赖：

```bash
npm install three @tresjs/core @tresjs/cientos
npm install -D @types/three
```

### 2.2 本节先用“内联 Shader 字符串”

为了把重点放在 **Shader 原理本身**，本节先不引入额外的 GLSL 文件加载插件，而是把 `vertexShader` 和 `fragmentShader` 直接写在组件里。

这样有两个好处：

1. **最少配置**：不用额外改 Vite
2. **最直观**：便于对照 `uniform`、`varying`、GLSL 函数的作用

后续如果项目中 Shader 变多，再考虑拆成单独 `.glsl` 文件。

### 2.3 为什么波浪效果要用高分段平面

Shader 的顶点位移只会移动**已有顶点**。

所以：

- 一个只有 `1 x 1` 分段的平面，顶点太少，几乎看不出波浪
- 一个 `256 x 256` 分段的平面，顶点足够密，波形才会顺滑

```text
顶点越多 → 可形变的采样点越多 → 波浪越平滑
顶点越少 → 形变只能发生在少量顶点上 → 效果像折纸
```

---

## 三、实现一个可交互的波浪 Shader

### 3.1 完整代码：`src/App.vue`

将 `src/App.vue` 临时替换为下面这份示例代码，先把效果跑通：

```vue
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import * as THREE from 'three'
import { TresCanvas, useRenderLoop } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'

// -----------------------------
// Vue 响应式参数（绑定到控制面板）
// -----------------------------
const amplitude = ref(0.25)
const frequency = ref(2.0)
const speed = ref(1.2)
const fresnelPower = ref(3.0)
const scanStrength = ref(0.18)
const colorA = ref('#42b883')
const colorB = ref('#38bdf8')
const wireframe = ref(false)

// -----------------------------
// Vertex Shader：顶点位移（波浪）
// -----------------------------
const vertexShader = `
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;

varying vec2 vUv;
varying float vElevation;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main() {
  vUv = uv;

  vec3 pos = position;

  float waveX = sin(pos.x * uFrequency + uTime);
  float waveY = sin(pos.y * (uFrequency * 0.75) + uTime * 1.2);
  float elevation = waveX * waveY * uAmplitude;

  pos.z += elevation;
  vElevation = elevation;

  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

// -----------------------------
// Fragment Shader：颜色、噪声、扫描线、菲涅尔
// -----------------------------
const fragmentShader = `
uniform float uTime;
uniform float uAmplitude;
uniform float uFresnelPower;
uniform float uScanStrength;
uniform vec3 uColorA;
uniform vec3 uColorB;

varying vec2 vUv;
varying float vElevation;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

float scanLine(float uvY, float time) {
  return smoothstep(0.0, 0.02, abs(sin(uvY * 80.0 - time * 3.0)));
}

float fresnel(vec3 viewDir, vec3 normal, float power) {
  return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
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

void main() {
  float gradient = smoothstep(-uAmplitude, uAmplitude, vElevation);
  vec3 baseColor = mix(uColorA, uColorB, gradient);

  float grain = noise(vUv * 8.0 + uTime * 0.05) * 0.08;
  float line = scanLine(vUv.y + grain, uTime) * uScanStrength;

  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float edge = fresnel(viewDir, normalize(vWorldNormal), uFresnelPower);

  vec3 color = baseColor;
  color += edge * vec3(0.65, 0.95, 1.0);
  color += line * vec3(0.3, 0.8, 1.0);
  color += grain * 0.12;

  gl_FragColor = vec4(color, 1.0);
}
`

// -----------------------------
// 创建自定义 ShaderMaterial
// -----------------------------
const waveMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uAmplitude: { value: amplitude.value },
    uFrequency: { value: frequency.value },
    uFresnelPower: { value: fresnelPower.value },
    uScanStrength: { value: scanStrength.value },
    uColorA: { value: new THREE.Color(colorA.value) },
    uColorB: { value: new THREE.Color(colorB.value) },
  },
  vertexShader,
  fragmentShader,
  side: THREE.DoubleSide,
  wireframe: wireframe.value,
})

// -----------------------------
// Vue 状态变化 → 同步 uniforms
// -----------------------------
watch(
  [amplitude, frequency, fresnelPower, scanStrength, colorA, colorB, wireframe],
  ([nextAmplitude, nextFrequency, nextFresnel, nextScan, nextColorA, nextColorB, nextWireframe]) => {
    waveMaterial.uniforms.uAmplitude.value = nextAmplitude
    waveMaterial.uniforms.uFrequency.value = nextFrequency
    waveMaterial.uniforms.uFresnelPower.value = nextFresnel
    waveMaterial.uniforms.uScanStrength.value = nextScan
    waveMaterial.uniforms.uColorA.value.set(nextColorA)
    waveMaterial.uniforms.uColorB.value.set(nextColorB)
    waveMaterial.wireframe = nextWireframe
  },
  { immediate: true },
)

// -----------------------------
// 渲染循环：驱动时间变量
// -----------------------------
const { onLoop } = useRenderLoop()
onLoop(({ elapsed }) => {
  waveMaterial.uniforms.uTime.value = elapsed * speed.value
})

onBeforeUnmount(() => {
  waveMaterial.dispose()
})
</script>

<template>
  <div class="page">
    <TresCanvas clear-color="#050816" window-size>
      <TresPerspectiveCamera :position="[0, 1.8, 4.8]" :look-at="[0, 0, 0]" />
      <OrbitControls />

      <!-- 波浪平面 -->
      <TresMesh :rotation="[-Math.PI / 2.2, 0, 0]" :position="[0, -0.2, 0]">
        <TresPlaneGeometry :args="[5.2, 5.2, 256, 256]" />
        <primitive :object="waveMaterial" attach="material" />
      </TresMesh>

      <!-- 一个普通球体作为空间参照 -->
      <TresMesh :position="[0, 1.15, -1.3]">
        <TresSphereGeometry :args="[0.38, 48, 48]" />
        <TresMeshStandardMaterial color="#ffffff" emissive="#60a5fa" :emissive-intensity="1.1" />
      </TresMesh>

      <TresAmbientLight :intensity="0.35" />
      <TresDirectionalLight :position="[3, 5, 2]" :intensity="1.2" color="#ffffff" />
      <TresPointLight :position="[-2, 1, 2]" color="#38bdf8" :intensity="6" :distance="10" />
    </TresCanvas>

    <aside class="panel">
      <h3>Shader 控制面板</h3>

      <label>
        波浪振幅
        <input v-model.number="amplitude" type="range" min="0" max="0.8" step="0.01" />
        <span>{{ amplitude.toFixed(2) }}</span>
      </label>

      <label>
        波浪频率
        <input v-model.number="frequency" type="range" min="0.5" max="6" step="0.1" />
        <span>{{ frequency.toFixed(1) }}</span>
      </label>

      <label>
        动画速度
        <input v-model.number="speed" type="range" min="0" max="4" step="0.05" />
        <span>{{ speed.toFixed(2) }}</span>
      </label>

      <label>
        菲涅尔强度
        <input v-model.number="fresnelPower" type="range" min="0.5" max="8" step="0.1" />
        <span>{{ fresnelPower.toFixed(1) }}</span>
      </label>

      <label>
        扫描线强度
        <input v-model.number="scanStrength" type="range" min="0" max="0.8" step="0.01" />
        <span>{{ scanStrength.toFixed(2) }}</span>
      </label>

      <label>
        颜色 A
        <input v-model="colorA" type="color" />
      </label>

      <label>
        颜色 B
        <input v-model="colorB" type="color" />
      </label>

      <label class="checkbox">
        <input v-model="wireframe" type="checkbox" />
        线框模式
      </label>
    </aside>
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
  z-index: 10;
  width: 280px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(7, 12, 28, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(12px);
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
}

.panel h3 {
  margin: 0 0 4px;
  color: #a5f3fc;
  font-size: 15px;
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
  min-width: 44px;
  text-align: right;
  color: #86efac;
}

.panel input[type='color'] {
  width: 100%;
  height: 32px;
  border: none;
  background: transparent;
}

.checkbox {
  grid-template-columns: auto 1fr;
}
</style>
```

### 3.2 跑起来后你应该看到什么

页面正常时，应该出现以下效果：

- 一个倾斜摆放的波浪平面，表面随时间起伏
- 表面颜色在两种颜色之间渐变过渡
- 边缘会有明显的蓝白色菲涅尔高光
- 面上有轻微扫描线和噪声扰动
- 右侧控制面板调参时，画面实时变化

---

## 四、关键概念逐行解释

### 4.1 为什么顶点位移写在 Vertex Shader

顶点着色器的职责是**改变几何形状**。

```glsl
float waveX = sin(pos.x * uFrequency + uTime);
float waveY = sin(pos.y * (uFrequency * 0.75) + uTime * 1.2);
float elevation = waveX * waveY * uAmplitude;
pos.z += elevation;
```

这段代码的含义：

- `sin(...)` 负责制造周期性波动
- `uFrequency` 控制波有多密
- `uAmplitude` 控制波有多高
- `uTime` 让波随时间流动
- `pos.z += elevation` 表示把顶点沿法线近似方向抬高

> 注意：这里的平面初始是在 `XY` 平面上，所以我们让 `z` 方向起伏；之后再通过 Mesh 旋转把它摆成场景里的“地面”。

### 4.2 为什么颜色计算写在 Fragment Shader

片元着色器决定每个像素最终显示什么颜色。

```glsl
float gradient = smoothstep(-uAmplitude, uAmplitude, vElevation);
vec3 baseColor = mix(uColorA, uColorB, gradient);
```

这里做了两件事：

1. 根据波峰/波谷高度 `vElevation` 生成一个平滑的 0 到 1 过渡值
2. 用 `mix()` 在两种颜色之间插值

所以：

- 波谷更偏 `uColorA`
- 波峰更偏 `uColorB`

### 4.3 `varying` 的作用：把顶点信息传给片元

在顶点阶段算出的数据，如果想让片元阶段也用上，就要通过 `varying` 传递：

```glsl
varying float vElevation;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
```

GPU 会自动对三角形内部做插值，因此片元阶段可以拿到“当前位置附近”的平滑数据。

### 4.4 为什么 `ShaderMaterial` 默认“不吃灯光”

很多人第一次用 Shader 会踩这个坑：

- `MeshStandardMaterial` 会自动处理光照、阴影、PBR
- **`ShaderMaterial` 不会自动帮你算这些**

也就是说，下面这句：

```glsl
gl_FragColor = vec4(color, 1.0);
```

已经直接定义了像素最终颜色，Three.js 不会再额外给你做标准光照模型。

所以本练习里加的 `AmbientLight`、`DirectionalLight` 主要是为了照亮旁边的参照球体，而不是为了驱动波浪材质本身。

### 4.5 `cameraPosition` 为什么能直接使用

因为我们用的是 `THREE.ShaderMaterial`，Three.js 会自动提供一些常用内置变量，例如：

- `projectionMatrix`
- `modelMatrix`
- `viewMatrix`
- `cameraPosition`
- `position`
- `normal`
- `uv`

所以在片元阶段可以直接计算观察方向：

```glsl
vec3 viewDir = normalize(cameraPosition - vWorldPosition);
```

这也是实现菲涅尔效果的基础。

---

## 五、菲涅尔、扫描线与噪声是怎么组合起来的

### 5.1 菲涅尔（Fresnel）边缘光

菲涅尔的直觉是：**视线越贴近物体边缘，反射/发光越强。**

```glsl
float fresnel(vec3 viewDir, vec3 normal, float power) {
  return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
}
```

- `dot(viewDir, normal)` 越接近 1，说明你在正看表面
- 越接近 0，说明你在斜着看边缘
- `1.0 - dot(...)` 后，边缘值就更大
- `pow(..., power)` 控制边缘收缩和锐利程度

**适合做：**

- 能量罩
- 玻璃边缘高光
- 科技感描边
- 角色外轮廓辉光

### 5.2 扫描线（Scan Line）

```glsl
float scanLine(float uvY, float time) {
  return smoothstep(0.0, 0.02, abs(sin(uvY * 80.0 - time * 3.0)));
}
```

这类写法本质上是：

- 用 `sin()` 生成周期性条纹
- 让条纹沿着 `uvY` 分布
- 再让时间参与相位偏移，产生滚动感

**适合做：**

- HUD 面板
- 雷达扫描
- 全息投影
- 故障风（Glitch）屏幕

### 5.3 噪声（Noise）

纯净的渐变和条纹往往太“数字化”，不够自然。

所以我们加入一点点噪声：

```glsl
float grain = noise(vUv * 8.0 + uTime * 0.05) * 0.08;
```

作用：

- 打破过于平滑的渐变
- 让扫描线不那么死板
- 提升“液体 / 能量 / 科技材质”的细节感

---

## 六、如何把 Shader 与 Vue3 响应式系统绑定

这一步是前端技术美术最重要的能力之一：**不是只会写 Shader，而是会把 Shader 参数接进 UI 和业务状态。**

### 6.1 `uniform` 本质就是“可控参数接口”

在 Three.js 里，Shader 暴露给 CPU 的参数通常都写在 `uniforms` 里：

```typescript
const waveMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uAmplitude: { value: 0.25 },
    uFrequency: { value: 2.0 },
    uColorA: { value: new THREE.Color('#42b883') },
  },
})
```

这些值就像“材质控制台”的输入口。

### 6.2 Vue 的 `watch` 正好可以驱动这些参数

```typescript
watch(amplitude, (value) => {
  waveMaterial.uniforms.uAmplitude.value = value
})
```

因此你可以很自然地把：

- 滑块
- 颜色选择器
- 场景配置 JSON
- 接口返回数据
- 动画时间轴

都映射到 Shader 上。

这也是技术美术岗位里很常见的一种桥接工作：

```text
设计目标 / 业务需求
  ↓
Vue 状态层（ref / reactive）
  ↓
uniform 参数
  ↓
GPU Shader 表现
```

### 6.3 `uTime` 一般放到渲染循环里更新

时间变量不应该靠 `setInterval()` 驱动，而应该跟随渲染循环：

```typescript
const { onLoop } = useRenderLoop()
onLoop(({ elapsed }) => {
  waveMaterial.uniforms.uTime.value = elapsed * speed.value
})
```

这样有三个好处：

1. 动画和渲染帧同步
2. 浏览器掉帧时也更稳定
3. 更容易和 Three.js / TresJS 生态保持一致

---

## 七、运行与验证

```bash
cd practice-day1
npm run dev
# 浏览器访问 http://localhost:5173
```

### 验证清单

- [ ] 页面可以正常打开，无 Vue / TypeScript 报错
- [ ] 场景中能看到一个会起伏的平面
- [ ] 鼠标可通过 OrbitControls 旋转和缩放视角
- [ ] 调节“波浪振幅”时，波高实时变化
- [ ] 调节“波浪频率”时，波峰密度实时变化
- [ ] 调节“动画速度”时，运动节奏发生变化
- [ ] 调节“菲涅尔强度”时，边缘发光变强或变弱
- [ ] 调节“扫描线强度”时，面上的科技感条纹明显变化
- [ ] 切换颜色 A / B 时，材质渐变颜色立即更新
- [ ] 勾选线框模式后，可以明显看到高分段网格结构

---

## 八、常见问题排查

| 问题 | 原因 | 解决方法 |
|------|------|---------|
| 页面一片黑 / 没有任何物体 | Shader 编译失败或摄像机没对准 | 先看浏览器控制台中的 GLSL 报错，再检查相机位置 |
| 波浪几乎不动 | 没有更新 `uTime` | 确认 `useRenderLoop` 中有 `waveMaterial.uniforms.uTime.value = ...` |
| 看不到明显形变 | 平面分段太少 | 把 `PlaneGeometry` 分段提高到 `128` 或 `256` |
| 颜色没有响应 UI 改动 | 只改了 Vue 状态，没同步到 uniforms | 用 `watch` 把 ref 值写回 `waveMaterial.uniforms` |
| 菲涅尔效果很奇怪 | 法线或世界坐标传递不对 | 检查 `vWorldNormal` 与 `vWorldPosition` 是否在顶点阶段正确赋值 |
| Shader 报类型错误 | GLSL 中 `float` / `vec2` / `vec3` 混用 | 检查常量维度和函数参数类型是否一致 |
| 扫描线太生硬 | 直接使用 `sin()` 没有平滑处理 | 用 `smoothstep()` 做边缘软化 |
| 线框模式没反应 | 改了 Vue 状态但没同步材质对象 | 记得设置 `waveMaterial.wireframe = nextWireframe` |
| 热更新后效果异常 | 材质对象未释放 | 在 `onBeforeUnmount()` 中调用 `waveMaterial.dispose()` |

---

## 九、扩展练习（可选）

1. **拆出多个 Shader 预设**：把当前波浪材质扩展成“海面”“能量池”“全息屏”“熔岩面”四种预设
2. **加入鼠标交互扰动**：监听鼠标位置，在 Shader 中让鼠标附近出现额外涟漪
3. **叠加法线贴图思路**：将程序噪声与贴图噪声混合，做更复杂的表面细节
4. **尝试 `RawShaderMaterial`**：把当前例子改成 `RawShaderMaterial`，对比需要自己补哪些内置变量
5. **把 Shader 做成可复用组件**：例如封装一个 `WaveSurface.vue`，通过 props 暴露 amplitude、speed、palette 等参数
6. **做一个科技面板背景**：保留扫描线 + 菲涅尔 + 噪声，去掉波浪形变，做 2D HUD 背景材质

---

## 十、补充：什么时候该用自定义 Shader

不是所有效果都要上 Shader。

### 10.1 更适合直接用 Three.js 内置材质的情况

- 普通 PBR 模型展示
- 常规金属 / 玻璃 / 塑料 / 布料材质
- 只需要调 `color` / `roughness` / `metalness`

### 10.2 更适合上 Shader 的情况

- 需要顶点形变（波浪、扭曲、呼吸、抖动）
- 需要屏幕特效感（扫描线、故障、全息）
- 需要非标准光照或艺术化渲染
- 需要程序生成效果，而不是纯贴图驱动

**判断原则：**

> 如果内置材质 + 贴图已经能完成目标，就先别急着上 Shader；如果效果依赖“逐顶点 / 逐像素的自定义算法”，那就是 Shader 的舞台。

---

> **下一步**：Day 5 将把 Vue3 响应式系统与 3D 场景交互结合起来，重点学习 `ref / reactive / watch` 如何驱动模型变换、材质参数和鼠标拾取反馈。