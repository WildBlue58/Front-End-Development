<!-- ============================================================
     ModelScene.vue — Practice2 的3D场景组件
     
     包含：
     → TresCanvas 画布
     → 模型渲染（ModelViewer）
     → 光照系统
     → OrbitControls
     → 相机视角切换
     → 加载进度显示
============================================================ -->

<script setup lang="ts">
import { watch, shallowRef } from "vue";
import { TresCanvas } from "@tresjs/core";
import { OrbitControls, Environment } from "@tresjs/cientos";
import ModelViewer from "./ModelViewer.vue";
import { useModelState } from "../composables/useModelState";

const { currentModel, currentPreset, isModelLoaded, loadingProgress } =
    useModelState();

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
// immediate: true 确保初始挂载时立即执行——修复切换回预设 0 时因值不变导致 watch 不触发的问题
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
</script>

<template>
    <div class="model-scene">
        <TresCanvas clear-color="#1a1a2e" window-size shadows>
            <!-- 相机 -->
            <TresPerspectiveCamera
                ref="cameraRef"
                :position="currentModel.cameraPosition"
                :fov="45"
                :near="0.1"
                :far="1000"
            />

            <!-- 轨道控制 -->
            <OrbitControls
                :enable-damping="true"
                :damping-factor="0.05"
                :min-distance="1"
                :max-distance="50"
            />

            <!-- 环境光 -->
            <TresAmbientLight :intensity="0.6" />

            <!-- 主方向光（模拟太阳） -->
            <TresDirectionalLight
                :position="[5, 8, 5]"
                :intensity="1.2"
                cast-shadow
            />

            <!-- 补光 -->
            <TresDirectionalLight :position="[-3, 4, -5]" :intensity="0.4" />

            <!-- 半球光（天空/地面环境色） -->
            <TresHemisphereLight :args="['#b1e1ff', '#b97a20', 0.3]" />

            <!-- 地面 -->
            <TresMesh
                :position="[0, -0.01, 0]"
                :rotation="[-Math.PI / 2, 0, 0]"
                receive-shadow
            >
                <TresPlaneGeometry :args="[30, 30]" />
                <TresMeshStandardMaterial
                    color="#2a2a3e"
                    :roughness="0.8"
                    :metalness="0.2"
                />
            </TresMesh>

            <!-- HDR 环境贴图：修复高金属度 PBR 材质在暗背景下因无环境反射而不可见的问题 -->
            <Suspense>
                <Environment preset="hangar" :background="false" />
            </Suspense>

            <!-- 模型渲染（key 强制重新挂载） -->
            <ModelViewer
                :key="currentModel.path"
                :model-path="currentModel.path"
                :scale="currentModel.scale"
                :position="currentModel.position"
            />
        </TresCanvas>

        <!-- 加载进度遮罩 -->
        <Transition name="fade">
            <div v-if="!isModelLoaded" class="loading-overlay">
                <div class="loading-content">
                    <div class="loading-spinner" />
                    <p class="loading-text">模型加载中...</p>
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

.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-leave-to {
    opacity: 0;
}
</style>
