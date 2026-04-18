<script setup lang="ts">
import { useSceneState } from "../../../composables/useSceneState";
import {
    CircleIcon,
    LayersIcon,
    PlayCircleIcon,
    LightbulbIcon,
    ViewListIcon,
} from "tdesign-icons-vue-next";

const { geometryLabel, showMultiple, isAnimating, materialLabel, cameraFov } = useSceneState();
</script>

<template>
    <section class="cb-panel-section status-card">
        <h3 class="cb-panel-section-title">当前状态</h3>

        <div class="status-list">
            <div class="status-item">
                <div class="item-icon">
                    <CircleIcon />
                </div>
                <div class="item-content">
                    <span class="item-label">几何体</span>
                    <strong class="item-value">{{ geometryLabel }}</strong>
                </div>
            </div>

            <div class="status-item">
                <div class="item-icon">
                    <LayersIcon />
                </div>
                <div class="item-content">
                    <span class="item-label">物体数</span>
                    <strong class="item-value">{{ showMultiple ? 3 : 1 }}</strong>
                </div>
            </div>

            <div class="status-item">
                <div class="item-icon" :class="{ active: isAnimating }">
                    <PlayCircleIcon />
                </div>
                <div class="item-content">
                    <span class="item-label">动画</span>
                    <strong class="item-value" :class="{ active: isAnimating }">
                        {{ isAnimating ? "旋转中" : "静止" }}
                    </strong>
                </div>
            </div>

            <div class="status-item">
                <div class="item-icon">
                    <LightbulbIcon />
                </div>
                <div class="item-content">
                    <span class="item-label">材质</span>
                    <strong class="item-value">{{ materialLabel }}</strong>
                </div>
            </div>

            <div class="status-item">
                <div class="item-icon">
                    <ViewListIcon />
                </div>
                <div class="item-content">
                    <span class="item-label">FOV</span>
                    <strong class="item-value">{{ cameraFov }}°</strong>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.status-list {
    display: grid;
    gap: 10px;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.1);
    background: rgba(2, 6, 23, 0.38);
}

.item-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 12px;
    background: rgba(56, 189, 248, 0.12);
    color: #7dd3fc;
    flex-shrink: 0;
}

.item-icon.active {
    background: rgba(66, 184, 131, 0.18);
    color: #86efac;
}

.item-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex: 1;
}

.item-label {
    color: #94a3b8;
    font-size: 12px;
}

.item-value {
    color: #f8fafc;
    font-size: 12px;
}

.item-value.active {
    color: #86efac;
}
</style>
