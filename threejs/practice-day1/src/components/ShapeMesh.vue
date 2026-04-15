<!-- ============================================================
     ShapeMesh.vue — 可切换几何体的 3D 网格组件
     
     职责：根据 props 渲染一个 3D 物体
     → 支持4种几何体切换（盒子/球/圆锥/甜甜圈）
     → 支持2种材质切换（Standard/Basic）
     → 支持自转动画（使用 useLoop）
     
     Props（输入）：
     - geometry: 几何体类型 ('box' | 'sphere' | 'cone' | 'torus')
     - material: 材质类型 ('standard' | 'basic')
     - color: 物体颜色
     - position: 物体位置 [x, y, z]
     - isAnimating: 是否开启自转动画
============================================================ -->

<script setup lang="ts">
import { ref } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Mesh } from 'three'

/**
 * defineProps: Vue3 声明组件接收的属性
 * 
 * 为什么用 Props？
 * → 父组件传递数据给子组件的方式
 * → 子组件不能修改 props，只能读取
 * → 单向数据流：父 → 子
 * 
 * withDefaults: 给 props 设置默认值
 * → 不传某个 prop 时使用默认值
 */
const props = withDefaults(defineProps<{
  /** 几何体类型 */
  geometry?: string
  /** 材质类型：standard=受光照, basic=纯色 */
  material?: string
  /** 物体颜色（十六进制） */
  color?: string
  /** 物体在3D空间中的位置 */
  position?: [number, number, number]
  /** 是否开启自转动画 */
  isAnimating?: boolean
}>(), {
  geometry: 'box',
  material: 'standard',
  color: '#42b883',
  position: () => [0, 0, 0],
  isAnimating: false,
})

/**
 * ============================================================
 * 动画逻辑 - 使用 useLoop 实现自转动画
 * ============================================================
 * 
 * ⚠️ 重要：useLoop 必须在 TresCanvas 的子组件中使用！
 * 
 * ShapeMesh 是 TresCanvas 的子组件，所以这里可以正常使用 useLoop。
 * 父组件 SceneCanvas 本身定义了 TresCanvas，不能在其中使用 useLoop。
 * 
 * 工作原理：
 * 1. useLoop() 返回 { onBeforeRender, onAfterRender } 方法
 * 2. onBeforeRender 在每帧渲染前执行回调
 * 3. 回调参数 { delta, elapsed } 包含时间信息
 *    - delta: 上一帧到当前帧的时间间隔（秒）
 *    - elapsed: 动画开始以来的总时间（秒）
 * 4. 在回调中更新 mesh 的 rotation.y 实现旋转
 * 
 * 为什么用 delta 而不是固定值？
 * → 不同设备的帧率不同（30fps vs 60fps vs 144fps）
 * → 使用 delta 确保旋转速度在所有设备上一致
 * → 帧率无关动画：旋转速度 = 角速度 × delta
 */
const meshRef = ref<Mesh | null>(null)

// 获取渲染循环上下文
const { onBeforeRender } = useLoop()

// 注册每帧执行的回调
onBeforeRender(({ delta }) => {
  // 只有同时满足以下条件才执行动画：
  // 1. isAnimating prop 为 true（用户开启了动画）
  // 2. meshRef.value 存在（组件已挂载）
  if (props.isAnimating && meshRef.value) {
    // 每帧旋转 1 弧度/秒
    // delta ≈ 0.016秒（60fps），所以每帧旋转约 0.016 弧度
    meshRef.value.rotation.y += delta
  }
})
</script>

<template>
  <!--
    TresMesh: 3D 物体容器
    
    ref="meshRef" → 获取 Mesh 实例引用（用于动画）
    :position → 位置绑定
    rotation 初始为 0（动画在 onBeforeRender 中更新）
  -->
  <TresMesh ref="meshRef" :position="position">

    <!--
      几何体切换：根据 geometry prop 渲染不同形状
      
      v-if / v-else-if / v-else 条件渲染
      → 哪个条件满足就渲染哪个几何体
      → 同一时刻只会渲染一个
    -->

    <!-- 盒子：宽1 高1 深1 的正方体 -->
    <TresBoxGeometry
      v-if="geometry === 'box'"
      :args="[1, 1, 1]"
    />

    <!-- 球体：半径0.6, 水平32段, 垂直32段 -->
    <TresSphereGeometry
      v-else-if="geometry === 'sphere'"
      :args="[0.6, 32, 32]"
    />

    <!-- 圆锥：底部半径0.5, 高1, 圆面32段 -->
    <TresConeGeometry
      v-else-if="geometry === 'cone'"
      :args="[0.5, 1, 32]"
    />

    <!-- 甜甜圈：环半径0.4, 管半径0.15 -->
    <TresTorusGeometry
      v-else
      :args="[0.4, 0.15, 16, 32]"
    />

    <!--
      材质切换：根据 material prop 渲染不同材质
      
      MeshStandardMaterial: 基于物理的材质，受光照影响
      MeshBasicMaterial: 纯色材质，不受光照影响
    -->
    <TresMeshStandardMaterial
      v-if="material === 'standard'"
      :color="color"
    />
    <TresMeshBasicMaterial
      v-else
      :color="color"
    />

  </TresMesh>
</template>
