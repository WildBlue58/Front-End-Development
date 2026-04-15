# Day 1：Three.js 核心概念 + Vite 项目搭建

> 目标：从零搭建一个可运行的 Vue3 + TresJS 3D 场景，理解 Three.js 渲染管线核心概念。

---

## 一、理论目标

### 1.1 Three.js 渲染管线

Three.js 的渲染流程遵循经典 3D 图形管线：

```
Scene (场景)
  └─ 包含所有 3D 对象（Mesh、Light、Camera 等）

Camera (相机)
  └─ PerspectiveCamera (透视) / OrthographicCamera (正交)
  └─ 决定观察角度和视野范围

Renderer (渲染器)
  └─ WebGLRenderer → 调用底层 WebGL API 将场景绘制到 Canvas
  └─ 流程：顶点处理 → 光栅化 → 片段着色 → 输出到屏幕

Mesh (网格物体) = Geometry (几何体/形状) + Material (材质/外观)
```

**核心概念速查：**

| 概念 | 说明 | 类比 |
|------|------|------|
| Scene | 所有物体的容器 | 舞台 |
| Camera | 观察者的眼睛 | 摄影机 |
| Renderer | 把画面画出来的引擎 | 灯光+胶卷 |
| Geometry | 物体的形状（顶点、面） | 骨架 |
| Material | 物体的表面属性（颜色、纹理、光照反应） | 皮肤 |
| Mesh = Geo + Mat | 完整的 3D 物体 | 演员 |

### 1.2 TresJS 是什么

