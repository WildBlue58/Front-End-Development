<script setup lang="ts">
import { computed } from "vue";
import { TresCanvas } from "@tresjs/core";
import { OrbitControls } from "@tresjs/cientos";
import InteractiveObjectGroup from "./InteractiveObjectGroup.vue";
import WaveSurface from "../practice4/WaveSurface.vue";
import { useInteractiveSceneState } from "../../composables/useInteractiveSceneState";

const { activeObject, hoveredObjectId, selectedCount, interactionCount, activePartHint, dragState, shaderPreviewState, statusText, statusBadge, updateDraggedObjectPosition, releaseDrag } = useInteractiveSceneState();

const controlsLocked = computed(() => dragState.active || Boolean(dragState.candidateId));
const stateCards = computed(() => [
    { label: "Active", value: activeObject.value?.label ?? "无" },
    { label: "Hover", value: hoveredObjectId.value ?? "无" },
    { label: "Targets", value: `${selectedCount.value}/3` },
    { label: "Events", value: String(interactionCount.value) },
]);
const chips = computed(() => [
    shaderPreviewState.value.enabled ? "Shader 预览在线" : "Shader 预览关闭",
    dragState.active ? "拖拽锁定相机" : "轨道控制可用",
    activePartHint.value ? `部位：${activePartHint.value.label}` : "等待部位拾取",
]);

function onGroundPointerMove(event: unknown) {
    const point = (event as { point?: { x: number; z: number } }).point;
    if (!point) return;
    updateDraggedObjectPosition(point.x, point.z);
}
</script>

<template>
    <div class="interactive-scene">
        <TresCanvas clear-color="#08111f" window-size shadows>
            <TresPerspectiveCamera :position="[0, 1.95, 6.4]" :look-at="[0, -0.2, 0]" :fov="42" />
            <OrbitControls :enabled="!controlsLocked" :enable-damping="true" :damping-factor="0.06" :min-distance="3.6" :max-distance="10.5" />

            <InteractiveObjectGroup />

            <TresGroup v-if="shaderPreviewState.enabled" :position="[4.2, 0.1, -4]" :rotation="[0.04, -0.7, 0]">
                <WaveSurface
                    :amplitude="shaderPreviewState.amplitude"
                    :frequency="shaderPreviewState.frequency"
                    :speed="shaderPreviewState.speed"
                    :fresnel-power="shaderPreviewState.fresnelPower"
                    :scan-strength="shaderPreviewState.scanStrength"
                    :color-a="shaderPreviewState.colorA"
                    :color-b="shaderPreviewState.colorB"
                    :wireframe="shaderPreviewState.wireframe"
                    :preset="shaderPreviewState.preset"
                    :material-mode="shaderPreviewState.materialMode"
                    :ripple-strength="shaderPreviewState.rippleStrength"
                    :ripple-radius="shaderPreviewState.rippleRadius"
                    :normal-detail-strength="shaderPreviewState.normalDetailStrength"
                    :interactive-ripple="shaderPreviewState.interactiveRipple"
                    :normal-detail-enabled="shaderPreviewState.normalDetailEnabled"
                    :plane-size="2.25"
                    :plane-segments="144"
                />
            </TresGroup>

            <TresMesh :rotation="[-Math.PI / 2, 0, 0]" :position="[0, -1.15, 0]" receive-shadow @pointermove="onGroundPointerMove" @pointerup="releaseDrag">

                <TresPlaneGeometry :args="[16, 16, 1, 1]" />
                <TresMeshStandardMaterial color="#111827" :roughness="0.95" :metalness="0.05" />
            </TresMesh>

            <TresMesh :rotation="[-Math.PI / 2, 0, 0]" :position="[0, -1.149, 0]">
                <TresRingGeometry :args="[4.4, 4.75, 120]" />
                <TresMeshBasicMaterial color="#164e63" transparent :opacity="0.18" />
            </TresMesh>

            <TresAmbientLight :intensity="0.62" />
            <TresDirectionalLight :position="[4, 6, 3]" :intensity="1.8" color="#ffffff" cast-shadow />
            <TresPointLight :position="[-3, 2.4, 2]" color="#38bdf8" :intensity="18" :distance="20" />
            <TresPointLight :position="[3.2, 1.6, -2.8]" color="#42b883" :intensity="8" :distance="14" />
            <TresPointLight v-if="activeObject" :position="[activeObject.position.x, activeObject.position.y + 1.8, activeObject.position.z + 0.6]" :color="activeObject.accent" :intensity="7" :distance="5" />
        </TresCanvas>

        <section class="scene-intro">
            <div class="intro-header">
                <div>
                    <p class="eyebrow">Day 5 · Multi-Object Reactive Workbench</p>
                    <h2>Vue 响应式 3D 交互工作台</h2>
                </div>
                <span class="status-pill">{{ statusBadge }}</span>
            </div>

            <p class="intro-copy">
                现在舞台上同时存在多个可编辑目标。右侧控制台会跟随当前对象切换独立参数，场景中的 Shader 预览则直接读取同一套状态，形成更完整的交互闭环。
            </p>

            <div class="status-banner">{{ statusText }}</div>

            <div class="chip-row">
                <span v-for="chip in chips" :key="chip" class="chip">{{ chip }}</span>
            </div>

            <div class="stats-grid">
                <div v-for="item in stateCards" :key="item.label" class="stat-card">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                </div>
            </div>

            <div v-if="activePartHint" class="part-card">
                <span>模型部位提示</span>
                <strong>{{ activePartHint.label }}</strong>
                <p>{{ activePartHint.hint }}</p>
            </div>
        </section>
    </div>
