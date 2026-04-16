# Day 3：PBR 材质在 WebGL 中的实现

> 目标：理解 PBR（基于物理的渲染）核心原理，掌握 Metal-Rough 工作流，在 Three.js 中实现完整 PBR 材质球，并通过 HDR 环境贴图实现真实感反射效果。

---

## 一、理论目标

### 1.1 PBR 是什么

PBR（Physically Based Rendering，基于物理的渲染）是一种遵循现实物理规律的渲染方法。其核心思想：**光在现实世界中如何反射，在计算机中就如何模拟**。

```
传统渲染（Phone/Blinn-Phone）
  └─ 经验公式模拟光照，参数无明确物理含义，不同引擎效果不一致

PBR 渲染
  └─ 基于能量守恒、微表面模型、菲涅尔效应等物理定律
  └─ 参数有明确物理含义（金属度、粗糙度），在不同光照环境中表现一致
  └─ 美术可以在 Blender / Substance Painter 中制作，Web 中保持一致效果
```

**PBR 三大核心物理定律：**

| 定律       | 说明                                                             |
| ---------- | ---------------------------------------------------------------- |
| 能量守恒   | 反射光 + 折射光 ≤ 入射光总量，光不会无中生有                     |
| 微表面模型 | 粗糙表面由大量微小镜面组成，粗糙度控制微表面朝向的随机分布       |
| 菲涅尔效应 | 观察角度越平（掠角），反射越强。水面斜看几乎是镜面，垂直看却透明 |

### 1.2 Metal-Rough 工作流

Metal-Rough（金属度-粗糙度）是 glTF 标准采用的 PBR 工作流，也是目前 Web 3D 的主流方案。

```
Metal-Rough 工作流核心贴图：

BaseColor（基础颜色）
  ├─ 金属物体 → 存储反射颜色（铜的橙金色、铝的银白色）
  └─ 非金属物体 → 存储漫反射颜色（固有色）

Metallic（金属度）：0 = 非金属（塑料/木头），1 = 全金属（铁/铜）
  └─ 决定 BaseColor 如何被解读：漫反射色 or 镜面反射色

Roughness（粗糙度）：0 = 完全光滑（镜面），1 = 完全粗糙（哑光）
  └─ 控制高光范围大小：粗糙大→高光扩散，光滑小→高光集中锐利

Normal（法线贴图）：模拟表面凹凸细节，不增加三角形数量

AO（环境遮蔽）：预计算凹槽阴影，增强细节和厚重感

Emissive（自发光）：不依赖外部光照，材质自身发光（如 LED 屏幕）
```

**PBR 贴图映射关系（Three.js）：**

| PBR 通道  | Three.js 属性  | 颜色空间   | 说明                   |
| --------- | -------------- | ---------- | ---------------------- |
| BaseColor | `map`          | **sRGB**   | 基础颜色贴图           |
| Metallic  | `metalnessMap` | **Linear** | 金属度贴图（B 通道）   |
| Roughness | `roughnessMap` | **Linear** | 粗糙度贴图（G 通道）   |
| Normal    | `normalMap`    | **Linear** | 法线贴图（切线空间）   |
| AO        | `aoMap`        | **Linear** | 环境遮蔽贴图（R 通道） |
| Emissive  | `emissiveMap`  | **sRGB**   | 自发光贴图             |

> ⚠️ **颜色空间是 PBR 正确渲染的关键**：BaseColor 和 Emissive 是人眼感知颜色，需要 sRGB；其余物理量贴图必须是线性空间。设置错误会导致材质效果严重偏差。

### 1.3 MeshStandardMaterial vs MeshPhysicalMaterial

| 特性       | MeshStandardMaterial | MeshPhysicalMaterial                 |
| ---------- | -------------------- | ------------------------------------ |
| PBR 支持   | ✅ 基础 PBR          | ✅ 扩展 PBR（超集）                  |
| 透明涂层   | ❌                   | ✅ `clearcoat`（汽车漆、指甲油）     |
| 次表面散射 | ❌                   | ✅ `transmission`（玻璃、皮肤）      |
| 光泽层     | ❌                   | ✅ `sheen`（布料、天鹅绒）           |
| 虹彩效果   | ❌                   | ✅ `iridescence`（肥皂泡、蝴蝶翅膀） |
| 性能开销   | 较低                 | 较高（更多 Shader 分支）             |
| 适用场景   | 通用场景             | 特殊材质效果                         |

