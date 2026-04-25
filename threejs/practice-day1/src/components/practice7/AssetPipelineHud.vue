<script setup lang="ts">
import { computed } from "vue";
import { useAssetPipelineState } from "../../composables/useAssetPipelineState";

const { state, statusBadge, pipelineSummary, currentTextureStrategy } = useAssetPipelineState();

const cards = computed(() => [
    { label: "状态", value: statusBadge.value },
    { label: "进度", value: `${state.loadingProgress}%` },
    { label: "路径", value: state.currentPath },
    { label: "错误", value: state.errorMessage || "无" },
]);

const diagnostics = computed(() => [
    { label: "版本摘要", value: pipelineSummary.value, accent: true },
    { label: "贴图策略", value: `${currentTextureStrategy.value.label} · ${currentTextureStrategy.value.copy}` },
    { label: "预检结果", value: `${state.summary.nodeCount} 节点 / ${state.summary.meshCount} Mesh / ${state.summary.materialCount} 材质 / ${state.summary.textureCount} 贴图` },
    { label: "动画状态", value: state.animation.clipNames.length ? `${state.animation.activeClip ?? state.animation.clipNames[0]} · ${state.animation.playing ? "播放中" : "已暂停"}` : "当前资源无动画，页面保持稳定" },
    { label: "发布链路", value: `${state.activeReleaseStage} · ${state.lastLoadedAt}` },
    { label: "实验提示", value: state.statusMessage },
]);
</script>

<template>
    <aside class="asset-pipeline-hud">
        <div class="hud-header">
            <div>
                <p class="eyebrow">Pipeline HUD</p>
                <h3>资源状态与验证镜像</h3>
            </div>
            <span class="hud-glow"></span>
        </div>

        <p class="hud-copy">HUD 持续同步 `状态 / 进度 / 路径 / 错误`，同时把资源预算、动画、发布链路和贴图策略统一映射到同一个可验证区域。</p>

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
        </div>
    </aside>
</template>

<style scoped>
.asset-pipeline-hud {
    position: absolute;
    left: 20px;
    top: calc(var(--practice7-intro-height, 336px) + 36px);
    z-index: 30;
    width: min(408px, calc(100vw - 408px));
    max-height: calc(100% - var(--practice7-intro-height, 336px) - 56px);
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    border-radius: 22px;
    border: 1px solid rgba(56, 189, 248, 0.16);
    background: rgba(2, 6, 23, 0.78);
    box-shadow: 0 20px 70px rgba(2, 6, 23, 0.56), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(14px);
    color: #dbeafe;
}
.asset-pipeline-hud::-webkit-scrollbar { width: 8px; }
.asset-pipeline-hud::-webkit-scrollbar-thumb { background: rgba(56, 189, 248, 0.45); border-radius: 999px; }
.hud-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.eyebrow,.hud-card span,.status-note span { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #7dd3fc; }
.hud-header h3 { margin: 0; font-size: 18px; color: #f8fafc; }
.hud-glow { width: 12px; height: 12px; border-radius: 999px; background: #38bdf8; box-shadow: 0 0 18px rgba(56, 189, 248, 0.9); }
.hud-copy { margin: 0; font-size: 12px; line-height: 1.65; color: #94a3b8; }
.hud-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.hud-card,.status-note { border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.1); background: rgba(15, 23, 42, 0.58); }
.hud-card { padding: 12px; display: grid; gap: 6px; }
.hud-card strong,.status-note strong { color: #f8fafc; word-break: break-word; }
.panel-stack { display: grid; gap: 10px; }
.status-note { padding: 12px 14px; display: grid; gap: 6px; }
.status-note.accent strong { color: #a5f3fc; }
@media (max-height: 760px) { .hud-copy { display: none; } }
@media (max-width: 980px) {
    .asset-pipeline-hud {
        width: min(420px, calc(100vw - 32px));
        top: calc(46vh + 26px);
        max-height: calc(100% - 46vh - 44px);
    }
}
@media (max-width: 768px) {
    .asset-pipeline-hud {
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
