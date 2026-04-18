<script setup lang="ts">
import { computed } from "vue";
import { useWaveShaderState } from "../../composables/useWaveShaderState";
import type { WaveMaterialMode, WavePresetKey } from "../../composables/useWaveShaderState";

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
    activePreset,
    gradientPreview,
    wavePresetDefinitions,
    applyPreset,
} = useWaveShaderState();

const previewStyle = computed(() => ({ background: gradientPreview.value }));
const materialModes: Array<{ key: WaveMaterialMode; label: string; desc: string }> = [
    { key: "shader", label: "ShaderMaterial", desc: "适合快速验证视觉算法" },
    { key: "raw", label: "RawShaderMaterial", desc: "显式声明 attribute / uniform" },
];

function setPreset(nextPreset: WavePresetKey) {
    applyPreset(nextPreset);
}
</script>

<template>
    <aside class="wave-panel cb-control-panel cb-control-panel--absolute">
        <div class="cb-panel-header">
            <div>
                <p class="cb-panel-eyebrow">Realtime Shader Console</p>
                <h2 class="cb-panel-title">Day 4 高级控制台</h2>
            </div>
            <div class="cb-panel-glow"></div>
        </div>

        <p class="cb-panel-copy">
            当前已进入 <strong>{{ activePreset.label }}</strong> 预设。你可以在这里同时控制顶点形变、材质模式、贴图细节与 HUD 背景，直接观察每类参数怎样作用到 GPU 输出。
        </p>

        <section class="cb-panel-section">
            <div class="cb-panel-section-title">Shader 预设</div>
            <div class="preset-grid cb-panel-grid cb-panel-grid--2">
                <button
                    v-for="item in wavePresetDefinitions"
                    :key="item.key"
                    type="button"
                    class="preset-card cb-panel-option-card"
                    :class="{ active: preset === item.key }"
                    @click="setPreset(item.key)"
                >
                    <span class="preset-accent" :style="{ background: item.accent }"></span>
                    <strong>{{ item.label }}</strong>
                    <small>{{ item.summary }}</small>
                </button>
            </div>
        </section>

        <section class="cb-panel-section">
            <div class="cb-panel-section-title">渲染模式</div>
            <div class="mode-grid cb-panel-grid cb-panel-grid--2">
                <button
                    v-for="item in materialModes"
                    :key="item.key"
                    type="button"
                    class="mode-card cb-panel-option-card"
                    :class="{ active: materialMode === item.key }"
                    @click="materialMode = item.key"
                >
                    <strong>{{ item.label }}</strong>
                    <small>{{ item.desc }}</small>
                </button>
            </div>
            <label class="toggle-row cb-toggle-row cb-toggle-row--compact">
                <div>
                    <strong>线框调试</strong>
                    <small>显示高分段平面结构，便于观察顶点密度与 Raw 模式差异。</small>
                </div>
                <input v-model="wireframe" type="checkbox" class="cb-panel-checkbox" />
            </label>
        </section>

        <section class="cb-panel-section">
            <div class="cb-panel-section-title">波浪运动</div>
            <label class="control-item cb-panel-item">
                <div class="control-head cb-control-head"><span>波浪振幅</span><strong>{{ amplitude.toFixed(2) }}</strong></div>
                <input v-model.number="amplitude" type="range" min="0" max="0.8" step="0.01" class="cb-panel-range" />
            </label>
            <label class="control-item cb-panel-item">
                <div class="control-head cb-control-head"><span>波浪频率</span><strong>{{ frequency.toFixed(1) }}</strong></div>
                <input v-model.number="frequency" type="range" min="0.5" max="6" step="0.1" class="cb-panel-range" />
            </label>
            <label class="control-item cb-panel-item">
                <div class="control-head cb-control-head"><span>动画速度</span><strong>{{ speed.toFixed(2) }}</strong></div>
                <input v-model.number="speed" type="range" min="0.2" max="4" step="0.05" class="cb-panel-range" />
            </label>
        </section>

        <section class="cb-panel-section">
            <div class="cb-panel-section-title">材质与细节</div>
            <label class="control-item cb-panel-item">
                <div class="control-head cb-control-head"><span>菲涅尔强度</span><strong>{{ fresnelPower.toFixed(1) }}</strong></div>
                <input v-model.number="fresnelPower" type="range" min="0.5" max="8" step="0.1" class="cb-panel-range" />
            </label>
            <label class="control-item cb-panel-item">
                <div class="control-head cb-control-head"><span>扫描线强度</span><strong>{{ scanStrength.toFixed(2) }}</strong></div>
                <input v-model.number="scanStrength" type="range" min="0" max="0.8" step="0.01" class="cb-panel-range" />
            </label>
            <label class="control-item cb-panel-item">
                <div class="control-head cb-control-head"><span>贴图细节</span><strong>{{ normalDetailStrength.toFixed(2) }}</strong></div>
                <input v-model.number="normalDetailStrength" type="range" min="0" max="1" step="0.01" class="cb-panel-range" />
            </label>
            <label class="toggle-row cb-toggle-row cb-toggle-row--compact">
                <div>
                    <strong>法线贴图混合</strong>
                    <small>关闭后只保留程序噪声。</small>
                </div>
                <input v-model="normalDetailEnabled" type="checkbox" class="cb-panel-checkbox" />
            </label>
        </section>

        <section class="cb-panel-section">
            <div class="cb-panel-section-title">鼠标扰动</div>
            <label class="control-item cb-panel-item">
                <div class="control-head cb-control-head"><span>扰动强度</span><strong>{{ rippleStrength.toFixed(2) }}</strong></div>
                <input v-model.number="rippleStrength" type="range" min="0" max="0.8" step="0.01" class="cb-panel-range" />
            </label>
            <label class="control-item cb-panel-item">
                <div class="control-head cb-control-head"><span>扰动半径</span><strong>{{ rippleRadius.toFixed(2) }}</strong></div>
                <input v-model.number="rippleRadius" type="range" min="0.08" max="0.45" step="0.01" class="cb-panel-range" />
            </label>
            <label class="toggle-row cb-toggle-row cb-toggle-row--compact">
                <div>
                    <strong>启用鼠标涟漪</strong>
                    <small>移动到波浪面上时会产生额外能量波。</small>
                </div>
                <input v-model="interactiveRipple" type="checkbox" class="cb-panel-checkbox" />
            </label>
        </section>

        <section class="cb-panel-section">
            <div class="cb-panel-section-title">颜色与 HUD</div>
            <div class="color-grid cb-panel-grid cb-panel-grid--2">
                <label class="color-card cb-panel-color-card">
                    <span>颜色 A</span>
                    <input v-model="colorA" type="color" class="cb-panel-color-input" />
                    <code class="cb-panel-code">{{ colorA }}</code>
                </label>
                <label class="color-card cb-panel-color-card">
                    <span>颜色 B</span>
                    <input v-model="colorB" type="color" class="cb-panel-color-input" />
                    <code class="cb-panel-code">{{ colorB }}</code>
                </label>
            </div>
            <div class="gradient-preview">
                <div class="preview-bar" :style="previewStyle"></div>
                <span class="cb-panel-note">{{ activePreset.description }}</span>
            </div>
            <label class="control-item cb-panel-item">
                <div class="control-head cb-control-head"><span>HUD 强度</span><strong>{{ hudIntensity.toFixed(2) }}</strong></div>
                <input v-model.number="hudIntensity" type="range" min="0" max="1" step="0.01" class="cb-panel-range" />
            </label>
            <label class="toggle-row cb-toggle-row cb-toggle-row--compact">
                <div>
                    <strong>显示 HUD 背景</strong>
                    <small>保留扫描线、菲涅尔与噪声，去掉波浪形变。</small>
                </div>
                <input v-model="hudBackgroundEnabled" type="checkbox" class="cb-panel-checkbox" />
            </label>
        </section>
    </aside>
</template>

<style scoped>
.wave-panel {
    z-index: 40;
}

.preset-card,
.mode-card {
    text-align: left;
}

.preset-card strong,
.mode-card strong,
.toggle-row strong,
.cb-panel-copy strong {
    color: #f8fafc;
}

.preset-card small,
.mode-card small,
.toggle-row small {
    color: #64748b;
    font-size: 12px;
    line-height: 1.6;
}

.preset-accent {
    width: 34px;
    height: 4px;
    border-radius: 999px;
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.32);
}

.toggle-row {
    margin-top: 12px;
}

.gradient-preview {
    display: grid;
    gap: 8px;
    margin: 14px 0;
}

.preview-bar {
    height: 18px;
    border-radius: 999px;
    box-shadow: 0 0 24px rgba(56, 189, 248, 0.18);
}
</style>
