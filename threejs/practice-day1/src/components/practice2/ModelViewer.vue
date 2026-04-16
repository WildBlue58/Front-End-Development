<!-- ============================================================
     ModelViewer.vue —单个模型渲染组件

     核心功能：
     →useGLTF 加载 GLB 模型（cientos v5 API：
     →primitive 渲染模型
     →useAnimations 动画控制（播放暂停/切换/速度：
     →渲染循环一mixer.update(delta) 驱动动画
============================================================ -->

<script setup lang="ts">
import { computed, watch, onUnmounted, ref, shallowRef } from "vue";
import { useLoop } from "@tresjs/core";
import { useGLTF } from "@tresjs/cientos";
import * as THREE from "three";
import { useModelState } from "../../composables/useModelState";

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
    setModelStats,
    setAvailableAnimations,
    screenshotRequested,
} = useModelState();

// ---- 加载模型（cientos v5 API：----
const { state, isLoading } = useGLTF(props.modelPath);

// 计算属性：模型场景和动画列行
const model = computed(() => state.value?.scene ?? null);
const animations = computed(() => state.value?.animations ?? []);

// ---- 模拟加载进度 ----
let progressTimer: ReturnType<typeof setInterval> | null = null;
let fakeProgress = 0;

function startProgressSimulation() {
    fakeProgress = 0;
    progressTimer = setInterval(() => {
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

startProgressSimulation();

// ---- 动画系统（手动管理AnimationMixer，避关model 一null 时崩溃） ----
const mixer = shallowRef<THREE.AnimationMixer | null>(null);
const actions = shallowRef<Record<string, THREE.AnimationAction>>({});
const currentAction = ref<THREE.AnimationAction | null>(null);

// ---- 加载完成后初始化阴影和动用----
watch(model, (newModel) => {
    if (!newModel) return;

    stopProgressSimulation();
    setModelLoaded(true);
    setLoadingProgress(100);

    // 遍历所有子 Mesh，开启阴影
    newModel.traverse((child: any) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    // 初始化动用Mixer
    const m = new THREE.AnimationMixer(newModel);
    m.timeScale = animationSpeed.value;
    mixer.value = m;

    // 创建所机AnimationAction
    const clips = animations.value;
    const actionMap: Record<string, THREE.AnimationAction> = {};
    clips.forEach((clip) => {
        actionMap[clip.name] = m.clipAction(clip);
    });
    actions.value = actionMap;

    // 自动播放第一个动用
    const names = Object.keys(actionMap);
    if (names.length > 0) {
        const firstName = names[0];
        setCurrentAnimation(firstName);
        const action = actionMap[firstName];
        action.reset().fadeIn(0.3).play();
        currentAction.value = action;
    }

    // ---- 采集模型统计数据 ----
    let vertices = 0;
    let faces = 0;
    const materialSet = new Set<THREE.Material>();
    newModel.traverse((child: any) => {
        if (child.isMesh && child.geometry) {
            const geo = child.geometry as THREE.BufferGeometry;
            const pos = geo.attributes.position;
            if (pos) vertices += pos.count;
            const idx = geo.index;
            faces += idx ? idx.count / 3 : (pos?.count ?? 0) / 3;
            if (child.material) {
                const mats = Array.isArray(child.material)
                    ? child.material
                    : [child.material];
                mats.forEach((mat: THREE.Material) => materialSet.add(mat));
            }
        }
    });
    setModelStats({
        vertices: Math.round(vertices),
        faces: Math.round(faces),
        materials: materialSet.size,
        animations: clips.length,
    });
    setAvailableAnimations(names);
});

// ---- 截图监听（直接从 canvas DOM 元素获取图像：----
watch(screenshotRequested, (requested) => {
    if (!requested) return;
    try {
        const canvas = document.querySelector(
            "canvas",
        ) as HTMLCanvasElement | null;
        if (canvas) {
            const dataUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `scene_${Date.now()}.png`;
            link.click();
        }
    } catch (e) {
        console.error("[ModelViewer] 截图失败:", e);
    } finally {
        screenshotRequested.value = false;
    }
});

// ---- 监听 isLoading（备选触发） ----
watch(isLoading, (loading) => {
    if (!loading && model.value && !mixer.value) {
        // model watch 还没触发时的后备
        stopProgressSimulation();
        setModelLoaded(true);
        setLoadingProgress(100);
    }
});

// ---- 播放指定动画（带淡入淡出切换：----
function playAnimation(name: string) {
    const action = actions.value[name];
    if (!action) return;
    if (currentAction.value && currentAction.value !== action) {
        currentAction.value.fadeOut(0.5);
    }
    action.reset().fadeIn(0.5).play();
    currentAction.value = action;
    setCurrentAnimation(name);
}

// ---- 监听外部动画切换 ----
watch(currentAnimationName, (name) => {
    if (
        name &&
        actions.value[name] &&
        actions.value[name] !== currentAction.value
    ) {
        playAnimation(name);
    }
});

// ---- 监听暂停状态----
watch(isPaused, (paused) => {
    if (paused) {
        currentAction.value?.paused && (currentAction.value.paused = true);
    } else {
        if (currentAction.value) currentAction.value.paused = false;
    }
});

// ---- 监听动画速度 ----
watch(animationSpeed, (speed) => {
    if (mixer.value) {
        mixer.value.timeScale = speed;
    }
});

// ---- 渲染循环驱动动画 ----
let onRender: any = null;
try {
    const loopResult = useLoop();
    onRender = loopResult.onRender;
} catch (e: any) {
    console.error("[ModelViewer] useLoop failed:", e.message, e.stack);
}

if (onRender) {
    onRender(({ delta }: { delta: number }) => {
        if (mixer.value && !isPaused.value) {
            mixer.value.update(delta);
        }
    });
}

// ---- 组件卸载时清理----
onUnmounted(() => {
    stopProgressSimulation();
    if (mixer.value) {
        mixer.value.stopAllAction();
    }
    setModelLoaded(false);
    setLoadingProgress(0);
    setModelStats(null);
    setAvailableAnimations([]);
});

// ---- 暴露供父组件调用 ----
const animationNames = computed(() => Object.keys(actions.value));
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
