<script setup lang="ts">
import {
    usePBRState,
    type PhysicalPreset,
    type HdrKey,
    type ChannelView,
} from "../../composables/usePBRState";

const {
    color,
    metalness,
    roughness,
    envMapIntensity,
    emissiveColor,
    emissiveIntensity,
    physicalPreset,
    applyPreset,
    useBasecolorMap,
    useRoughnessMap,
    useNormalMap,
    useAoMap,
    useHdr,
    normalScale,
    aoIntensity,
    viewMode,
    hdrFile,
    channelView,
} = usePBRState();

const presets: { value: PhysicalPreset; label: string; desc: string }[] = [
    { value: "clearcoat", label: "🚗 汽车漆", desc: "清漆 + 深红" },
    { value: "glass", label: "🔮 玻璃", desc: "全透射折射" },
    { value: "velvet", label: "🟣 天鹅绒", desc: "漫反射光泽" },
    { value: "gold", label: "🥇 黄金", desc: "高光泽金属" },
    { value: "chrome", label: "⚙️ 铬合金", desc: "镜面+虹彩" },
    { value: "rubber", label: "⚫ 橡胶", desc: "全哑光黑色" },
    { value: "frosted_glass", label: "🧊 磨砂玻璃", desc: "半透射磨砂" },
    { value: "fabric", label: "🧵 布料", desc: "光泽绒感" },
];

const hdrOptions: { value: HdrKey; label: string; desc: string }[] = [
    { value: "studio", label: "🎬 摄影棚", desc: "studio.hdr" },
    { value: "canary_wharf", label: "🏙️ 码头", desc: "canary_wharf" },
    { value: "lilienstein", label: "⛰️ 山景", desc: "lilienstein" },
    { value: "moonless_golf", label: "🌙 夜晚", desc: "moonless_golf" },
];

const textureToggles: {
    key: string;
    label: string;
    hint: string;
    state: ReturnType<typeof usePBRState>["useBasecolorMap"];
}[] = [
    {
        key: "basecolor",
        label: "BaseColor",
        hint: "基础颜色",
        state: useBasecolorMap,
    },
    {
        key: "roughness",
        label: "Roughness",
        hint: "粗糙度",
        state: useRoughnessMap,
    },
    { key: "normal", label: "Normal", hint: "法线凹凸", state: useNormalMap },
    { key: "ao", label: "AO", hint: "环境遮蔽", state: useAoMap },
    { key: "hdr", label: "HDR", hint: "环境贴图", state: useHdr },
];

const channelOptions: { value: ChannelView; label: string }[] = [
    { value: "none", label: "关闭" },
    { value: "basecolor", label: "BaseColor" },
    { value: "roughness", label: "Roughness" },
    { value: "normal", label: "Normal" },
    { value: "ao", label: "AO" },
];
</script>