> **选择建议**：大多数情况用 `MeshStandardMaterial`；需要玻璃、车漆、布料等特殊效果时升级为 `MeshPhysicalMaterial`。

### 1.4 HDR 环境贴图的作用

PBR 材质的光泽感高度依赖**环境贴图（EnvMap）**：

```
没有 EnvMap：
  金属球看起来只是深色球体，完全没有金属感
  玻璃材质无法看到折射/透射效果

有 HDR EnvMap：
  金属球能反射周围环境，出现真实的高光和倒影
  反射强度 = envMapIntensity（默认 1.0）
  HDR（High Dynamic Range）存储真实的光照亮度数据（非 0-1 的 LDR）
```

**常用的 HDR 格式：**

| 格式         | 扩展名 | 特点                      |
| ------------ | ------ | ------------------------- |
| Radiance HDR | `.hdr` | 最通用，Three.js 原生支持 |
| OpenEXR      | `.exr` | 高精度，需要额外 loader   |
| RGBE         | `.pic` | 旧格式                    |

---

## 二、项目准备

### 2.1 依赖检查

本节使用 Day 1 搭建的 `practice-day1` 项目，确保已安装：

```bash
cd practice-day1
npm install three @tresjs/core @tresjs/cientos
npm install -D @types/three
```

### 2.2 纹理资源准备

在 `public/textures/` 目录下准备 PBR 贴图：

```
practice-day1/
├── public/
│   ├── textures/
│   │   ├── basecolor.png     ← 基础颜色贴图（sRGB）
│   │   ├── metallic.png      ← 金属度贴图（Linear）
│   │   ├── roughness.png     ← 粗糙度贴图（Linear）
│   │   ├── normal.png        ← 法线贴图（Linear）
│   │   ├── ao.png            ← 环境遮蔽贴图（Linear）
│   │   └── emissive.png      ← 自发光贴图（sRGB，可选）
│   ├── hdr/
│   │   └── studio.hdr        ← HDR 环境贴图
│   └── models/
├── src/
└── ...
```

> **免费 PBR 贴图资源：**
>
> - https://polyhaven.com/textures — 高质量免费 PBR 贴图（CC0 协议）
> - https://ambientcg.com — 大量免费 PBR 材质集（CC0 协议）
>
> **免费 HDR 资源：**
>
> - https://polyhaven.com/hdris — 高质量室内/室外 HDR（CC0 协议）

---

## 三、完整 PBR 材质球实现

### 3.1 核心代码

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import * as THREE from "three";
import { TresCanvas } from "@tresjs/core";
import { OrbitControls } from "@tresjs/cientos";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

// --- 纹理加载 ---
const textureLoader = new THREE.TextureLoader();

// 加载各通道贴图并设置正确的颜色空间
const baseColorTex = textureLoader.load("/textures/basecolor.png");
const metallicTex = textureLoader.load("/textures/metallic.png");
const roughnessTex = textureLoader.load("/textures/roughness.png");
const normalTex = textureLoader.load("/textures/normal.png");
const aoTex = textureLoader.load("/textures/ao.png");
const emissiveTex = textureLoader.load("/textures/emissive.png");

// ⚠️ 必须手动设置颜色空间！
baseColorTex.colorSpace = THREE.SRGBColorSpace; // 颜色贴图 → sRGB
metallicTex.colorSpace = THREE.LinearSRGBColorSpace; // 物理量贴图 → Linear
roughnessTex.colorSpace = THREE.LinearSRGBColorSpace;
normalTex.colorSpace = THREE.LinearSRGBColorSpace;
aoTex.colorSpace = THREE.LinearSRGBColorSpace;
emissiveTex.colorSpace = THREE.SRGBColorSpace; // 颜色贴图 → sRGB

// --- PBR 材质参数（响应式绑定到 UI）---
const metalness = ref(0.5);
const roughness = ref(0.5);
const emissiveInt = ref(0.0);
const aoIntensity = ref(1.0);
const normalScale = ref(1.0);
const envIntensity = ref(1.0);

// --- HDR 环境贴图加载 ---
const envMap = ref<THREE.Texture | null>(null);
const rgbeLoader = new RGBELoader();
rgbeLoader.load("/hdr/studio.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    envMap.value = texture;
});
</script>

