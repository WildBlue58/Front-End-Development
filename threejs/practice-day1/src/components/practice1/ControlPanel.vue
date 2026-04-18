<script setup lang="ts">
import GeometrySelector from "./controls/GeometrySelector.vue";
import ObjectModeToggle from "./controls/ObjectModeToggle.vue";
import AnimationToggle from "./controls/AnimationToggle.vue";
import MaterialSwitch from "./controls/MaterialSwitch.vue";
import FovSlider from "./controls/FovSlider.vue";
import StatusSummary from "./controls/StatusSummary.vue";
</script>

<template>
    <aside class="control-panel cb-control-panel cb-control-panel--absolute">
        <div class="cb-panel-header">
            <div>
                <p class="cb-panel-eyebrow">Foundation Console</p>
                <h2 class="cb-panel-title">Day 1 基础场景控制台</h2>
            </div>
            <span class="cb-panel-glow"></span>
        </div>

        <p class="cb-panel-copy">
            用同一套实验台风格集中控制几何体、物体数量、旋转动画、材质与相机视场，快速观察基础参数如何改变场景表现。
        </p>

        <div class="cb-panel-body">
            <GeometrySelector />
            <ObjectModeToggle />
            <AnimationToggle />
            <MaterialSwitch />
            <FovSlider />
            <StatusSummary />
        </div>
    </aside>
</template>

<style scoped>
.control-panel {
    z-index: 100;
}
</style>
