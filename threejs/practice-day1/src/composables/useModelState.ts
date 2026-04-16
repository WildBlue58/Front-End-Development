/**
 * useModelState — Practice2 模型场景共享状态
 *
 * 管理模型选择、动画控制、相机视角等响应式状态
 * 供 ModelScene 和 ModelControlPanel 共享
 */

import { ref, computed } from "vue";

// ============================================================
//  模型统计数据
// ============================================================

export interface ModelStats {
    /** 顶点总数 */
    vertices: number;
    /** 三角面总数 */
    faces: number;
    /** 材质数 */
    materials: number;
    /** 动画数 */
    animations: number;
}

// ============================================================
//  模型配置
// ============================================================

export interface ModelConfig {
    /** 模型名称 */
    name: string;
    /** GLB 文件路径（public 目录下的绝对路径） */
    path: string;
    /** 模型缩放（不同模型尺寸差异大，需要独立调整） */
    scale: [number, number, number];
    /** 模型位置偏移 */
    position: [number, number, number];
    /** 推荐相机位置 */
    cameraPosition: [number, number, number];
    /** 推荐相机目标点 */
    cameraTarget: [number, number, number];
    /** 模型描述 */
    description: string;
}

/** 可用模型列表 */
const modelList: ModelConfig[] = [
    {
        name: "保时捷 911",
        path: "/models/2014_porsche_911_turbo_991.glb",
        // GLB 内部模型极小（约 0.05 单位长），需要放大 100 倍使车身约 5 单位长
        scale: [100, 100, 100],
        position: [0, 0, 0],
        cameraPosition: [8, 3, 8],
        cameraTarget: [0, 0.5, 0],
        description: "2014款保时捷911 Turbo",
    },
    {
        name: "初音未来",
        path: "/models/hatsune_miku_lbx_ver_yuki_custom__redesign.glb",
        scale: [1, 1, 1],
        position: [0, 0, 0],
        cameraPosition: [0, 2, 5],
        cameraTarget: [0, 1, 0],
        description: "初音未来 LBX 改版",
    },
];

// ============================================================
//  相机视角预设
// ============================================================

export interface CameraPreset {
    name: string;
    position: [number, number, number];
    target: [number, number, number];
}

const cameraPresets: CameraPreset[] = [
    { name: "正面", position: [0, 2, 8], target: [0, 0.5, 0] },
    { name: "侧面", position: [10, 2, 0], target: [0, 0.5, 0] },
    { name: "顶部", position: [0, 12, 0.1], target: [0, 0, 0] },
    { name: "45度", position: [7, 4, 7], target: [0, 0.5, 0] },
];

// ============================================================
//  共享状态（单例模式）
// ============================================================

/** 当前选中的模型索引 */
const currentModelIndex = ref(0);

/** 动画播放速度 */
const animationSpeed = ref(1);

/** 当前播放的动画名称 */
const currentAnimationName = ref("");

/** 是否暂停动画 */
const isPaused = ref(false);

/** 模型加载进度（0~100） */
const loadingProgress = ref(0);

/** 模型是否加载完成 */
const isModelLoaded = ref(false);

/** 当前激活的相机视角预设索引，-1 表示自定义 */
const activePresetIndex = ref(0);

/** 当前模型的统计数据（顶点/面/材质/动画） */
const modelStats = ref<ModelStats | null>(null);

/** 当前模型可用的动画名称列表 */
const availableAnimations = ref<string[]>([]);

/** 截图触发标志（设为 true 触发截图，截图完成后重置为 false） */
const screenshotRequested = ref(false);

/** 拖拽载入的自定义模型（null 表示当前使用预设模型） */
const customModel = ref<ModelConfig | null>(null);

/** 自定义模型的原始 blob URL（切换时需要 revoke） */
let prevBlobUrl: string | null = null;

// ============================================================
//  Composable 函数
// ============================================================

export function useModelState() {
    /** 当前模型配置（自定义 > 预设） */
    const currentModel = computed(
        () => customModel.value ?? modelList[currentModelIndex.value],
    );

    /** 是否当前为自定义拖拽模型 */
    const isCustomModel = computed(() => customModel.value !== null);

    /** 当前相机视角预设（计算属性） */
    const currentPreset = computed(
        () => cameraPresets[activePresetIndex.value],
    );

    /** 切换模型 */
    function switchModel(index: number) {
        if (index >= 0 && index < modelList.length) {
            currentModelIndex.value = index;
            isModelLoaded.value = false;
            loadingProgress.value = 0;
            currentAnimationName.value = "";
            isPaused.value = false;
            activePresetIndex.value = 0;
            modelStats.value = null;
            availableAnimations.value = [];
            // 切换预设模型时清除自定义模型
            clearCustomModel();
        }
    }

    /** 设置拖拽的自定义模型 */
    function setCustomModel(config: ModelConfig, blobUrl: string) {
        // 释放上一个 blob URL
        if (prevBlobUrl && prevBlobUrl !== blobUrl) {
            URL.revokeObjectURL(prevBlobUrl);
        }
        prevBlobUrl = blobUrl;
        customModel.value = config;
        // 重置加载状态
        isModelLoaded.value = false;
        loadingProgress.value = 0;
        currentAnimationName.value = "";
        isPaused.value = false;
        modelStats.value = null;
        availableAnimations.value = [];
    }

    /** 清除自定义模型，回到当前预设模型 */
    function clearCustomModel() {
        if (prevBlobUrl) {
            URL.revokeObjectURL(prevBlobUrl);
            prevBlobUrl = null;
        }
        customModel.value = null;
    }

    /** 设置模型统计数据 */
    function setModelStats(stats: ModelStats | null) {
        modelStats.value = stats;
    }

    /** 设置当前模型的可用动画列表 */
    function setAvailableAnimations(names: string[]) {
        availableAnimations.value = names;
    }

    /** 请求截图（由控制面板触发，ModelViewer 监听执行） */
    function requestScreenshot() {
        screenshotRequested.value = true;
    }

    /** 切换到下一个模型 */
    function nextModel() {
        switchModel((currentModelIndex.value + 1) % modelList.length);
    }

    /** 设置动画速度 */
    function setAnimationSpeed(speed: number) {
        animationSpeed.value = Math.max(0.1, Math.min(3, speed));
    }

    /** 切换暂停状态 */
    function togglePause() {
        isPaused.value = !isPaused.value;
    }

    /** 设置当前动画名称 */
    function setCurrentAnimation(name: string) {
        currentAnimationName.value = name;
        isPaused.value = false;
    }

    /** 设置加载进度 */
    function setLoadingProgress(progress: number) {
        loadingProgress.value = progress;
    }

    /** 标记模型加载完成 */
    function setModelLoaded(loaded: boolean) {
        isModelLoaded.value = loaded;
        if (loaded) loadingProgress.value = 100;
    }

    /** 切换相机视角预设 */
    function switchCameraPreset(index: number) {
        if (index >= 0 && index < cameraPresets.length) {
            activePresetIndex.value = index;
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
        modelStats,
        availableAnimations,
        screenshotRequested,
        customModel,

        // ---- 计算属性 ----
        currentModel,
        currentPreset,
        isCustomModel,

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
        setModelStats,
        setAvailableAnimations,
        requestScreenshot,
        setCustomModel,
        clearCustomModel,
    };
}
