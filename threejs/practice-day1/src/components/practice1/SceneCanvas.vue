<!-- ============================================================
     SceneCanvas.vue — 3D 场景画布组件
     
     职责：渲染完整的 3D 场景
     → 包含相机、灯光、控制器
     → 包含单物体/多物体模式的切换渲染
     → ⚠️ 不再处理动画逻辑（动画已移至 ShapeMesh）
     
     这个组件只负责"画面展示"，不包含任何 UI 控件
     控制逻辑由 ControlPanel 组件负责
     状态通过 useSceneState composable 共享
============================================================ -->

<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import ShapeMesh from './ShapeMesh.vue'
import { useSceneState } from '../../composables/useSceneState'

/**
 * 从 composable 获取共享状态
 * → 多个组件通过同一个 composable 读取同一份响应式数据
 * → 控制面板修改 → 这里自动响应更新
 */
const {
  currentGeometry,
  showMultiple,
  isAnimating,
  materialType,
  cameraFov,
  currentColor,
  multiObjects,
} = useSceneState()

/**
 * ⚠️ 注意：动画逻辑已移至 ShapeMesh.vue
 * 
 * 原因：useLoop() 必须在 TresCanvas 的子组件中使用
 * SceneCanvas 本身定义了 TresCanvas，在 setup 阶段调用 useLoop 时
 * TresCanvas 还未渲染，上下文不存在，所以无法工作。
 * 
 * ShapeMesh 是 TresCanvas 的子组件，可以在其中正常使用 useLoop。
 * 通过 isAnimating prop 控制是否执行动画。
 */
</script>

<template>
  <!--
    TresCanvas: 3D 场景根容器
    → 自动创建 Scene + WebGLRenderer
    → clear-color: 深蓝灰背景色
    → window-size: 自适应窗口大小
  -->
  <TresCanvas clear-color="#1a1a2e" window-size>

    <!--
      透视相机
      → :fov 绑定共享状态，拖动滑块可实时改变视角
    -->
    <TresPerspectiveCamera
      :position="[0, 1.5, 5]"
      :fov="cameraFov"
    />

    <!-- 鼠标轨道控制器 -->
    <OrbitControls />

    <!-- ======================================================
         多物体模式 vs 单物体模式
         
         v-if / v-else 互斥渲染
         → showMultiple 为 true 显示3个物体
         → showMultiple 为 false 显示1个物体
         
         ⚠️ isAnimating 通过 prop 传递给 ShapeMesh
    ====================================================== -->

    <!-- 多物体模式：遍历 multiObjects 数组渲染3个物体 -->
    <template v-if="showMultiple">
      <ShapeMesh
        v-for="(obj, index) in multiObjects"
        :key="index"
        :geometry="currentGeometry"
        :material="materialType"
        :color="obj.color"
        :position="obj.position"
        :is-animating="isAnimating"
      />
    </template>

    <!-- 单物体模式：只渲染1个居中的物体 -->
    <ShapeMesh
      v-else
      :geometry="currentGeometry"
      :material="materialType"
      :color="currentColor"
      :position="[0, 0, 0]"
      :is-animating="isAnimating"
    />

    <!-- 方向光（主光源）：模拟太阳光 -->
    <TresDirectionalLight :position="[3, 3, 3]" :intensity="1.5" />

    <!-- 环境光（补光）：均匀照亮所有物体，消除死黑 -->
    <TresAmbientLight :intensity="0.4" />

  </TresCanvas>
</template>
