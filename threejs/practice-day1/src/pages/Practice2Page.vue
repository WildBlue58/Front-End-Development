<!-- ============================================================
     Practice2Page.vue — Day 2 模型加载与动画控制页面
     
     功能：
     → GLB 模型加载（useGLTF + primitive）
     → 双模型切换
     → 动画播放/暂停/切换/速度调节
     → 相机视角预设切换
     → OrbitControls 交互
     → 加载状态显示
============================================================ -->

<script setup lang="ts">
import ModelScene from '../components/ModelScene.vue'
import ModelControlPanel from '../components/ModelControlPanel.vue'
</script>

<template>
  <div class="practice2-page">
    <Suspense>
      <ModelScene />
      <template #fallback>
        <div class="loading-fallback">
          <div class="loading-spinner" />
          <p>场景初始化中...</p>
        </div>
      </template>
    </Suspense>
    <ModelControlPanel />
  </div>
</template>

<style scoped>
.practice2-page {
  position: relative;
  width: 100%;
  height: 100%;
}

.loading-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  font-size: 14px;
  gap: 16px;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