[TresJS](https://tresjs.org/) 是一个 **Vue3 声明式 Three.js 封装库**，核心理念：

- **声明式写法**：用 Vue 组件代替命令式 JS 代码
- **响应式绑定**：Vue 的 `ref` / `reactive` 自动驱动 3D 更新
- **组件化复用**：3D 对象可以像普通组件一样组合使用

```bash
# 原生 Three.js（命令式）
const scene = new THREE.Scene()
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshStandardMaterial({ color: '#42b883' })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

# TresJS（声明式）
<TresMesh>
  <TresBoxGeometry :args="[1, 1, 1]" />
  <TresMeshStandardMaterial color="#42b883" />
</TresMesh>
```

---

## 二、项目初始化

### 2.1 创建 Vite 项目

```bash
# 使用 Vue + TypeScript 模板创建项目
npm create vite@latest practice-day1 -- --template vue-ts

# 进入项目目录
cd practice-day1

# 安装依赖
npm install

# 安装 Three.js 和 TresJS
npm install three @tresjs/core

# 安装类型定义（开发依赖）
npm install -D @types/three
```

### 2.2 项目结构说明

```
practice-day1/
├── index.html              # 入口 HTML，挂载 #app 节点
├── package.json            # 依赖管理
├── tsconfig.json           # TypeScript 配置
├── vite.config.ts          # Vite 构建配置
├── src/
│   ├── main.ts             # 应用入口：createApp + mount
│   ├── App.vue             # 根组件（我们的 3D 场景放这里）
│   ├── style.css           # 全局样式
│   ├── env.d.ts            # 类型声明（*.vue 文件支持）
│   └── vite-env.d.ts       # Vite 客户端类型
```

---

## 三、编写基础 3D 场景

### 3.1 App.vue 完整代码

将 `src/App.vue` 替换为以下内容：

```vue
<script setup lang="ts">
/**
 * Day 1 基础 3D 场景
 * 包含：透视相机、立方体几何体、标准材质、方向光、环境光
 * TresCanvas 会自动创建 Scene 和 WebGLRenderer
 */
import { TresCanvas } from '@tresjs/core'
</script>

<template>
  <!--
    TresCanvas: TresJS 的根容器，相当于 Scene + Renderer 的封装
    - clear-color: 背景色（深色主题）
    - window-size: 自动填满整个窗口大小
  -->
  <TresCanvas clear-color="#1a1a2e" window-size>
    <!--
      透视相机：模拟人眼视角，近大远小
      position: [x, y, z] 相机位置
    -->
    <TresPerspectiveCamera :position="[0, 2, 5]" />

    <!--
      网格物体：一个绿色方块
      position: 方块在世界坐标中的位置
    -->
    <TresMesh :position="[0, 0, 0]">
      <!-- 几何体：长宽高各为 1 的盒子 -->
      <TresBoxGeometry :args="[1, 1, 1]" />
      <!-- 材质：标准 PBR 材质（对光照有真实反应）-->
      <TresMeshStandardMaterial color="#42b883" />
    </TresMesh>

    <!--
      方向光：模拟太阳光，平行光线
      position: 光源位置
      intensity: 光照强度（默认 1）
    -->
    <TresDirectionalLight :position="[3, 3, 3]" :intensity="1" />

    <!--
      环境光：均匀照亮所有物体（无阴影方向）
      intensity: 通常设较低值作为补光
    -->
    <TresAmbientLight :intensity="0.5" />
  </TresCanvas>
</template>

<style>
/* 重置默认样式，让 Canvas 填满屏幕 */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; /* 防止出现滚动条 */
}
</style>
```

### 3.2 关键概念逐行解释

#### `<TresCanvas>`
- 这是 TresJS 的**根节点**，内部会自动创建：
  - `THREE.Scene` — 场景容器
  - `THREE.WebGLRenderer` — WebGL 渲染器
  - 渲染循环 (`requestAnimationFrame`)
- 常用 props：
  | 属性 | 默认值 | 说明 |
  |------|--------|------|
  | `clear-color` | `#ffffff` | 背景清除颜色 |
  | `window-size` | `false` | 是否自适应窗口大小 |
  | `shadows` | `false` | 是否启用阴影映射 |

#### `<TresPerspectiveCamera>`
- 透射相机，产生**近大远小**的效果（符合人眼视觉）
- `fov`（视场角）：默认 75°，越大看到越广但变形越明显
- `near` / `far`：裁剪平面范围

#### `<TresBoxGeometry>` + `<TresMeshStandardMaterial>`
- `Geometry` 定义形状（顶点 + 面），`Material` 定义外观
- `MeshStandardMaterial` 是基于物理的材质，能正确反射光线

#### 光照系统
- 至少需要 **一种光源**，否则 MeshStandardMaterial 会显示全黑
- `DirectionalLight` 提供主光源和阴影
- `AmbientLight` 作为填充光消除死黑区域

---

## 四、添加鼠标交互（OrbitControls）

TresJS 内置了 OrbitControls 支持，让用户可以用鼠标旋转/缩放/平移场景：

```vue
<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
</script>

<template>
  <TresCanvas clear-color="#1a1a2e" window-size shadows>
    <TresPerspectiveCamera :position="[0, 2, 5]" />
    <OrbitControls />  <!-- 新增：鼠标控制 -->

    <TresMesh :position="[0, 0, 0]">
      <TresBoxGeometry :args="[1, 1, 1]" />
      <TresMeshStandardMaterial color="#42b883" />
    </TresMesh>

    <TresDirectionalLight :position="[3, 3, 3]" :intensity="1" cast-shadow />
    <TresAmbientLight :intensity="0.5" />
  </TresCanvas>
</template>
```

安装额外包：
```bash
npm install @tresjs/cientos
```

**OrbitControls 操作方式：**
| 操作 | 功能 |
|------|------|
| 左键拖拽 | 旋转视角 |
| 右键拖拽 | 平移视角 |
| 滚轮 | 缩放远近 |

---

## 五、运行与验证

```bash
# 启动开发服务器
npm run dev

# 浏览器访问 http://localhost:5173
# 应该能看到：深蓝色背景中有一个绿色的立方体，可用鼠标旋转查看
```

### 验证清单

- [ ] 终端无报错（特别是 TypeScript 错误）
- [ ] 页面显示一个绿色立方体
- [ ] 鼠标左键拖拽可以旋转视角
- [ ] 滚轮可以缩放
- [ ] 右键拖拽可以平移
- [ ] 立方体有明显的明暗面（证明光照生效）

---

## 六、常见问题排查

| 问题 | 原因 | 解决方法 |
|------|------|---------|
| 页面空白/黑色 | 缺少光照或材质不对 | 添加 DirectionalLight 或改用 MeshBasicMaterial |
| 立方体全黑 | MeshStandardMaterial 无光 | 检查是否有 Light 组件 |
| 鼠标无法操作 | 未添加 OrbitControls | 安装 `@tresjs/cientos` 并添加组件 |
| TypeScript 报错找不到模块 | 缺少类型声明 | 运行 `npm install -D @types/three` |
| 样式溢出有滚动条 | body/html 未重置 | 在 CSS 中设置 margin/padding: 0, overflow: hidden |

---

## 七、扩展练习（可选）

完成基础任务后，可以尝试以下进阶操作来加深理解：

1. **更换几何体**：把 BoxGeometry 换成 `TresSphereGeometry`（球）、`TresConeGeometry`（圆锥）、`TresTorusGeometry`（甜甜圈）
2. **多个物体**：在场景中添加 3 个不同位置、颜色的物体
3. **动画效果**：使用 `useRenderLoop` 让物体自转
4. **切换材质**：对比 `MeshBasicMaterial`（不受光照影响）与 `MeshStandardMaterial`
5. **调整相机参数**：修改 fov、near、far 观察变化

---

> **下一步**：Day 2 将学习如何加载外部 glTF 模型以及集成 Sketchfab Viewer API。