<template>
    <TresCanvas clear-color="#1a1a2e" window-size>
        <TresPerspectiveCamera :position="[0, 0, 4]" />
        <OrbitControls />

        <!-- PBR 材质球 -->
        <TresMesh>
            <TresSphereGeometry :args="[1, 64, 64]" />
            <TresMeshStandardMaterial
                :map="baseColorTex"
                :metalnessMap="metallicTex"
                :metalness="metalness"
                :roughnessMap="roughnessTex"
                :roughness="roughness"
                :normalMap="normalTex"
                :normalScale="[normalScale, normalScale]"
                :aoMap="aoTex"
                :aoMapIntensity="aoIntensity"
                :emissiveMap="emissiveTex"
                emissive="#ffffff"
                :emissiveIntensity="emissiveInt"
                :envMap="envMap"
                :envMapIntensity="envIntensity"
            />
        </TresMesh>

        <!-- 光照 -->
        <TresAmbientLight :intensity="0.2" />
        <TresDirectionalLight :position="[5, 5, 5]" :intensity="1" />
        <TresPointLight
            :position="[-3, 2, -3]"
            color="#a78bfa"
            :intensity="0.6"
        />
    </TresCanvas>

    <!-- 参数调节面板 -->
    <div class="panel">
        <h3>PBR 参数调节</h3>
        <label
            >金属度 (metalness)
            <input
                type="range"
                v-model.number="metalness"
                min="0"
                max="1"
                step="0.01"
            />
            <span>{{ metalness.toFixed(2) }}</span>
        </label>
        <label
            >粗糙度 (roughness)
            <input
                type="range"
                v-model.number="roughness"
                min="0"
                max="1"
                step="0.01"
            />
            <span>{{ roughness.toFixed(2) }}</span>
        </label>
        <label
            >自发光强度 (emissiveIntensity)
            <input
                type="range"
                v-model.number="emissiveInt"
                min="0"
                max="3"
                step="0.05"
            />
            <span>{{ emissiveInt.toFixed(2) }}</span>
        </label>
        <label
            >AO 强度 (aoMapIntensity)
            <input
                type="range"
                v-model.number="aoIntensity"
                min="0"
                max="2"
                step="0.05"
            />
            <span>{{ aoIntensity.toFixed(2) }}</span>
        </label>
        <label
            >法线强度 (normalScale)
            <input
                type="range"
                v-model.number="normalScale"
                min="0"
                max="3"
                step="0.05"
            />
            <span>{{ normalScale.toFixed(2) }}</span>
        </label>
        <label
            >环境贴图强度 (envMapIntensity)
            <input
                type="range"
                v-model.number="envIntensity"
                min="0"
                max="3"
                step="0.05"
            />
            <span>{{ envIntensity.toFixed(2) }}</span>
        </label>
    </div>
</template>

<style>
html,
body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
.panel {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    color: white;
    padding: 16px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 260px;
    font-size: 13px;
}
.panel h3 {
    margin: 0 0 6px;
    font-size: 15px;
    color: #a5f3fc;
}
.panel label {
    display: flex;
    align-items: center;
    gap: 8px;
}
.panel input[type="range"] {
    flex: 1;
}
.panel span {
    width: 36px;
    text-align: right;
    color: #86efac;
}
</style>
```

### 3.2 关键概念逐一解释

#### 颜色空间（ColorSpace）为何如此重要

```
显示器输出的是 sRGB 颜色（伽马编码后的感知颜色）
物理计算（光照、混合）需要在线性空间进行

Three.js 渲染管线会在最终输出时自动做 Linear → sRGB 的转换
所以：
  BaseColor（你看到的颜色）→ 存为 sRGB，Three.js 内部解码为线性用于计算 ✅
  Metallic/Roughness（物理量）→ 必须是线性，若误设为 sRGB 会被错误解码 ❌
```

#### `aoMap` 的额外要求

AO 贴图需要第二套 UV（`uv2`），球体默认有 `uv`，需要复制一份：

```typescript
// 检查几何体是否有 uv2，没有则复制 uv
const geometry = meshRef.value?.geometry;
if (geometry && !geometry.attributes.uv1) {
    geometry.setAttribute("uv1", geometry.attributes.uv);
}
```

> TresJS 中 MeshStandardMaterial 的 aoMap 默认使用 `uv1`（原名 `uv2`，Three.js r152+ 后改名），注意版本差异。

#### `envMap` 加载流程

```
RGBELoader 加载 .hdr 文件
  └─ 返回 DataTexture（包含高动态范围亮度信息）
  └─ 设置 mapping = EquirectangularReflectionMapping
  └─ 赋给 material.envMap 或 scene.environment（全局）
