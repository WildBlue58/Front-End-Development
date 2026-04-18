<!-- ============================================================
     ModelScene.vue —Practice2 的D场景组件
     
     包含：
     →TresCanvas 画布
     →模型渲染（ModelViewer：
     →光照系统
     →OrbitControls
     →相机视角切换
     →加载进度显示
============================================================ -->

<script setup lang="ts">
import { watch, shallowRef, ref } from "vue";
import { TresCanvas } from "@tresjs/core";
import { OrbitControls } from "@tresjs/cientos";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";
import ModelViewer from "./ModelViewer.vue";
import { useModelState } from "../../composables/useModelState";

const {
    currentModel,
    currentPreset,
    isModelLoaded,
    loadingProgress,
    isCustomModel,
    setCustomModel,
    clearCustomModel,
} = useModelState();

// 相机引用
const cameraRef = shallowRef<any>(null);

/** 将相机定位到指定位置并朝向目标点 */
function applyCamera(
    position: [number, number, number],
    target: [number, number, number],
) {
    if (!cameraRef.value) return;
    cameraRef.value.position.set(...position);
    cameraRef.value.lookAt(...target);
}

// ---- 监听相机视角预设变化 ----
watch(
    currentPreset,
    (preset) => {
        applyCamera(preset.position, preset.target);
    },
    { immediate: true },
);

// ---- 监听模型切换时重置相机到该模型的推荐视角 ----
watch(
    () => currentModel.value,
    (model) => {
        applyCamera(model.cameraPosition, model.cameraTarget);
    },
);

// ============================================================
//  拖拽文件热替换逻辑
// ============================================================

const isDragOver = ref(false);
const dragError = ref("");

function onDragOver(e: DragEvent) {
    e.preventDefault();
    isDragOver.value = true;
    dragError.value = "";
}

function onDragLeave(e: DragEvent) {
    // 只有离开容器本身（而非子元素）时清除遗界
    const target = e.relatedTarget as Node | null;
    const sceneEl = e.currentTarget as HTMLElement;
    if (!sceneEl.contains(target)) {
        isDragOver.value = false;
    }
}

function onDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver.value = false;

    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "glb") {
        dragError.value = `不支持此格式，请拖拽 .glb 文件`;
        setTimeout(() => (dragError.value = ""), 3000);
        return;
    }

    const blobUrl = URL.createObjectURL(file);
    loadDroppedModel(file.name, blobUrl);
}

/**
 * 用GLTFLoader 预加载模型，计算 Box3 自动归一化缩放，再设置到状态
 */
function loadDroppedModel(fileName: string, blobUrl: string) {
    const loader = new GLTFLoader();
    loader.load(
        blobUrl,
        (gltf) => {
            const scene = gltf.scene;

            // 计算包围盒，归一化缩放（最长轴 = 5 单位：
            const box = new THREE.Box3().setFromObject(scene);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxAxis = Math.max(size.x, size.y, size.z);
            const s: [number, number, number] =
                maxAxis > 0
                    ? [5 / maxAxis, 5 / maxAxis, 5 / maxAxis]
                    : [1, 1, 1];

            // 相机距离根据归一化后尺寸自动设定
            const d = 5 * 1.6;
            const camPos: [number, number, number] = [d, d * 0.5, d];
            const camTarget: [number, number, number] = [0, 0.5, 0];

            setCustomModel(
                {
                    name: fileName,
                    path: blobUrl,
                    scale: s,
                    position: [0, 0, 0],
                    cameraPosition: camPos,
                    cameraTarget: camTarget,
                    description: `拖拽载入: ${fileName}`,
                },
                blobUrl,
            );
        },
        undefined,
        (err) => {
            URL.revokeObjectURL(blobUrl);
            dragError.value = `模型解析失败: ${(err as any)?.message ?? err}`;
            setTimeout(() => (dragError.value = ""), 4000);
        },
    );
}
</script>

