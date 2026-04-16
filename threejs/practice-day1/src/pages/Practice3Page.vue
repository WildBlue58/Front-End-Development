<!-- ============================================================
     Practice3Page.vue — Day 3 PBR 材质对比页面
============================================================ -->

<script setup lang="ts">
import PBRScene from "../components/practice3/PBRScene.vue";
import PBRControlPanel from "../components/practice3/PBRControlPanel.vue";
</script>

<template>
    <div class="practice3-page">
        <PBRScene />
        <PBRControlPanel />
    </div>
</template>

<style scoped>
.practice3-page {
    position: relative;
    width: 100%;
    height: 100%;
}
</style>
