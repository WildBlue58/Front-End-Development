<script setup lang="ts">
import { computed } from "vue";
import { useModelState } from "../../composables/useModelState";

const {
    currentModelIndex,
    animationSpeed,
    currentAnimationName,
    isPaused,
    isModelLoaded,
    loadingProgress,
    currentModel,
    modelList,
    cameraPresets,
    activePresetIndex,
    modelStats,
    availableAnimations,
    switchModel,
    setAnimationSpeed,
    togglePause,
    switchCameraPreset,
    setCurrentAnimation,
    requestScreenshot,
} = useModelState();

const modelDescriptions: Record<string, string> = {
    保时捷911: "2014款保时捷911 Turbo (991)，经典跑车3D模型",
    初音未来: "初音未来 LBX 改版，带骨骼动画的角色模型",
};

const currentDescription = computed(() => {
    return modelDescriptions[currentModel.value.name] || currentModel.value.description;
});
</script>

<template>
    <aside class="control-panel cb-control-panel cb-control-panel--absolute">
        <div class="cb-panel-header panel-header">
            <div>
                <p class="cb-panel-eyebrow">Model Console</p>
                <h2 class="cb-panel-title">Day 2 模型控制台</h2>
            </div>
            <div class="header-right">
                <button class="cb-panel-button screenshot-btn" :disabled="!isModelLoaded" @click="requestScreenshot">截图</button>
                <span class="cb-panel-badge">Practice 2</span>
            </div>
        </div>

        <p class="cb-panel-copy">统一控制本地模型的切换、动画、视角和加载状态，让 Day 2 的交互层也拥有与 Practice5 一致的科技实验台观感。</p>

        <div class="cb-panel-body">
            <section class="cb-panel-section">
                <div class="cb-panel-section-title">模型选择</div>
                <div class="model-grid cb-panel-grid cb-panel-grid--2">
                    <button
                        v-for="(model, index) in modelList"
                        :key="index"
                        class="model-card cb-panel-option-card"
                        :class="{ active: currentModelIndex === index }"
                        @click="switchModel(index)"
                    >
                        <span class="model-icon">{{ index === 0 ? "🏎️" : "🎤" }}</span>
                        <span class="model-name">{{ model.name }}</span>
                    </button>
                </div>
                <p class="model-desc cb-panel-note">{{ currentDescription }}</p>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">动画控制</div>

                <div class="anim-row">
                    <button class="cb-panel-button ctrl-btn" :class="{ active: isPaused }" :disabled="!isModelLoaded" @click="togglePause">
                        {{ isPaused ? "继续播放" : "暂停播放" }}
                    </button>
                    <span class="anim-status">{{ !isModelLoaded ? "加载中..." : isPaused ? "已暂停" : "播放中" }}</span>
                </div>

                <div v-if="currentAnimationName" class="current-anim">
                    <span class="label">当前动画</span>
                    <span class="anim-name">{{ currentAnimationName }}</span>
                </div>

                <div v-if="availableAnimations.length > 1" class="anim-tracks">
                    <div class="track-header cb-panel-section-title">动画轨道</div>
                    <div class="track-list">
                        <button
                            v-for="name in availableAnimations"
                            :key="name"
                            class="cb-panel-button track-btn"
                            :class="{ active: currentAnimationName === name }"
                            @click="setCurrentAnimation(name)"
                        >
                            {{ name }}
                        </button>
                    </div>
                </div>

                <div class="speed-control cb-panel-item cb-panel-item--compact">
                    <div class="cb-control-head">
                        <span>播放速度</span>
                        <strong>{{ animationSpeed.toFixed(1) }}x</strong>
                    </div>
                    <input
                        :value="animationSpeed"
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        class="cb-panel-range speed-slider"
                        @input="setAnimationSpeed(Number(($event.target as HTMLInputElement).value))"
                    />
                    <div class="cb-panel-hint-row">
                        <span>0.1x</span>
                        <span>1.0x</span>
                        <span>3.0x</span>
                    </div>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">相机视角</div>
                <div class="preset-grid cb-panel-grid cb-panel-grid--2">
                    <button
                        v-for="(preset, index) in cameraPresets"
                        :key="index"
                        class="cb-panel-button preset-btn"
                        :class="{ active: activePresetIndex === index }"
                        @click="switchCameraPreset(index)"
                    >
                        {{ preset.name }}
                    </button>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">模型信息</div>
                <div class="cb-panel-info-list info-list">
                    <div class="cb-panel-info-row">
                        <span class="cb-panel-info-label">模型</span>
                        <span class="cb-panel-info-value">{{ currentModel.name }}</span>
                    </div>
                    <div class="cb-panel-info-row">
                        <span class="cb-panel-info-label">路径</span>
                        <span class="cb-panel-info-value path">{{ currentModel.path }}</span>
                    </div>
                    <div class="cb-panel-info-row">
                        <span class="cb-panel-info-label">缩放</span>
                        <span class="cb-panel-info-value">{{ currentModel.scale.join(", ") }}</span>
                    </div>
                    <div class="cb-panel-info-row">
                        <span class="cb-panel-info-label">状态</span>
                        <span class="cb-panel-info-value" :class="isModelLoaded ? 'loaded' : 'loading'">
                            {{ isModelLoaded ? "已加载" : `加载中 ${loadingProgress}%` }}
                        </span>
                    </div>
                    <div v-if="!isModelLoaded" class="loading-wrap">
                        <div class="cb-panel-progress-bar">
                            <div class="cb-panel-progress-fill" :style="{ width: `${loadingProgress}%` }" />
                        </div>
                    </div>
                    <template v-if="modelStats">
                        <div class="cb-panel-info-row">
                            <span class="cb-panel-info-label">顶点</span>
                            <span class="cb-panel-info-value">{{ modelStats.vertices.toLocaleString() }}</span>
                        </div>
                        <div class="cb-panel-info-row">
                            <span class="cb-panel-info-label">三角面</span>
                            <span class="cb-panel-info-value">{{ modelStats.faces.toLocaleString() }}</span>
                        </div>
                        <div class="cb-panel-info-row">
                            <span class="cb-panel-info-label">材质</span>
                            <span class="cb-panel-info-value">{{ modelStats.materials }}</span>
                        </div>
                        <div class="cb-panel-info-row">
                            <span class="cb-panel-info-label">动画数</span>
                            <span class="cb-panel-info-value">{{ modelStats.animations }}</span>
                        </div>
                    </template>
                </div>
            </section>
        </div>
    </aside>
