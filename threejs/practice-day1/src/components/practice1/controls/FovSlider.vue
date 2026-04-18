<script setup lang="ts">
import { useSceneState } from "../../../composables/useSceneState";

const { cameraFov } = useSceneState();

const marks = {
    20: "20°",
    45: "45°",
    75: "75°",
    100: "100°",
    120: "120°",
};
</script>

<template>
    <section class="cb-panel-section">
        <h3 class="cb-panel-section-title">相机视场 FOV</h3>

        <div class="slider-shell">
            <t-slider v-model="cameraFov" :min="20" :max="120" :step="1" :marks="marks" show-step />
        </div>

        <div class="fov-display">
            <span class="fov-label">当前视场角</span>
            <strong class="fov-value">{{ cameraFov }}°</strong>
        </div>

        <p class="cb-panel-note">20° 更接近长焦，75° 是自然观察视角，120° 则会产生明显的广角拉伸。</p>
    </section>
</template>

<style scoped>
.slider-shell {
    padding: 10px 12px 8px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    background: rgba(2, 6, 23, 0.38);
}

.fov-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    background: rgba(2, 6, 23, 0.38);
}

.fov-label {
    color: #94a3b8;
    font-size: 12px;
}

.fov-value {
    color: #a5f3fc;
    font-size: 16px;
}

:deep(.t-slider) {
    --td-brand-color: #38bdf8;
}

:deep(.t-slider__rail) {
    background: rgba(56, 189, 248, 0.12);
}

:deep(.t-slider__track) {
    background: linear-gradient(90deg, rgba(56, 189, 248, 0.72), rgba(66, 184, 131, 0.78));
}

:deep(.t-slider__button) {
    box-shadow: 0 0 0 2px #020617, 0 0 18px rgba(56, 189, 248, 0.38);
}

:deep(.t-slider__mark-text) {
    color: #64748b;
    font-size: 10px;
}
</style>
