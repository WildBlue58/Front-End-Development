<!-- ============================================================
     Practice1Page.vue — Day 1 基础3D场景页面
     
     完整保留 practice1 的所有功能
     → 几何体切换、单/多物体、动画、材质、FOV
============================================================ -->

<script setup lang="ts">
import SceneCanvas from '../components/practice1/SceneCanvas.vue'
import ControlPanel from '../components/practice1/ControlPanel.vue'
</script>

<template>
  <div class="practice1-page">
    <SceneCanvas />
    <ControlPanel />
  </div>
</template>

<style scoped>
.practice1-page {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