<template>
    <div
        class="model-scene"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop"
    >
        <TresCanvas
            clear-color="#1a1a2e"
            window-size
            shadows
            :renderer-options="{ preserveDrawingBuffer: true }"
        >
            <!-- 相机：look-at 是TresJS 原生 prop，会直接调用 camera.lookAt()，无需依赖 watch 时序 -->
            <TresPerspectiveCamera
                ref="cameraRef"
                :position="currentModel.cameraPosition"
                :look-at="currentModel.cameraTarget"
                :fov="45"
                :near="0.01"
                :far="1000"
            />

            <!-- 轨道控制 -->
            <OrbitControls
                :enable-damping="true"
                :damping-factor="0.05"
                :min-distance="0.3"
                :max-distance="50"
            />

            <!-- 环境光：调高强度，确保无 HDR 时金属材质也可见 -->
            <TresAmbientLight :intensity="2.0" />

            <!-- 主方向光（模拟太阳） -->
            <TresDirectionalLight
                :position="[5, 8, 5]"
                :intensity="2.0"
                cast-shadow
            />

            <!-- 补光（右侧） -->
            <TresDirectionalLight :position="[-5, 4, -5]" :intensity="1.0" />

            <!-- 填充光（正面低角度，补充细节：-->
            <TresDirectionalLight :position="[0, 2, 8]" :intensity="0.8" />

            <!-- 半球光（天空/地面环境色）-->
            <TresHemisphereLight :args="['#b1e1ff', '#b97a20', 1.0]" />

            <!-- 模型渲染（key 强制重新挂载：-->
            <ModelViewer
                :key="currentModel.path"
                :model-path="currentModel.path"
                :scale="currentModel.scale"
                :position="currentModel.position"
            />
        </TresCanvas>

        <!-- 拖拽遗留遮罩 -->
        <Transition name="fade">
            <div v-if="isDragOver" class="drag-overlay">
                <div class="drag-hint">
                    <div class="drag-icon">📦</div>
                    <p>松开以替换模型</p>
                    <p class="drag-sub">支持 .glb 格式</p>
                </div>
            </div>
        </Transition>

        <!-- 拖拽错误提示 -->
        <Transition name="fade">
            <div v-if="dragError" class="drag-error">⚠️ {{ dragError }}</div>
        </Transition>

        <!-- 自定义模型提示条 -->
        <Transition name="slide-down">
            <div v-if="isCustomModel" class="custom-model-bar">
                <span>🔄 拖拽模型: {{ currentModel.name }}</span>
                <button class="clear-btn" @click="clearCustomModel">
                    × 清除
                </button>
            </div>
        </Transition>

        <!-- 加载进度遮罩 -->
        <Transition name="fade">
            <div v-if="!isModelLoaded" class="loading-overlay">
                <div class="loading-content">
                    <div class="loading-spinner" />
                    <p class="loading-text">模型加载一..</p>
                    <div class="progress-bar">
                        <div
                            class="progress-fill"
                            :style="{ width: loadingProgress + '%' }"
                        />
                    </div>
                    <p v-if="loadingProgress > 0" class="progress-text">
                        {{ loadingProgress }}%
                    </p>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.model-scene {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

/* ---- 拖拽遮罩 ---- */
.drag-overlay {
    position: absolute;
    inset: 0;
    background: rgba(99, 102, 241, 0.15);
    border: 3px dashed #6366f1;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    pointer-events: none;
    backdrop-filter: blur(2px);
}

.drag-hint {
    text-align: center;
    color: #c7d2fe;
}

.drag-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.drag-hint p {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.drag-sub {
    font-size: 13px !important;
    color: #94a3b8 !important;
    margin-top: 6px !important;
}

/* ---- 拖拽错误提示 ---- */
.drag-error {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
    padding: 8px 18px;
    border-radius: 8px;
    font-size: 13px;
    z-index: 60;
    white-space: nowrap;
}

/* ---- 自定义模型提示条 ---- */
.custom-model-bar {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(16, 16, 36, 0.85);
    border: 1px solid rgba(99, 102, 241, 0.35);
    border-radius: 8px;
    padding: 6px 14px;
    color: #a5b4fc;
    font-size: 12px;
    z-index: 30;
    backdrop-filter: blur(8px);
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.clear-btn {
    flex-shrink: 0;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 5px;
    color: #fca5a5;
    font-size: 11px;
    padding: 2px 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.clear-btn:hover {
    background: rgba(239, 68, 68, 0.3);
}

/* ---- 加载遇罩 ---- */

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(26, 26, 46, 0.9);
    z-index: 10;
}

.loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.loading-text {
    color: #94a3b8;
    font-size: 14px;
    margin: 0;
}

.progress-text {
    color: #818cf8;
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    font-variant-numeric: tabular-nums;
}

.loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(99, 102, 241, 0.2);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.progress-bar {
    width: 240px;
    height: 6px;
    background: rgba(99, 102, 241, 0.15);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #42b883);
    border-radius: 3px;
    transition: width 0.3s ease;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* slide-down for custom model bar */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-12px);
}
</style>