</template>

<style scoped>
.interactive-scene {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 28%),
        radial-gradient(circle at top right, rgba(66, 184, 131, 0.12), transparent 24%),
        linear-gradient(180deg, #08111f 0%, #091120 58%, #020617 100%);
}

.scene-intro {
    position: absolute;
    top: 18px;
    left: 20px;
    z-index: 20;
    width: min(560px, calc(100vw - 392px));
    max-height: clamp(220px, 38vh, 340px);
    overflow-y: auto;
    overflow-x: hidden;
    padding: 18px 20px;
    border-radius: 24px;
    border: 1px solid rgba(148, 163, 184, 0.16);
    background: rgba(7, 12, 28, 0.68);
    backdrop-filter: blur(18px);
    box-shadow: 0 24px 80px rgba(2, 6, 23, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
    font-family: "PingFang SC", "Segoe UI", sans-serif;
    scrollbar-width: thin;
    scrollbar-color: rgba(103, 232, 249, 0.45) rgba(15, 23, 42, 0.36);
}

.scene-intro::-webkit-scrollbar {
    width: 8px;
}

.scene-intro::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.36);
    border-radius: 999px;
}

.scene-intro::-webkit-scrollbar-thumb {
    background: rgba(103, 232, 249, 0.45);
    border-radius: 999px;
}

.scene-intro::-webkit-scrollbar-thumb:hover {
    background: rgba(103, 232, 249, 0.62);
}

.scene-intro::after {
    content: "";
    position: sticky;
    left: 0;
    right: 0;
    bottom: -18px;
    display: block;
    height: 18px;
    margin-top: -18px;
    background: linear-gradient(180deg, rgba(7, 12, 28, 0), rgba(7, 12, 28, 0.94));
    pointer-events: none;
}

.scene-intro > * {
    position: relative;
    z-index: 1;
}


.intro-header,
.stats-grid,
.chip-row {
    display: flex;
    gap: 10px;
}

.intro-header {
    justify-content: space-between;
    align-items: flex-start;
}

.eyebrow,
.stat-card span,
.part-card span {
    margin: 0 0 6px;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #67e8f9;
}

.intro-header h2 {
    margin: 0;
    font-size: 28px;
    line-height: 1.1;
    color: #f8fafc;
}

.status-pill,
.chip {
    border-radius: 999px;
    font-size: 12px;
    white-space: nowrap;
}

.status-pill {
    padding: 8px 12px;
    border: 1px solid rgba(56, 189, 248, 0.26);
    background: rgba(56, 189, 248, 0.1);
    color: #a5f3fc;
}

.intro-copy,
.status-banner,
.part-card p {
    margin-top: 14px;
    font-size: 13px;
    line-height: 1.7;
}

.intro-copy {
    color: #94a3b8;
}

.status-banner,
.part-card {
    padding: 12px 14px;
    border-radius: 18px;
    border: 1px solid rgba(125, 211, 252, 0.14);
    background: rgba(15, 23, 42, 0.58);
    color: #dbeafe;
}

.chip-row {
    flex-wrap: wrap;
    margin-top: 14px;
}

.chip {
    padding: 7px 12px;
    border: 1px solid rgba(56, 189, 248, 0.18);
    background: rgba(56, 189, 248, 0.08);
    color: #a5f3fc;
}

.stats-grid {
    margin-top: 14px;
}

.stat-card,
.part-card {
    flex: 1;
    display: grid;
    gap: 6px;
}

.stat-card {
    padding: 12px 14px;
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    background: rgba(15, 23, 42, 0.58);
}

.stat-card strong,
.part-card strong {
    color: #f8fafc;
    font-size: 14px;
    word-break: break-word;
}

.part-card {
    margin-top: 14px;
}

.part-card p {
    margin: 0;
    color: #cbd5e1;
}

@media (max-height: 820px) {
    .scene-intro {
        max-height: clamp(200px, 34vh, 300px);
    }
}

@media (max-height: 720px) {
    .intro-copy,
    .chip-row {
        display: none;
    }
}

@media (max-height: 620px) {
    .part-card {
        display: none;
    }
}

@media (max-width: 1100px) {
    .scene-intro {
        width: min(500px, calc(100vw - 32px));
    }
}


@media (max-width: 768px) {
    .scene-intro {
        top: 12px;
        left: 16px;
        width: calc(100vw - 32px);
        padding: 16px;
    }

    .intro-header,
    .stats-grid {
        flex-direction: column;
    }
}
</style>

