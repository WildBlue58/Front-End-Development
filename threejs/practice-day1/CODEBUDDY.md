# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm install` | 按 `README.md` 的默认方式安装依赖。仓库里同时存在 `pnpm-lock.yaml` 和 `package-lock.json`，但现有说明文档以 `pnpm` 为主。 |
| `pnpm dev` | 启动 Vite 开发服务器，默认访问 `http://localhost:5173/#/practice1`。该项目使用 Hash 路由，浏览器自动化或手动访问时应优先使用 `/#/practice2`、`/#/practice3` 这类 URL。 |
| `pnpm build` | 执行 `vue-tsc -b && vite build`。这是当前最接近“完整校验”的命令，既会做 TypeScript/Vue 类型检查，也会验证生产构建是否通过。 |
| `pnpm preview` | 预览构建产物，适合在完成较大改动后检查路由、静态资源和打包结果。 |
| `pnpm exec vue-tsc --noEmit` | 单独运行静态类型检查。仓库当前没有独立的 lint script，这个命令是修改 Vue/Tres 组件后最实用的快速校验手段。 |
| `测试：当前未配置` | `package.json` 中没有 `test` script，也没有单文件测试命令。若未来新增测试框架，应优先把运行全部测试和运行单个测试的命令补充到这里。 |

## 架构总览

这是一个基于 **Vue 3 + Vue Router + TresJS + Three.js** 的 3D 学习项目。根入口是 `src/main.ts`：它负责挂载 `App.vue`、注册 `vue-router`、接入 `tdesign-vue-next`，并把所有 TDesign 图标做了全局注册。真正的页面切换发生在 `src/App.vue`，这里提供顶栏导航并通过 `<router-view />` 渲染三个练习页。

### 路由与页面组织

`src/router/index.ts` 使用 **Hash 模式**。当前有效页面有三个：
- `/#/practice1`：基础几何体、材质和相机控制。
- `/#/practice2`：GLB 模型加载、动画控制、拖拽替换模型，以及 Sketchfab 在线查看。
- `/#/practice3`：PBR 材质对比、贴图通道开关和 HDR 环境切换。

页面层保持很薄：`Practice1Page.vue`、`Practice2Page.vue`、`Practice3Page.vue` 的职责基本都是组装“场景组件 + 控制面板组件”，让 UI 和 3D 画布分离。后续改动时，优先在各自的 `components/practiceX/` 和 `composables/useXState.ts` 中改，不要把逻辑堆回页面壳。

### 状态管理模式

这个项目没有用 Pinia；它依赖 **module-scope `ref` + composable 单例** 来共享状态。`useSceneState.ts`、`useModelState.ts`、`usePBRState.ts` 都把核心 `ref` 定义在函数外部，因此同一练习页内的场景组件和控制面板拿到的是同一份响应式状态。

这意味着：
- 控制面板是“写状态”的地方。
- 场景组件是“读状态并渲染”的地方。
- 改功能时，通常先确认对应 `use...State` 是否已经暴露需要的状态和操作方法，再修改场景或面板。

### Day 1：基础几何体练习

Day 1 的核心链路是：`Practice1Page.vue` → `SceneCanvas.vue` + `ControlPanel.vue` → `ShapeMesh.vue` + `useSceneState.ts`。

`SceneCanvas.vue` 只负责搭建 `TresCanvas`、相机、灯光、`OrbitControls`，再根据共享状态决定渲染单个物体还是多个物体。这里有一个重要约束：**动画循环不放在 `SceneCanvas.vue` 本身，而放在 `ShapeMesh.vue`**。原因已经写在组件注释里：像 `useLoop()` 这种依赖 Tres 上下文的能力，必须在 `TresCanvas` 的后代组件中调用；如果把循环逻辑写在定义 `TresCanvas` 的同层组件里，会拿不到上下文。

因此，凡是需要逐帧更新的 3D 行为，优先放到真正挂在 `TresCanvas` 内部的子组件里，而不是页面壳或控制面板里。

### Day 2：模型加载与双视图模式

Day 2 分成两条互相独立的展示链路：

