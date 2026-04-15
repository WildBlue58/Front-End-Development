<!-- ============================================================
     ModelControlPanel.vue — Practice2 的控制面板
     
     深色毛玻璃风格，与 Practice1 一致
     功能区域：
     → 模型选择（切换两个GLB模型）
     → 动画控制（播放/暂停/切换/速度调节）
     → 相机视角预设（正面/侧面/顶部/45度）
     → 模型信息展示
============================================================ -->

<script setup lang="ts">
import { computed } from 'vue'
import { useModelState } from '../composables/useModelState'

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
  switchModel,
  setAnimationSpeed,
  togglePause,
  switchCameraPreset,
} = useModelState()

// ---- 模型描述映射 ----
const modelDescriptions: Record<string, string> = {
  '保时捷 911': '2014款保时捷911 Turbo (991)，经典跑车3D模型',
  '初音未来': '初音未来 LBX 改版，带骨骼动画的角色模型',
}

const currentDescription = computed(() => {
  return modelDescriptions[currentModel.value.name] || currentModel.value.description
})
</script>

<template>
  <div class="control-panel">
    <!-- 标题 -->
    <div class="panel-header">
      <h3 class="panel-title">模型控制</h3>
      <span class="panel-badge">Practice 2</span>
    </div>

    <!-- 模型选择 -->
    <div class="panel-section">
      <div class="section-title">模型选择</div>
      <div class="model-grid">
        <button
          v-for="(model, index) in modelList"
          :key="index"
          class="model-card"
          :class="{ active: currentModelIndex === index }"
          @click="switchModel(index)"
        >
          <span class="model-icon">{{ index === 0 ? '🏎️' : '🎤' }}</span>
          <span class="model-name">{{ model.name }}</span>
        </button>
      </div>
      <p class="model-desc">{{ currentDescription }}</p>
    </div>

    <!-- 动画控制 -->
    <div class="panel-section">
      <div class="section-title">动画控制</div>

      <!-- 播放/暂停 -->
      <div class="anim-row">
        <button
          class="ctrl-btn"
          :class="{ active: isPaused }"
          @click="togglePause"
          :disabled="!isModelLoaded"
        >
          {{ isPaused ? '▶ 继续' : '⏸ 暂停' }}
        </button>
        <span class="anim-status">
          {{ !isModelLoaded ? '加载中...' : (isPaused ? '已暂停' : '播放中') }}
        </span>
      </div>

      <!-- 当前动画 -->
      <div v-if="currentAnimationName" class="current-anim">
        <span class="label">当前动画：</span>
        <span class="anim-name">{{ currentAnimationName }}</span>
      </div>

      <!-- 速度控制 -->
      <div class="speed-control">
        <div class="speed-header">
          <span class="label">播放速度</span>
          <span class="speed-value">{{ animationSpeed.toFixed(1) }}x</span>
        </div>
        <input
          type="range"
          :value="animationSpeed"
          @input="setAnimationSpeed(Number(($event.target as HTMLInputElement).value))"
          min="0.1"
          max="3"
          step="0.1"
          class="speed-slider"
        />
        <div class="speed-marks">
          <span>0.1x</span>
          <span>1.0x</span>
          <span>3.0x</span>
        </div>
      </div>
    </div>

    <!-- 相机视角 -->
    <div class="panel-section">
      <div class="section-title">相机视角</div>
      <div class="preset-grid">
        <button
          v-for="(preset, index) in cameraPresets"
          :key="index"
          class="preset-btn"
          :class="{ active: activePresetIndex === index }"
          @click="switchCameraPreset(index)"
        >
          {{ preset.name }}
        </button>
      </div>
    </div>

    <!-- 模型信息 -->
    <div class="panel-section">
      <div class="section-title">模型信息</div>
      <div class="info-list">
        <div class="info-row">
          <span class="info-label">模型</span>
          <span class="info-value">{{ currentModel.name }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">路径</span>
          <span class="info-value path">{{ currentModel.path }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">缩放</span>
          <span class="info-value">{{ currentModel.scale.join(', ') }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">状态</span>
          <span class="info-value" :class="isModelLoaded ? 'loaded' : 'loading'">
            {{ isModelLoaded ? '✓ 已加载' : `⏳ 加载中 ${loadingProgress}%` }}
          </span>
        </div>
        <div v-if="!isModelLoaded" class="info-row">
          <div class="panel-progress-bar">
            <div
              class="panel-progress-fill"
              :style="{ width: loadingProgress + '%' }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 280px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: rgba(20, 20, 40, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  color: #e2e8f0;
  font-size: 13px;
  z-index: 100;
}

.control-panel::-webkit-scrollbar {
  width: 4px;
}

.control-panel::-webkit-scrollbar-track {
  background: transparent;
}

.control-panel::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.3);
  border-radius: 2px;
}

/* ---- 头部 ---- */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.panel-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  border-radius: 4px;
}

/* ---- 分区 ---- */
.panel-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

/* ---- 模型选择 ---- */
.model-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.model-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.model-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(99, 102, 241, 0.3);
}

.model-card.active {
  background: rgba(99, 102, 241, 0.15);
  border-color: #6366f1;
  color: #e2e8f0;
}

.model-icon {
  font-size: 24px;
}

.model-name {
  font-size: 12px;
  font-weight: 500;
}

.model-desc {
  margin: 8px 0 0;
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
}

/* ---- 动画控制 ---- */
.anim-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.ctrl-btn {
  padding: 6px 14px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 6px;
  color: #818cf8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ctrl-btn:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.25);
  border-color: #6366f1;
}

.ctrl-btn.active {
  background: rgba(99, 102, 241, 0.3);
  color: #c7d2fe;
}

.ctrl-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.anim-status {
  font-size: 11px;
  color: #64748b;
}

.current-anim {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

.label {
  font-size: 11px;
  color: #64748b;
}

.anim-name {
  font-size: 12px;
  color: #a5b4fc;
  font-weight: 500;
}

/* ---- 速度控制 ---- */
.speed-control {
  margin-top: 8px;
}

.speed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.speed-value {
  font-size: 13px;
  font-weight: 600;
  color: #818cf8;
}

.speed-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 2px;
  outline: none;
}

.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #6366f1;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #1a1a2e;
}

.speed-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 10px;
  color: #475569;
}

/* ---- 相机视角 ---- */
.preset-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.preset-btn {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(99, 102, 241, 0.3);
}

.preset-btn.active {
  background: rgba(99, 102, 241, 0.15);
  border-color: #6366f1;
  color: #e2e8f0;
}

/* ---- 模型信息 ---- */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.info-label {
  font-size: 11px;
  color: #64748b;
}

.info-value {
  font-size: 12px;
  color: #cbd5e1;
  font-weight: 500;
}

.info-value.path {
  font-size: 10px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
  text-align: right;
}

.info-value.loaded {
  color: #4ade80;
}

.info-value.loading {
  color: #facc15;
}

.panel-progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(99, 102, 241, 0.15);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}

.panel-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #42b883);
  border-radius: 2px;
  transition: width 0.3s ease;
}
</style>
