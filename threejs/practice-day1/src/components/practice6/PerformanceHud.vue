<script setup lang="ts">
import { computed } from "vue";
import { formatBytes, usePerformanceSceneState } from "../../composables/usePerformanceSceneState";

const {
    metrics,
    drawCallHint,
    fpsTone,
    viewportSummary,
    postProcessingSummary,
    renderModeSummary,
    textureSummary,
    cullingSummary,
    lodThresholdSummary,
    downgradeSummary,
    memorySummary,
} = usePerformanceSceneState();

const cards = computed(() => [
    { label: "FPS", value: metrics.fps },
    { label: "Frame", value: `${metrics.frameTime.toFixed(1)} ms` },
    { label: "Draw Calls", value: metrics.drawCalls },
    { label: "Triangles", value: metrics.triangles },
    { label: "Visible / Culled", value: `${metrics.visibleCount} / ${metrics.culledCount}` },
    { label: "Heap / Texture", value: `${metrics.jsHeapUsedMB == null ? "N/A" : `${metrics.jsHeapUsedMB.toFixed(1)} MB`} / ${formatBytes(metrics.textureEstimateBytes)}` },
]);

const diagnostics = computed(() => [
    { label: "渲染状态", value: `${metrics.fps} FPS · ${fpsTone.value}`, accent: true },
    { label: "渲染模式", value: renderModeSummary.value },
    { label: "LOD 档位", value: `${metrics.activeLod} · 距离 ${metrics.cameraDistance.toFixed(2)} · ${lodThresholdSummary.value}` },
    { label: "像素比 / 尺寸", value: viewportSummary.value },
    { label: "后处理链", value: postProcessingSummary.value },
    { label: "贴图方案", value: textureSummary.value },
    { label: "剔除收益", value: cullingSummary.value },
    { label: "设备策略", value: downgradeSummary.value },
    { label: "内存估算", value: memorySummary.value },
]);
</script>

<template>
    <aside class="performance-hud">
        <div class="hud-header">
            <div>
                <p class="eyebrow">Performance HUD</p>
                <h3>性能指标与诊断</h3>
            </div>
            <span class="hud-glow"></span>
        </div>

        <p class="hud-copy">现在 HUD 会持续同步 FPS、Draw Calls、可见/剔除数量、分辨率倍率、Pass 数、贴图估算和自动降级状态，方便你把 7 个扩展练习放进同一个监测面板里观察。</p>

        <div class="hud-grid">
            <div v-for="item in cards" :key="item.label" class="hud-card">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
            </div>
        </div>

        <div class="panel-stack">
            <div v-for="item in diagnostics" :key="item.label" class="status-note" :class="{ accent: item.accent }">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
            </div>
            <div class="status-note hint-card">
                <span>当前判断</span>
                <strong>{{ drawCallHint }}</strong>
                <small>{{ metrics.statusMessage }}</small>
            </div>
        </div>
    </aside>
</template>

<style scoped>
.performance-hud {
    position: absolute;
    left: 20px;
    top: calc(var(--practice6-intro-height, 320px) + 40px);
    z-index: 30;
    width: min(404px, calc(100vw - 404px));
    max-height: calc(100% - var(--practice6-intro-height, 320px) - 60px);
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
    scrollbar-width: thin;
    scrollbar-color: rgba(56, 189, 248, 0.45) rgba(15, 23, 42, 0.36);
}

.performance-hud::-webkit-scrollbar { width: 8px; }
.performance-hud::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.36); border-radius: 999px; }
.performance-hud::-webkit-scrollbar-thumb { background: rgba(56, 189, 248, 0.45); border-radius: 999px; }
.performance-hud::-webkit-scrollbar-thumb:hover { background: rgba(56, 189, 248, 0.62); }
.hud-header,.hud-grid { display: flex; gap: 10px; }
.hud-header { align-items: center; justify-content: space-between; }
.eyebrow,.hud-card span,.status-note span { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #7dd3fc; }
.hud-header h3 { margin: 0; font-size: 18px; color: #f8fafc; }
.hud-glow { width: 12px; height: 12px; border-radius: 999px; background: #38bdf8; box-shadow: 0 0 18px rgba(56, 189, 248, 0.9); }
.hud-copy,.status-note small { font-size: 12px; line-height: 1.65; color: #94a3b8; }
.hud-copy { margin: 0; }
.hud-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.hud-card,.status-note { border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.1); background: rgba(15, 23, 42, 0.58); }
.hud-card { padding: 12px; display: grid; gap: 6px; }
.hud-card strong,.status-note strong { color: #f8fafc; word-break: break-word; }
.panel-stack { display: grid; gap: 10px; }
.status-note { padding: 12px 14px; display: grid; gap: 6px; }
.status-note.accent strong,.hint-card strong { color: #a5f3fc; }
@media (max-height: 820px) {
    .performance-hud {
        gap: 12px;
    }

    .hud-copy {
        display: none;
    }
}
@media (max-height: 680px) {
    .performance-hud {
        top: calc(var(--practice6-intro-height, 320px) + 28px);
        max-height: calc(100% - var(--practice6-intro-height, 320px) - 44px);
    }
}
@media (max-width: 980px) {
    .performance-hud {
        width: min(420px, calc(100vw - 32px));
        top: calc(46vh + 28px);
        max-height: calc(100% - 46vh - 52px);
    }
}
@media (max-width: 768px) {
    .performance-hud {
        left: 16px;
        right: 16px;
        top: auto;
        bottom: 16px;
        width: auto;
        max-height: min(34vh, 320px);
    }
    .hud-grid { grid-template-columns: 1fr; }
}
</style>
