<!-- ============================================================
     ModelViewer.vue — 单个模型渲染组件
     
     核心功能：
     → useGLTF 加载 GLB 模型（cientos v5 API）
     → primitive 渲染模型
     → useAnimations 动画控制（播放/暂停/切换/速度）
     → 渲染循环中 mixer.update(delta) 驱动动画
============================================================ -->

<script setup lang="ts">
import {
    computed,
    watch,
    onUnmounted,
    ref,
    watchEffect,
    shallowRef,
} from "vue";
import { useLoop } from "@tresjs/core";
import { useGLTF, useAnimations } from "@tresjs/cientos";
import { useModelState } from "../composables/useModelState";

const props = defineProps<{
    /** GLB 模型路径 */
    modelPath: string;
    /** 模型缩放 */
    scale: [number, number, number];
    /** 模型位置偏移 */
    position: [number, number, number];
}>();

const {
    animationSpeed,
    isPaused,
    currentAnimationName,
    setCurrentAnimation,
    setModelLoaded,
    setLoadingProgress,
    isModelLoaded,
} = useModelState();

// ---- 加载模型（cientos v5 同步 API） ----
// traverse 回调：对 GLB 内所有 Mesh 开启阴影投射和接收，修复开启 shadows 后光照不完整的问题
const { state, isLoading } = useGLTF(props.modelPath, {
    traverse: (child) => {
        const mesh = child as any;
        if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
    },
});

// 计算属性：模型场景和动画列表
const model = computed(() => state.value?.scene);
const animations = computed(() => state.value?.animations || []);

// ---- 模拟加载进度（useGLTF v5 不提供 progress） ----
let progressTimer: ReturnType<typeof setInterval> | null = null;
let fakeProgress = 0;

function startProgressSimulation() {
    fakeProgress = 0;
    progressTimer = setInterval(() => {
        // 模拟进度：快到 90% 时减速，等真正加载完再跳 100%
        if (fakeProgress < 90) {
            fakeProgress += Math.random() * 15 + 5;
            if (fakeProgress > 90) fakeProgress = 90;
            setLoadingProgress(Math.round(fakeProgress));
        }
    }, 300);
}

function stopProgressSimulation() {
    if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
    }
}

// 开始模拟进度
startProgressSimulation();

// ---- 动画系统（cientos v5 API：传 computed） ----
const { actions, mixer } = useAnimations(animations, model, {
    manualUpdate: true,
});
// stableMixer: 缓存 mixer 实例，避免 computed 在 reference 变化时重建导致速度调节和清理失效
const stableMixer = shallowRef<any>(null);
watch(
    mixer,
    (m) => {
        if (m) stableMixer.value = m;
    },
    { immediate: true },
);
// ---- 加载完成回调 ----
watch(model, (newModel) => {
    if (newModel) {
        stopProgressSimulation();
        setModelLoaded(true);
        setLoadingProgress(100);
    }
});

// 监听 isLoading 变化
watch(isLoading, (loading) => {
    if (!loading && model.value) {
        stopProgressSimulation();
        setModelLoaded(true);
        setLoadingProgress(100);
    }
});

// 获取动画名称列表
const animationNames = computed(() => Object.keys(actions));

// ---- 自动播放第一个动画 ----
watchEffect(() => {
    const names = Object.keys(actions);
    if (names.length > 0 && !currentAnimationName.value) {
        setCurrentAnimation(names[0]);
    }
});

// ---- 播放指定动画（带淡入淡出切换） ----
const currentAction = ref<any>(null);

function playAnimation(name: string) {
    const action = actions[name];
    if (!action) return;
    if (currentAction.value) {
        currentAction.value.fadeOut(0.5);
    }
    action.reset().fadeIn(0.5).play();
    currentAction.value = action;
    setCurrentAnimation(name);
}

// ---- 监听外部动画切换 ----
watch(currentAnimationName, (name) => {
    if (name && actions[name]) {
        playAnimation(name);
    }
});

// ---- 监听暂停状态 ----
watch(isPaused, (paused) => {
    if (paused) {
        currentAction.value?.pause();
    } else {
        currentAction.value?.resume();
    }
});

// ---- 监听动画速度 ----
watch(animationSpeed, (speed) => {
    if (stableMixer.value) {
        stableMixer.value.timeScale = speed;
    }
});

// ---- 渲染循环驱动动画（手动更新模式） ----
const { onLoop } = useLoop();
onLoop(({ delta }) => {
    if (stableMixer.value && !isPaused.value) {
        stableMixer.value.update(delta);
    }
});

// ---- 组件卸载时清理动画 ----
onUnmounted(() => {
    stopProgressSimulation();
    if (stableMixer.value) {
        stableMixer.value.stopAllAction();
    }
    setModelLoaded(false);
    setLoadingProgress(0);
});

// ---- 暴露方法供父组件调用 ----
defineExpose({
    animationNames,
    playAnimation,
});
</script>

<template>
    <primitive
        v-if="model"
        :object="model"
        :scale="scale"
        :position="position"
    />
</template>
