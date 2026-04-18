<script setup lang="ts">
import { computed } from "vue";
import { useInteractiveSceneState } from "../../composables/useInteractiveSceneState";

const { activeObject, hoveredObjectId, activePartHint, interactionCount, timeline, shaderState, storageLabel, statusText } = useInteractiveSceneState();

const cards = computed(() => [
    { label: "Focused", value: activeObject.value?.label ?? "无" },
    { label: "Hovered", value: hoveredObjectId.value ?? "无" },
    { label: "事件计数", value: String(interactionCount.value) },
    { label: "Shader", value: shaderState.enabled ? "联动中" : "已关闭" },
]);
const timelineItems = computed(() => timeline.value.slice(0, 8));
const shaderSummary = computed(() => `${shaderState.preset} / ${shaderState.materialMode} / ${shaderState.syncActiveColor ? "跟随主色" : "自定义双色"}`);
</script>

<template>
    <aside class="scene-hud">
        <div class="hud-header">
            <div>
                <p class="eyebrow">State Mirror HUD</p>
                <h3>交互状态与时间轴</h3>
            </div>
            <span class="hud-glow"></span>
        </div>

        <p class="hud-copy">这里读取与场景和控制台相同的状态源，所以对象切换、拖拽、部位点击和 Shader 联动都会实时同步。</p>

        <div class="hud-grid">
            <div v-for="item in cards" :key="item.label" class="hud-card">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
            </div>
        </div>

        <div class="panel-stack">
            <div class="status-note">
                <span>当前状态</span>
                <strong>{{ statusText }}</strong>
            </div>
            <div class="status-note accent">
                <span>Shader 摘要</span>
                <strong>{{ shaderSummary }}</strong>
                <small>{{ storageLabel }}</small>
            </div>
            <div v-if="activePartHint" class="status-note part-hit">
                <span>模型部位命中</span>
                <strong>{{ activePartHint.label }}</strong>
                <small>{{ activePartHint.hint }}</small>
            </div>
        </div>

        <section class="timeline-panel">
            <div class="timeline-head">
                <span>事件时间轴</span>
                <strong>{{ timelineItems.length }} 条</strong>
            </div>
            <div class="timeline-list">
                <div v-for="item in timelineItems" :key="item.id" class="timeline-item" :class="item.tone">
                    <div class="timeline-dot"></div>
                    <div>
                        <strong>{{ item.message }}</strong>
                        <small>{{ new Date(item.timestamp).toLocaleTimeString() }}</small>
                    </div>
                </div>
                <p v-if="!timelineItems.length" class="empty-state">交互日志会在 hover、select、drag、preset change 和 part hit 时自动出现。</p>
            </div>
        </section>
    </aside>
</template>

<style scoped>
.scene-hud {
    position: absolute;
    left: 20px;
    top: calc(var(--practice5-intro-height, 300px) + 32px);
    z-index: 30;
    width: min(390px, calc(100vw - 392px));
    max-height: calc(100% - var(--practice5-intro-height, 300px) - 52px);
    padding: 16px;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 14px;
    border-radius: 22px;
    border: 1px solid rgba(56, 189, 248, 0.16);
    background: rgba(2, 6, 23, 0.76);
    box-shadow: 0 20px 70px rgba(2, 6, 23, 0.56), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(14px);
    color: #dbeafe;
    font-family: "PingFang SC", "Segoe UI", sans-serif;
    scrollbar-width: thin;
    scrollbar-color: rgba(56, 189, 248, 0.45) rgba(15, 23, 42, 0.36);
}

.scene-hud::-webkit-scrollbar {
    width: 8px;
}

.scene-hud::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.36);
    border-radius: 999px;
}

.scene-hud::-webkit-scrollbar-thumb {
    background: rgba(56, 189, 248, 0.45);
    border-radius: 999px;
}

.scene-hud::-webkit-scrollbar-thumb:hover {
    background: rgba(56, 189, 248, 0.62);
}


.hud-header,
.timeline-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.eyebrow,
.hud-card span,
.status-note span,
.timeline-head span {
    margin: 0 0 6px;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #7dd3fc;
}

.hud-header h3 {
    margin: 0;
    font-size: 18px;
    color: #f8fafc;
}

.hud-glow {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: #38bdf8;
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.9);
}

.hud-copy,
.status-note small,
.timeline-item small,
.empty-state {
    font-size: 12px;
    line-height: 1.65;
    color: #94a3b8;
}

.hud-copy {
    margin: 0;
}

.hud-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.hud-card,
.status-note,
.timeline-item {
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.1);
    background: rgba(15, 23, 42, 0.58);
}

.hud-card {
    padding: 12px;
    display: grid;
    gap: 6px;
}

.hud-card strong,
.status-note strong,
.timeline-head strong,
.timeline-item strong {
    color: #f8fafc;
    word-break: break-word;
}

.panel-stack {
    display: grid;
    gap: 10px;
}

.status-note {
    padding: 12px 14px;
    display: grid;
    gap: 6px;
}

.status-note.accent strong {
    color: #a5f3fc;
}

.status-note.part-hit strong {
    color: #f59e0b;
}

.timeline-panel {
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
    gap: 10px;
}

.timeline-list {
    display: grid;
    gap: 10px;
    min-height: 0;
    overflow-y: auto;
    padding-right: 4px;
}

.timeline-item {
    display: flex;
    gap: 10px;
    padding: 12px;
}

.timeline-dot {
    width: 8px;
    height: 8px;
    margin-top: 6px;
    border-radius: 999px;
    background: #38bdf8;
    box-shadow: 0 0 14px rgba(56, 189, 248, 0.4);
    flex-shrink: 0;
}

.timeline-item.accent .timeline-dot {
    background: #f59e0b;
    box-shadow: 0 0 14px rgba(245, 158, 11, 0.4);
}

.timeline-item.warning .timeline-dot {
    background: #fb7185;
    box-shadow: 0 0 14px rgba(251, 113, 133, 0.4);
}

.timeline-item > div {
    display: grid;
    gap: 4px;
}

.empty-state {
    margin: 0;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px dashed rgba(148, 163, 184, 0.18);
}

@media (max-width: 980px) {
    .scene-hud {
        width: min(420px, calc(100vw - 32px));
    }
}

@media (max-height: 820px) {
    .scene-hud {
        gap: 12px;
    }

    .hud-copy {
        display: none;
    }
}

@media (max-width: 768px) {
    .scene-hud {
        left: 16px;
        right: 16px;
        top: auto;
        bottom: 16px;
        width: auto;
        max-height: min(54vh, 460px);
    }

    .hud-grid {
        grid-template-columns: 1fr;
    }
}
</style>