</template>

<style scoped>
.control-panel {
    z-index: 100;
}

.panel-header {
    align-items: flex-start;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.screenshot-btn {
    min-height: 28px;
    padding-inline: 12px;
}

.model-card {
    justify-items: center;
    text-align: center;
}

.model-icon {
    font-size: 24px;
}

.model-name {
    font-size: 12px;
    font-weight: 600;
}

.model-desc {
    margin: 12px 0 0;
}

.anim-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.ctrl-btn,
.track-btn,
.preset-btn {
    width: 100%;
}

.anim-row .ctrl-btn {
    width: auto;
}

.anim-status,
.label {
    color: #64748b;
    font-size: 12px;
}

.current-anim {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 12px;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    background: rgba(2, 6, 23, 0.38);
}

.anim-name {
    color: #f8fafc;
    font-size: 12px;
    font-weight: 600;
}

.anim-tracks {
    margin-top: 14px;
}

.track-header {
    margin-bottom: 8px;
}

.track-list {
    display: grid;
    gap: 8px;
    max-height: 132px;
    overflow-y: auto;
    padding-right: 2px;
}

.track-list::-webkit-scrollbar {
    width: 4px;
}

.track-list::-webkit-scrollbar-thumb {
    background: rgba(56, 189, 248, 0.28);
    border-radius: 999px;
}

.speed-control {
    margin-top: 14px;
}

.info-list {
    gap: 8px;
}

.path {
    max-width: 156px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    direction: rtl;
    text-align: right;
}

.loaded {
    color: #86efac;
}

.loading {
    color: #f59e0b;
}

.loading-wrap {
    padding: 4px 2px 0;
}
</style>
