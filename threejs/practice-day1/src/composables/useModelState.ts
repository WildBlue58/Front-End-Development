/**
 * useModelState — Practice2 模型场景共享状态
 *
 * 管理模型选择、动画控制、相机视角等响应式状态
 * 供 ModelScene 和 ModelControlPanel 共享
 */

import { ref, computed } from 'vue'

// ============================================================
//  模型配置
// ============================================================

export interface ModelConfig {
  /** 模型名称 */
  name: string
  /** GLB 文件路径（public 目录下的绝对路径） */
  path: string
  /** 模型缩放（不同模型尺寸差异大，需要独立调整） */
  scale: [number, number, number]
  /** 模型位置偏移 */
  position: [number, number, number]
  /** 推荐相机位置 */
  cameraPosition: [number, number, number]
  /** 推荐相机目标点 */
  cameraTarget: [number, number, number]
  /** 模型描述 */
  description: string
}

/** 可用模型列表 */
const modelList: ModelConfig[] = [
  {
    name: '保时捷 911',
    path: '/models/2014_porsche_911_turbo_991.glb',
    scale: [0.01, 0.01, 0.01],
    position: [0, 0, 0],
    cameraPosition: [5, 3, 5],
    cameraTarget: [0, 0.5, 0],
    description: '2014款保时捷911 Turbo',
  },
  {
    name: '初音未来',
    path: '/models/hatsune_miku_lbx_ver_yuki_custom__redesign.glb',
    scale: [1, 1, 1],
    position: [0, 0, 0],
    cameraPosition: [0, 2, 5],
    cameraTarget: [0, 1, 0],
    description: '初音未来 LBX 改版',
  },
]

// ============================================================
//  相机视角预设
// ============================================================

export interface CameraPreset {
  name: string
  position: [number, number, number]
  target: [number, number, number]
}

const cameraPresets: CameraPreset[] = [
  { name: '正面', position: [0, 1.5, 5], target: [0, 1, 0] },
  { name: '侧面', position: [5, 1.5, 0], target: [0, 1, 0] },
  { name: '顶部', position: [0, 6, 0.1], target: [0, 0, 0] },
  { name: '45度', position: [3.5, 3.5, 3.5], target: [0, 0.5, 0] },
]

// ============================================================
//  共享状态（单例模式）
// ============================================================

/** 当前选中的模型索引 */
const currentModelIndex = ref(0)

/** 动画播放速度 */
const animationSpeed = ref(1)

/** 当前播放的动画名称 */
const currentAnimationName = ref('')

/** 是否暂停动画 */
const isPaused = ref(false)

/** 模型加载进度（0~100） */
const loadingProgress = ref(0)

/** 模型是否加载完成 */
const isModelLoaded = ref(false)

/** 当前激活的相机视角预设索引，-1 表示自定义 */
const activePresetIndex = ref(0)

// ============================================================
//  Composable 函数
// ============================================================

export function useModelState() {
  /** 当前模型配置（计算属性） */
  const currentModel = computed(() => modelList[currentModelIndex.value])

  /** 当前相机视角预设（计算属性） */
  const currentPreset = computed(() => cameraPresets[activePresetIndex.value])

  /** 切换模型 */
  function switchModel(index: number) {
    if (index >= 0 && index < modelList.length) {
      currentModelIndex.value = index
      isModelLoaded.value = false
      loadingProgress.value = 0
      currentAnimationName.value = ''
      isPaused.value = false
      activePresetIndex.value = 0
    }
  }

  /** 切换到下一个模型 */
  function nextModel() {
    switchModel((currentModelIndex.value + 1) % modelList.length)
  }

  /** 设置动画速度 */
  function setAnimationSpeed(speed: number) {
    animationSpeed.value = Math.max(0.1, Math.min(3, speed))
  }

  /** 切换暂停状态 */
  function togglePause() {
    isPaused.value = !isPaused.value
  }

  /** 设置当前动画名称 */
  function setCurrentAnimation(name: string) {
    currentAnimationName.value = name
    isPaused.value = false
  }

  /** 设置加载进度 */
  function setLoadingProgress(progress: number) {
    loadingProgress.value = progress
  }

  /** 标记模型加载完成 */
  function setModelLoaded(loaded: boolean) {
    isModelLoaded.value = loaded
    if (loaded) loadingProgress.value = 100
  }

  /** 切换相机视角预设 */
  function switchCameraPreset(index: number) {
    if (index >= 0 && index < cameraPresets.length) {
      activePresetIndex.value = index
    }
  }

  return {
    // ---- 状态 ----
    currentModelIndex,
    animationSpeed,
    currentAnimationName,
    isPaused,
    loadingProgress,
    isModelLoaded,
    activePresetIndex,

    // ---- 计算属性 ----
    currentModel,
    currentPreset,

    // ---- 常量 ----
    modelList,
    cameraPresets,

    // ---- 方法 ----
    switchModel,
    nextModel,
    setAnimationSpeed,
    togglePause,
    setCurrentAnimation,
    setLoadingProgress,
    setModelLoaded,
    switchCameraPreset,
  }
}
