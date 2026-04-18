<!-- ============================================================
     Practice4Page.vue — Day 4 Shader 波浪练习页面
============================================================ -->

<script setup lang="ts">
import WaveScene from "../components/practice4/WaveScene.vue";
import WaveControlPanel from "../components/practice4/WaveControlPanel.vue";
</script>

<template>
    <div class="practice4-page">
        <WaveScene />
        <WaveControlPanel />
    </div>
</template>

<style scoped>
.practice4-page {
    position: relative;
    width: 100%;
    height: 100%;
}
</style>
