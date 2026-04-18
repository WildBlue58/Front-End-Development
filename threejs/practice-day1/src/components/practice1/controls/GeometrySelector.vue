<script setup lang="ts">
import { useSceneState } from "../../../composables/useSceneState";

const { currentGeometry } = useSceneState();

const optionsWithIcons = [
    { label: "盒子", value: "box" },
    { label: "球体", value: "sphere" },
    { label: "圆锥", value: "cone" },
    { label: "甜甜圈", value: "torus" },
];
</script>

<template>
    <section class="cb-panel-section">
        <h3 class="cb-panel-section-title">几何体 Geometry</h3>

        <div class="selector-shell">
            <t-radio-group v-model="currentGeometry" variant="default-filled" size="small" class="selector-group">
                <t-radio-button v-for="option in optionsWithIcons" :key="option.value" :value="option.value">
                    {{ option.label }}
                </t-radio-button>
            </t-radio-group>
        </div>

        <p class="cb-panel-note">点击切换盒子、球体、圆锥和甜甜圈，观察同一光照下不同几何结构的轮廓差异。</p>
    </section>
</template>

<style scoped>
.selector-shell {
    padding: 4px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    background: rgba(2, 6, 23, 0.38);
}

:deep(.selector-group) {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
}

:deep(.selector-group .t-radio-button) {
    margin: 0;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: #94a3b8;
    min-height: 38px;
    transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
}

:deep(.selector-group .t-radio-button:hover) {
    transform: translateY(-1px);
    background: rgba(15, 23, 42, 0.7);
    color: #f8fafc;
}

:deep(.selector-group .t-radio-button.t-is-checked) {
    background: rgba(15, 23, 42, 0.9);
    color: #f8fafc;
    box-shadow: 0 0 0 1px rgba(103, 232, 249, 0.18), 0 14px 28px rgba(8, 47, 73, 0.22);
}
</style>