```

---

## 四、HDR 环境贴图加载

### 4.1 设置全局环境贴图

直接赋给 `scene.environment` 可以让场景内所有 PBR 材质共享同一个环境贴图：

```typescript
// 方法一：通过 useThree 获取 scene 并设置全局 envMap
import { useThree } from "@tresjs/core";
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const { scene, renderer } = useThree();

const rgbeLoader = new RGBELoader();
rgbeLoader.load("/hdr/studio.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture; // 所有 PBR 材质共享此环境光
    scene.background = texture; // 可选：同时作为背景
});
```

```typescript
// 方法二：用 PMREMGenerator 预处理（推荐，质量更好）
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

rgbeLoader.load("/hdr/studio.hdr", (texture) => {
    const envTexture = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envTexture;
    texture.dispose(); // 原始 HDR 可以释放
    pmremGenerator.dispose();
});
```

**两种方式对比：**

| 方式           | 质量   | 性能         | 说明                           |
| -------------- | ------ | ------------ | ------------------------------ |
| 直接赋值       | 一般   | 快           | 简单场景够用                   |
| PMREMGenerator | **好** | 慢（一次性） | 生成预过滤环境贴图，高光更正确 |

### 4.2 TresJS 中使用 cientos 的 Environment 组件（备用方案）

```vue
<!-- cientos 提供了 Environment 组件，但依赖外部 CDN，中国大陆不可用 -->
<!-- 如网络可用，可简化为 -->
<Environment preset="studio" />

<!-- 不可用时，用多灯光组合替代 -->
<TresAmbientLight :intensity="0.5" />
<TresDirectionalLight :position="[5, 5, 5]" :intensity="1.5" color="#ffffff" />
<TresHemisphereLight
    :position="[0, 5, 0]"
    color="#b1e1ff"
    ground-color="#b97a20"
    :intensity="0.8"
/>
```

---

## 五、MeshStandardMaterial vs MeshPhysicalMaterial 对比实验

### 5.1 标准材质（Standard）完整参数

```typescript
const standardMat = new THREE.MeshStandardMaterial({
    map: baseColorTex,
    metalnessMap: metallicTex,
    metalness: 0.8,
    roughnessMap: roughnessTex,
    roughness: 0.2,
    normalMap: normalTex,
    normalScale: new THREE.Vector2(1, 1),
    aoMap: aoTex,
    aoMapIntensity: 1.0,
    emissiveMap: emissiveTex,
    emissive: new THREE.Color("#ffffff"),
    emissiveIntensity: 0,
    envMap: hdrEnvMap,
    envMapIntensity: 1.0,
    side: THREE.FrontSide,
});
```

### 5.2 物理材质（Physical）扩展示例

```typescript
// 玻璃效果（透射）
const glassMat = new THREE.MeshPhysicalMaterial({
    metalness: 0,
    roughness: 0,
    transmission: 1.0, // 透光率（0 不透，1 全透）
    thickness: 0.5, // 折射厚度
    ior: 1.5, // 折射率（玻璃约 1.45-1.6）
    envMapIntensity: 1.0,
});

// 汽车漆效果（清漆层）
const carPaintMat = new THREE.MeshPhysicalMaterial({
    color: "#c0392b",
    metalness: 0.3,
    roughness: 0.3,
    clearcoat: 1.0, // 清漆强度
    clearcoatRoughness: 0.1, // 清漆粗糙度
});

// 天鹅绒效果（光泽层）
const velvetMat = new THREE.MeshPhysicalMaterial({
    color: "#6d28d9",
    metalness: 0,
    roughness: 0.8,
    sheen: 1.0, // 光泽强度
    sheenRoughness: 0.5, // 光泽粗糙度
    sheenColor: new THREE.Color("#a78bfa"),
});
```

### 5.3 对比实验：在场景中并排展示

```vue
<script setup lang="ts">
import * as THREE from "three";

// 共用同一套贴图
const textureLoader = new THREE.TextureLoader();
const baseColorTex = textureLoader.load("/textures/basecolor.png");
baseColorTex.colorSpace = THREE.SRGBColorSpace;