<template>
    <div class="pbr-panel cb-control-panel cb-control-panel--absolute">
        <div class="cb-panel-header">
            <div>
                <p class="cb-panel-eyebrow">Material Lab Console</p>
                <h2 class="cb-panel-title">Day 3 PBR 材质控制台</h2>
            </div>
            <span class="cb-panel-glow"></span>
        </div>

        <p class="cb-panel-copy">在统一实验台里切换视图模式、材质预设、HDR 环境与贴图通道，直接比较 PBR 参数如何改变反射、高光和表面细节。</p>

        <div class="panel-body cb-panel-body">
            <section class="cb-panel-section">
                <div class="section-title cb-panel-section-title">视图模式</div>
                <div class="mode-grid cb-panel-grid cb-panel-grid--2">
                    <button class="mode-btn cb-panel-option-card" :class="{ active: viewMode === 'compare' }" @click="viewMode = 'compare'">
                        <span class="mode-icon">◑</span>
                        <span class="mode-name">对比模式</span>
                        <span class="mode-desc">Standard vs Physical</span>
                    </button>
                    <button class="mode-btn cb-panel-option-card" :class="{ active: viewMode === 'showcase' }" @click="viewMode = 'showcase'">
                        <span class="mode-icon">⬡⬡⬡⬡⬡</span>
                        <span class="mode-name">展台模式</span>
                        <span class="mode-desc">5 球 PBR 参数对比</span>
                    </button>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="section-title cb-panel-section-title">基础参数（两球共用）</div>

                <div class="row">
                    <label class="row-label">基础颜色</label>
                    <input type="color" v-model="color" class="color-input cb-panel-color-input" />
                    <code class="color-code cb-panel-code">{{ color }}</code>
                </div>

                <div class="row col">
                    <div class="row-header">
                        <label class="row-label">金属度 <span class="hint-text">(metalness)</span></label>
                        <span class="val">{{ metalness.toFixed(2) }}</span>
                    </div>
                    <input type="range" v-model.number="metalness" min="0" max="1" step="0.01" class="slider cb-panel-range" />
                    <div class="cb-panel-hint-row">
                        <span>非金属</span><span>全金属</span>
                    </div>
                </div>

                <div class="row col">
                    <div class="row-header">
                        <label class="row-label">粗糙度 <span class="hint-text">(roughness)</span></label>
                        <span class="val">{{ roughness.toFixed(2) }}</span>
                    </div>
                    <input type="range" v-model.number="roughness" min="0" max="1" step="0.01" class="slider cb-panel-range" />
                    <div class="cb-panel-hint-row">
                        <span>镜面</span><span>哑光</span>
                    </div>
                </div>

                <div class="row col">
                    <div class="row-header">
                        <label class="row-label">环境反射 <span class="hint-text">(envMapIntensity)</span></label>
                        <span class="val">{{ envMapIntensity.toFixed(2) }}</span>
                    </div>
                    <input type="range" v-model.number="envMapIntensity" min="0" max="3" step="0.05" class="slider cb-panel-range" />
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="section-title cb-panel-section-title">
                    <span class="badge badge-phys">右球</span>
                    材质预设（Physical）
                </div>
                <div class="preset-grid cb-panel-grid cb-panel-grid--2">
                    <button
                        v-for="p in presets"
                        :key="p.value"
                        class="preset-btn cb-panel-option-card"
                        :class="{ active: physicalPreset === p.value }"
                        @click="applyPreset(p.value)"
                    >
                        <span class="preset-label">{{ p.label }}</span>
                        <span class="preset-desc">{{ p.desc }}</span>
                    </button>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="section-title cb-panel-section-title">HDR 环境切换</div>
                <div class="hdr-grid cb-panel-grid cb-panel-grid--2">
                    <button
                        v-for="h in hdrOptions"
                        :key="h.value"
                        class="hdr-btn cb-panel-option-card"
                        :class="{ active: hdrFile === h.value }"
                        @click="hdrFile = h.value"
                    >
                        <span class="hdr-icon">{{ h.label.split(' ')[0] }}</span>
                        <div>
                            <div class="hdr-name">{{ h.label.split(' ').slice(1).join(' ') }}</div>
                            <div class="hdr-desc">{{ h.desc }}</div>
                        </div>
                    </button>
                </div>
                <div class="preset-tip cb-panel-note">切换时按需加载，已经加载过的环境贴图会被缓存。</div>
            </section>

            <section class="cb-panel-section">
                <div class="section-title cb-panel-section-title">贴图通道开关</div>

                <div class="map-grid cb-panel-grid cb-panel-grid--2">
                    <button
                        v-for="t in textureToggles"
                        :key="t.key"
                        class="map-btn cb-panel-option-card"
                        :class="{ active: t.state.value }"
                        @click="t.state.value = !t.state.value"
                    >
                        <span class="map-dot"></span>
                        <span class="map-name">{{ t.label }}</span>
                        <span class="map-hint">{{ t.hint }}</span>
                    </button>
                </div>

                <div class="row col extra-spacing" v-if="useNormalMap">
                    <div class="row-header">
                        <label class="row-label">法线强度 <span class="hint-text">(normalScale)</span></label>
                        <span class="val">{{ normalScale.toFixed(2) }}</span>
                    </div>
                    <input type="range" v-model.number="normalScale" min="0" max="3" step="0.05" class="slider cb-panel-range" />
                    <div class="cb-panel-hint-row">
                        <span>平整</span><span>强凹凸</span>
                    </div>
                </div>

                <div class="row col extra-spacing" v-if="useAoMap">
                    <div class="row-header">
                        <label class="row-label">AO 强度 <span class="hint-text">(aoMapIntensity)</span></label>
                        <span class="val">{{ aoIntensity.toFixed(2) }}</span>
                    </div>
                    <input type="range" v-model.number="aoIntensity" min="0" max="2" step="0.05" class="slider cb-panel-range" />
                    <div class="cb-panel-hint-row">
                        <span>无阴影</span><span>深阴影</span>
                    </div>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="section-title cb-panel-section-title">通道可视化（调试）</div>
                <div class="channel-grid">
                    <button
                        v-for="c in channelOptions"
                        :key="c.value"
                        class="channel-btn cb-panel-button"
                        :class="{ active: channelView === c.value }"
                        @click="channelView = c.value"
                    >
                        {{ c.label }}
                    </button>
                </div>
                <div class="preset-tip cb-panel-note" v-if="channelView !== 'none'">
                    当前仅显示 <strong>{{ channelView }}</strong> 通道原始数据（无光照）
                </div>
            </section>

            <section class="cb-panel-section" v-if="viewMode === 'compare'">
                <div class="section-title cb-panel-section-title">
                    <span class="badge badge-std">左球</span>
                    Standard · 自发光
                </div>

                <div class="row">
                    <label class="row-label">发光颜色</label>
                    <input type="color" v-model="emissiveColor" class="color-input cb-panel-color-input" />
                </div>

                <div class="row col">
                    <div class="row-header">
                        <label class="row-label">发光强度 <span class="hint-text">(emissiveIntensity)</span></label>
                        <span class="val">{{ emissiveIntensity.toFixed(2) }}</span>
                    </div>
                    <input type="range" v-model.number="emissiveIntensity" min="0" max="3" step="0.05" class="slider slider-emissive cb-panel-range" />
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.pbr-panel {
    z-index: 100;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 6px;
}

.badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 22px;
    padding: 0 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
}

.badge-std {
    background: rgba(99, 102, 241, 0.16);
    color: #c7d2fe;
}

.badge-phys {
    background: rgba(56, 189, 248, 0.14);
    color: #a5f3fc;
}

.mode-btn,
.preset-btn,
.hdr-btn,
.map-btn {
    text-align: left;
}

.mode-btn {
    align-items: center;
    justify-items: center;
    text-align: center;
}

.mode-icon {
    font-size: 16px;
}

.mode-name,
.preset-label,
.hdr-name,
.map-name {
    font-size: 12px;
    font-weight: 600;
}

.mode-desc,
.preset-desc,
.preset-tip,
.map-hint,
.hdr-desc,
.hint-text {
    color: #64748b;
    font-size: 11px;
    line-height: 1.6;
}

.row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.row + .row {
    margin-top: 12px;
}

.row.col {
    flex-direction: column;
    align-items: stretch;
}

.row-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.row-label {
    color: #cbd5e1;
    font-size: 12px;
}

.val {
    color: #a5f3fc;
    font-size: 13px;
    font-weight: 600;
}

.color-input {
    width: 78px;
    height: 42px;
    flex-shrink: 0;
}

.color-code {
    flex: 1;
    text-align: right;
}

.hdr-btn,
.map-btn {
    display: flex;
    align-items: center;
    gap: 8px;
}

.hdr-icon {
    font-size: 16px;
}

.map-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #334155;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.22);
    flex-shrink: 0;
}

.map-btn.active .map-dot {
    background: #38bdf8;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
}

.extra-spacing {
    margin-top: 12px;
}

.channel-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.channel-btn.active {
    border-color: rgba(245, 158, 11, 0.42);
    box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.18), 0 14px 28px rgba(120, 53, 15, 0.18);
    background: rgba(120, 53, 15, 0.34);
    color: #fde68a;
}

.channel-btn.active:first-child {
    border-color: rgba(148, 163, 184, 0.18);
    box-shadow: none;
    background: rgba(2, 6, 23, 0.38);
    color: #94a3b8;
}

.slider-emissive {
    background: rgba(245, 158, 11, 0.2);
}

.slider-emissive::-webkit-slider-thumb {
    background: #fbbf24;
}

.slider-emissive::-moz-range-thumb {
    background: #fbbf24;
}
</style>
