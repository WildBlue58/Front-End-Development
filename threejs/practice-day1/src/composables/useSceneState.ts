/**
 * useSceneState — 场景共享状态管理
 *
 * 这是一个 Vue3 Composable（组合式函数）
 * 作用：把所有 3D 场景的响应式状态集中管理
 *
 * 为什么用 Composable 而不是直接写在组件里？
 * → 多个组件需要访问同一组状态（比如控制面板修改状态，3D场景读取状态）
 * → Composable 让状态可以在组件间共享，避免 prop 层层传递
 * → 类似 React 的 Context / Zustand，但用 Vue 的响应式实现
 *
 * 使用方式：
 *   import { useSceneState } from '../composables/useSceneState'
 *   const { currentGeometry, isAnimating } = useSceneState()
 */

import { ref, computed } from 'vue'

// ============================================================
//  共享状态（单例模式）
//
//  为什么这些变量写在函数外面？
//  → 函数外面的变量在模块加载时只创建一次
//  → 所有组件调用 useSceneState() 拿到的是同一份 ref
//  → 这样就实现了跨组件的状态共享
// ============================================================

/**
 * 当前选中的几何体类型
 * 可选值：'box' | 'sphere' | 'cone' | 'torus'
 */
const currentGeometry = ref('box')

/**
 * 是否显示多个物体
 * false = 单物体模式，true = 3个物体模式
 */
const showMultiple = ref(false)

/**
 * 是否开启自转动画
 */
const isAnimating = ref(false)

/**
 * 物体 Y 轴旋转角度（弧度）
 * 由渲染循环每帧更新
 */
const rotationY = ref(0)

/**
 * 当前材质类型
 * 'standard' = 受光照影响的真实材质
 * 'basic'    = 纯色材质，不受光照
 */
const materialType = ref('standard')

/**
 * 相机视场角（FOV）
 * 范围 20~120，默认 75
 */
const cameraFov = ref(75)

/**
 * 当前物体颜色（单物体模式用）
 */
const currentColor = ref('#42b883')

// ============================================================
//  只读常量（不需要响应式）
// ============================================================

/**
 * 几何体选项列表
 * 供控制面板的按钮组使用
 */
const geometryOptions = [
  { name: '盒子', type: 'box' },
  { name: '球体', type: 'sphere' },
  { name: '圆锥', type: 'cone' },
  { name: '甜甜圈', type: 'torus' },
] as const

/**
 * 多物体模式的配置数据
 * 每个物体有位置和颜色
 */
const multiObjects = [
  { position: [-2, 0, 0] as [number, number, number], color: '#42b883' },
  { position: [0, 0, 0] as [number, number, number], color: '#6366f1' },
  { position: [2, 0, 0] as [number, number, number], color: '#f43f5e' },
]

// ============================================================
//  Composable 函数
// ============================================================

/**
 * useSceneState: 获取场景共享状态
 *
 * 返回所有状态和操作方法
 * 组件解构后即可直接使用
 */
export function useSceneState() {
  /**
   * 材质类型的中文描述（计算属性）
   * → 依赖 materialType 自动更新
   */
  const materialLabel = computed(() => {
    return materialType.value === 'standard'
      ? 'Standard（受光照）'
      : 'Basic（纯色，不受光）'
  })

  /**
   * 当前几何体的中文名称（计算属性）
   */
  const geometryLabel = computed(() => {
    return geometryOptions.find(o => o.type === currentGeometry.value)?.name ?? '未知'
  })

  return {
    // ---- 响应式状态 ----
    currentGeometry,
    showMultiple,
    isAnimating,
    rotationY,
    materialType,
    cameraFov,
    currentColor,

    // ---- 计算属性 ----
    materialLabel,
    geometryLabel,

    // ---- 常量 ----
    geometryOptions,
    multiObjects,
  }
}