const standardMat = new THREE.MeshStandardMaterial({
    map: baseColorTex,
    metalness: 0.8,
    roughness: 0.2,
});

const physicalMat = new THREE.MeshPhysicalMaterial({
    map: baseColorTex,
    metalness: 0.8,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
});
</script>

<template>
    <TresCanvas clear-color="#0f0f1a" window-size>
        <TresPerspectiveCamera :position="[0, 0, 5]" />
        <OrbitControls />

        <!-- 左边：标准材质 -->
        <TresMesh :position="[-1.5, 0, 0]">
            <TresSphereGeometry :args="[0.8, 64, 64]" />
            <primitive :object="standardMat" attach="material" />
        </TresMesh>

        <!-- 右边：物理材质（加清漆层） -->
        <TresMesh :position="[1.5, 0, 0]">
            <TresSphereGeometry :args="[0.8, 64, 64]" />
            <primitive :object="physicalMat" attach="material" />
        </TresMesh>

        <TresDirectionalLight :position="[5, 5, 5]" :intensity="1" />
        <TresAmbientLight :intensity="0.1" />
    </TresCanvas>
</template>
```

---

## 六、运行与验证

```bash
cd practice-day1
npm run dev
# 浏览器访问 http://localhost:5173
```

### 验证清单

- [ ] PBR 材质球正常渲染，贴图正确加载
- [ ] 调节金属度滑块：0 时非金属感，1 时如镜面金属
- [ ] 调节粗糙度滑块：0 时高光锐利集中，1 时高光扩散消失
- [ ] HDR 环境贴图生效，金属球能反射周围环境色
- [ ] AO 贴图生效，凹槽处有明显阴影加深
- [ ] 法线贴图生效，表面有凹凸起伏质感
- [ ] MeshStandardMaterial vs MeshPhysicalMaterial 的清漆效果差异可见

---

## 七、常见问题排查

| 问题                           | 原因                  | 解决方法                                                                       |
| ------------------------------ | --------------------- | ------------------------------------------------------------------------------ |
| 材质球全黑                     | 缺少光照或 envMap     | 添加 DirectionalLight，或加载 HDR envMap                                       |
| 金属感不对（偏灰）             | 缺少 envMap           | PBR 金属材质高度依赖环境贴图，必须添加                                         |
| 贴图颜色偏暗/偏亮              | 颜色空间设置错误      | BaseColor 用 `SRGBColorSpace`，其余用 `LinearSRGBColorSpace`                   |
| AO 不生效                      | 缺少 uv1 属性         | 复制 `uv` 属性到 `uv1`：`geometry.setAttribute('uv1', geometry.attributes.uv)` |
| HDR 加载失败                   | 文件路径或网络问题    | 确认文件在 `public/hdr/` 下，用绝对路径 `/hdr/xxx.hdr`                         |
| 透明材质（transmission）不显示 | 需要特殊渲染配置      | 设置 `renderer.physicallyCorrectLights = true`，材质加 `transparent: true`     |
| 法线凹凸方向反了               | 法线贴图坐标系不同    | 将 `normalScale` 的 Y 值取反：`normalScale: new Vector2(1, -1)`                |
| 环境贴图模糊失真               | 未使用 PMREMGenerator | 用 `PMREMGenerator.fromEquirectangular` 预处理 HDR                             |

---

## 八、扩展练习（可选）

1. **多材质对比展台**：并排放置 5 个球体，分别展示「全金属光滑」、「全金属粗糙」、「非金属光滑」、「非金属粗糙」、「半金属」五种典型 PBR 状态
2. **材质预设切换**：制作「黄金」「铬合金」「亚光橡胶」「磨砂玻璃」「布料」五种预设，点击按钮一键切换
3. **动态 HDR 切换**：加载多张 HDR，实现室内/室外/摄影棚环境切换，观察同一材质在不同光环境下的变化
4. **贴图通道可视化**：点击按钮单独显示某一贴图通道（如只显示 AO、只显示法线方向），便于理解各通道作用
5. **MeshPhysicalMaterial 特效**：依次实现玻璃球（transmission）、车漆球（clearcoat）、天鹅绒球（sheen）三种特殊材质效果

---

> **下一步**：Day 4 将学习 GLSL Shader 编程，用自定义顶点着色器和片元着色器实现原生 PBR 无法做到的特效，如波浪形变、菲涅尔边缘光和扫描线效果。