1. **本地 GLB 模型链路**：
   `Practice2Page.vue` 在 `local` 视图下渲染 `ModelScene.vue` 和 `ModelControlPanel.vue`。`ModelScene.vue` 负责 Tres 画布、相机、灯光、拖拽上传、加载遮罩和自定义模型入口；`ModelViewer.vue` 负责真正加载模型、建立 `AnimationMixer`、维护动画播放状态、统计顶点/面数/材质数，并消费 `useModelState.ts` 中的共享状态。

2. **Sketchfab 在线链路**：
   同一个页面在 `sketchfab` 视图下渲染 `SketchfabViewer.vue`。这个组件不是 Tres 场景，而是动态创建 `iframe` 并接入 Sketchfab Viewer API，对外暴露 `pauseAnimation` / `resumeAnimation`。如果在线视图异常，先检查外部脚本是否可访问，再看组件本身。

`useModelState.ts` 是 Day 2 的中枢：它管理模型列表、相机预设、动画状态、加载进度、模型统计、截图请求以及拖拽上传生成的 blob URL。这里还有一个很实用的约定：**拖拽导入的模型会在状态层中做 URL 释放和回滚清理**，所以如果调整自定义模型功能，别绕开这个 composable 直接在组件里硬管资源。

另外，`ModelScene.vue` 给 `TresCanvas` 开启了 `preserveDrawingBuffer`，这是截图功能能工作的前提；如果未来优化性能或改 renderer 选项，注意不要误删。

### Day 3：PBR 材质实验场

Day 3 的链路是：`Practice3Page.vue` → `PBRScene.vue` + `PBRControlPanel.vue` → `PBRSpheres.vue` + `usePBRState.ts`。

`usePBRState.ts` 定义了 PBR 面板的全部共享状态：基础颜色、金属度、粗糙度、自发光、Physical 专属参数、贴图开关、HDR 开关、HDR 预设、通道可视化，以及“对比模式 / 展台模式”。控制面板几乎只是在修改这些状态；真正的渲染逻辑都在 `PBRSpheres.vue`。

`PBRScene.vue` 负责相机、灯光、画布和标签层；`PBRSpheres.vue` 才是 Day 3 的核心：
- 加载 `public/textures/` 下的 basecolor / roughness / normal / ao 贴图。
- 用 `useTresContext()` 拿到 Tres 场景与渲染器上下文。
- 从 `public/hdr/` 加载 HDR，并把结果同步到 `scene.environment` 和 `scene.background`。
- 通过 `hdrCache` 和 `hdrPending` 避免重复 PMREM 处理与重复请求。
- 在“对比模式”下渲染 Standard / Physical 双球，在“展台模式”下渲染五个典型材质球。

如果 Day 3 出现“页面空白”或 “Tres 组件都不生效”的问题，**先看 `vite.config.ts`**。这个项目必须保留：
`@tresjs/core/template-compiler-options`
否则 Vite 会把 `TresPerspectiveCamera`、`TresMesh`、`TresDirectionalLight` 等标签当成未知组件，整个 Tres 场景都会失效。

### 静态资源与文档

`public/` 是 3D 资源根目录，代码里全部通过根路径访问，例如：
- `/models/...`：Day 2 的 GLB 模型。
- `/textures/...`：Day 3 的 PBR 贴图。
- `/hdr/...`：Day 3 的 HDR 环境贴图。

修改资源引用时，优先保持这种“以 `public/` 为根的绝对路径”写法，不要切回相对导入。

`src/docs/` 下有每个练习日的学习文档，适合理解设计意图。注意：当前 `README.md` 仍以 Day 1 / Day 2 为主，但路由和代码已经包含 Day 3，后续做项目级说明时应以代码实际状态为准。

## 项目约定

- 注释、说明文档和用户可见文案优先使用**简体中文**。
- 3D UI 交互通常拆成“控制面板改状态、场景组件响应状态”，新增功能时沿用这个模式。
- 修改 Tres 相关模板时，不要移除 `vite.config.ts` 里的 `templateCompilerOptions`。
- 自动化访问页面时，优先使用 Hash 路由完整地址，例如 `http://localhost:5173/#/practice3`。