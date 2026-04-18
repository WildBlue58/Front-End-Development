<script setup lang="ts">
import { useSceneState } from "../../../composables/useSceneState";
import { PlayCircleIcon, PauseCircleIcon } from "tdesign-icons-vue-next";

const { isAnimating } = useSceneState();
</script>

<template>
    <section class="cb-panel-section">
        <h3 class="cb-panel-section-title">旋转动画</h3>

        <div class="toggle-shell cb-toggle-row">
            <div class="switch-label">
                <PauseCircleIcon v-if="!isAnimating" class="status-icon paused" />
                <PlayCircleIcon v-else class="status-icon playing" />
                <div>
                    <strong>{{ isAnimating ? "旋转中" : "已暂停" }}</strong>
                    <p>{{ isAnimating ? "沿 Y 轴持续自转" : "停留在当前姿态" }}</p>
                </div>
            </div>
            <t-switch v-model="isAnimating" size="large" />
        </div>

        <p class="cb-panel-note">开启后物体将持续旋转，适合观察材质受光和造型轮廓的变化。</p>
    </section>
</template>

<style scoped>
.toggle-shell {
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    background: rgba(2, 6, 23, 0.38);
}

.switch-label {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #e2e8f0;
}

.switch-label strong {
    display: block;
    color: #f8fafc;
    font-size: 13px;
}

.switch-label p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 12px;
}

.status-icon {
    font-size: 18px;
    flex-shrink: 0;
}

.status-icon.paused {
    color: #64748b;
}

.status-icon.playing {
    color: #42b883;
}

:deep(.t-switch) {
    --td-brand-color: #38bdf8;
}
</style>
