<script setup lang="ts">
import { computed } from "vue";
import { TresCanvas } from "@tresjs/core";
import { OrbitControls } from "@tresjs/cientos";
import WaveSurface from "./WaveSurface.vue";
import HudPanelSurface from "./HudPanelSurface.vue";
import { useWaveShaderState } from "../../composables/useWaveShaderState";

const {
    preset,
    materialMode,
    amplitude,
    frequency,
    speed,
    fresnelPower,
    scanStrength,
    rippleStrength,
    rippleRadius,
    normalDetailStrength,
    hudIntensity,
    colorA,
    colorB,
    wireframe,
    interactiveRipple,
    normalDetailEnabled,
    hudBackgroundEnabled,
    planeSize,
    planeSegments,
    activePreset,
    gradientPreview,
    materialModeLabel,
    surfaceStats,
} = useWaveShaderState();

const gradientStyle = computed(() => ({
    background: gradientPreview.value,
}));

const modeLabel = computed(() => `${materialModeLabel.value}${wireframe.value ? " · 线框" : ""}`);

const capabilityChips = computed(() => [
    interactiveRipple.value ? "鼠标扰动在线" : "鼠标扰动关闭",
    normalDetailEnabled.value ? "贴图细节混合中" : "仅程序噪声",
    hudBackgroundEnabled.value ? "HUD 背景已投射" : "HUD 背景隐藏",
]);

const rawHint = computed(() =>
    materialMode.value === "raw"
        ? "Raw 模式下显式声明 position / normal / uv / modelViewMatrix / projectionMatrix / cameraPosition。"
        : "ShaderMaterial 模式由 Three.js 自动注入常用内置变量，更适合快速验证视觉算法。",
);
</script>

<template>
    <div class="wave-scene">
        <TresCanvas clear-color="#050816" window-size>
            <TresPerspectiveCamera :position="[0, 1.8, 4.8]" :look-at="[0, 0, 0]" :fov="48" />
            <OrbitControls :enable-damping="true" :damping-factor="0.05" :min-distance="2.2" :max-distance="9.5" />

            <WaveSurface
                :amplitude="amplitude"
                :frequency="frequency"
                :speed="speed"
                :fresnel-power="fresnelPower"
                :scan-strength="scanStrength"
                :color-a="colorA"
                :color-b="colorB"
                :wireframe="wireframe"
                :preset="preset"
                :material-mode="materialMode"
                :ripple-strength="rippleStrength"
                :ripple-radius="rippleRadius"
                :normal-detail-strength="normalDetailStrength"
                :interactive-ripple="interactiveRipple"
                :normal-detail-enabled="normalDetailEnabled"
                :plane-size="planeSize"
                :plane-segments="planeSegments"
            />

            <HudPanelSurface
                v-if="hudBackgroundEnabled"
                :color-a="colorA"
                :color-b="colorB"
                :preset="preset"
                :material-mode="materialMode"
                :hud-intensity="hudIntensity"
                :speed="speed"
            />

            <TresMesh :position="[0, 1.15, -1.35]">
                <TresSphereGeometry :args="[0.36, 48, 48]" />
                <TresMeshStandardMaterial color="#ffffff" emissive="#60a5fa" :emissive-intensity="1.18" />
            </TresMesh>

            <TresAmbientLight :intensity="0.35" />
            <TresDirectionalLight :position="[3, 5, 2]" :intensity="1.2" color="#ffffff" />
            <TresPointLight :position="[-2, 1, 2]" color="#38bdf8" :intensity="6" :distance="10" />
            <TresPointLight :position="[2.4, 1.8, -1]" color="#42b883" :intensity="3.8" :distance="9" />
        </TresCanvas>

        <div class="scene-hud">
            <div class="hud-header">
                <div>
                    <p class="eyebrow">Day 4 · Shader Lab</p>
                    <h2>{{ activePreset.label }} · 波浪实验台</h2>
                </div>
                <span class="mode-pill">{{ modeLabel }}</span>
            </div>

            <p class="hud-desc">
                {{ activePreset.summary }} {{ activePreset.description }} 当前页面同时展示主波浪材质与 2D HUD 材质，让你直接对照顶点形变和面板渲染的差异。
            </p>

            <div class="hud-gradient">
                <span>当前渐变</span>
                <div class="gradient-bar" :style="gradientStyle"></div>
            </div>

            <div class="chip-row">
                <span v-for="chip in capabilityChips" :key="chip" class="chip">{{ chip }}</span>
            </div>

            <div class="hud-note">
                <strong>渲染说明</strong>
                <p>{{ rawHint }}</p>
            </div>

            <div class="hud-stats">
                <div v-for="item in surfaceStats" :key="item.label" class="stat-card">
                    <span class="stat-label">{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.wave-scene {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 28%),
        radial-gradient(circle at top right, rgba(66, 184, 131, 0.12), transparent 24%),
        linear-gradient(180deg, #050816 0%, #091120 58%, #030712 100%);
}

.scene-hud {
    position: absolute;
    top: 18px;
    left: 20px;
    z-index: 20;
    width: min(468px, calc(100vw - 390px));
    padding: 18px 20px;
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 24px;
    background: rgba(7, 12, 28, 0.64);
    backdrop-filter: blur(18px);
    box-shadow: 0 24px 80px rgba(2, 6, 23, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
    font-family: "PingFang SC", "Segoe UI", sans-serif;
}

.hud-header,
.hud-stats,
.chip-row {
    display: flex;
    gap: 10px;
}

.hud-header {
    justify-content: space-between;
    align-items: flex-start;
}

.eyebrow,
.hud-gradient span,
.stat-label {
    margin: 0 0 6px;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #67e8f9;
}

.hud-header h2 {
    margin: 0;
    font-size: 28px;
    line-height: 1.1;
    color: #f8fafc;
}

.mode-pill,
.chip {
    border-radius: 999px;
    font-size: 12px;
    white-space: nowrap;
}

.mode-pill {
    padding: 8px 12px;
    border: 1px solid rgba(56, 189, 248, 0.28);
    background: rgba(56, 189, 248, 0.12);
    color: #a5f3fc;
}

.hud-desc,
.hud-note p {
    margin: 14px 0 16px;
    font-size: 13px;
    line-height: 1.7;
    color: #94a3b8;
}

.hud-gradient,
.hud-note {
    display: grid;
    gap: 8px;
    margin-bottom: 14px;
}

.gradient-bar {
    height: 14px;
    border-radius: 999px;
    box-shadow: 0 0 24px rgba(56, 189, 248, 0.18);
}

.chip-row {
    flex-wrap: wrap;
    margin-bottom: 14px;
}

.chip {
    padding: 7px 12px;
    border: 1px solid rgba(148, 163, 184, 0.14);
    background: rgba(15, 23, 42, 0.62);
    color: #cbd5e1;
}

.hud-note {
    padding: 14px;
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    background: rgba(15, 23, 42, 0.52);
}

.hud-note strong,
.stat-card strong {
    color: #f8fafc;
}

.hud-note p {
    margin: 0;
}

.hud-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat-card {
    padding: 12px;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.58);
    border: 1px solid rgba(148, 163, 184, 0.14);
    display: grid;
    gap: 6px;
}

@media (max-width: 1100px) {
    .scene-hud {
        width: min(420px, calc(100vw - 32px));
    }
}

@media (max-width: 768px) {
    .scene-hud {
        width: calc(100vw - 32px);
        top: 12px;
        left: 16px;
        padding: 16px;
    }

    .hud-header {
        flex-direction: column;
    }

    .hud-stats {
        grid-template-columns: 1fr;
    }
}
</style>
