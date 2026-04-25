<script setup lang="ts">
import { computed } from "vue";
import { useProductShowcaseState } from "../../composables/useProductShowcaseState";

const { state, currentVariant, currentHotspot, degradeSummary } = useProductShowcaseState();

const cards = computed(() => [
    { label: "Mode", value: state.renderMode },
    { label: "Variant", value: currentVariant.value.label },
    { label: "Color", value: state.currentColor },
    { label: "Bloom", value: state.bloom ? "on" : "off" },
    { label: "Focus", value: state.focusLabel },
]);
</script>

<template>
    <aside class="showcase-hud">
        <div class="hud-header">
            <div>
                <p class="eyebrow">Product HUD</p>
                <h3>状态与热点反馈</h3>
            </div>
            <span class="hud-glow"></span>
        </div>
        <div class="hud-grid">
            <div v-for="item in cards" :key="item.label" class="hud-card">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
            </div>
        </div>
        <div class="status-note accent">
            <span>当前说明</span>
            <strong>{{ state.statusMessage }}</strong>
            <small>{{ currentHotspot?.copy ?? degradeSummary }}</small>
        </div>
    </aside>
</template>

<style scoped>
.showcase-hud { position: absolute; left: 20px; bottom: 20px; z-index: 24; width: min(360px, calc(100vw - 420px)); padding: 16px; border-radius: 22px; border: 1px solid rgba(56, 189, 248, 0.16); background: rgba(2, 6, 23, 0.76); box-shadow: 0 20px 70px rgba(2, 6, 23, 0.56), inset 0 1px 0 rgba(255, 255, 255, 0.05); backdrop-filter: blur(14px); color: #dbeafe; display: grid; gap: 12px; }
.hud-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.eyebrow,.hud-card span,.status-note span { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #7dd3fc; }
.hud-header h3 { margin: 0; font-size: 18px; color: #f8fafc; }
.hud-glow { width: 12px; height: 12px; border-radius: 999px; background: #38bdf8; box-shadow: 0 0 18px rgba(56, 189, 248, 0.9); }
.hud-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.hud-card,.status-note { border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.1); background: rgba(15, 23, 42, 0.58); }
.hud-card { padding: 12px; display: grid; gap: 6px; }
.hud-card strong,.status-note strong { color: #f8fafc; word-break: break-word; }
.status-note { padding: 12px 14px; display: grid; gap: 6px; }
.status-note.accent strong { color: #a5f3fc; }
.status-note small { color: #94a3b8; font-size: 12px; line-height: 1.65; }
@media (max-width: 980px) { .showcase-hud { width: min(420px, calc(100vw - 32px)); } }
@media (max-width: 768px) { .showcase-hud { left: 16px; right: 16px; bottom: 16px; width: auto; } .hud-grid { grid-template-columns: 1fr; } }
</style>
