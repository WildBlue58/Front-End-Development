<script setup lang="ts">
import { computed } from "vue";
import {
    meshSafeCap,
    performanceDeviceTierLabels,
    performanceRenderModes,
    performanceTextureProfileMap,
    usePerformanceSceneState,
    type PerformanceLodThresholds,
    type PerformanceRenderMode,
    type PerformanceTextureProfile,
} from "../../composables/usePerformanceSceneState";

const {
    controls,
    metrics,
    drawCallHint,
    bloomSummary,
    postProcessingSummary,
    cullingSummary,
    lodThresholdSummary,
    downgradeSummary,
    patchPerformanceControls,
    setLodThreshold,
    restoreHighQualityExperiment,
    setPerformanceStatus,
} = usePerformanceSceneState();

const instancePresets = [600, 1200, 1800, 2400];
const bloomDisabled = computed(() => !controls.enableBloom);
const exposureDisabled = computed(() => !controls.toneMappingEnabled);
const deviceTierLabel = computed(() => performanceDeviceTierLabels[metrics.deviceTier]);
const textureProfiles = computed(() => Object.entries(performanceTextureProfileMap) as Array<[
    PerformanceTextureProfile,
    (typeof performanceTextureProfileMap)[PerformanceTextureProfile],
]>);
const meshCapHint = computed(() => controls.renderMode === "mesh" && controls.instanceCount > meshSafeCap);

function applyInstancePreset(count: number) {
    patchPerformanceControls({ instanceCount: count });
}

function applyRenderMode(mode: PerformanceRenderMode) {
    patchPerformanceControls({ renderMode: mode });
}

function applyTextureProfile(profile: PerformanceTextureProfile) {
    patchPerformanceControls({ textureProfile: profile });
}

function updateThreshold(key: keyof PerformanceLodThresholds, event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    setLodThreshold(key, value);
}

function requestDeviceRecheck() {
    patchPerformanceControls({ autoDowngrade: true, downgradeLocked: false });
    setPerformanceStatus("已请求重新检测设备能力，下一帧会根据当前设备特征决定是否自动降级。");
}
</script>

<template>
    <aside class="cb-control-panel cb-control-panel--absolute practice6-panel">
        <div class="cb-panel-header">
            <div>
                <p class="cb-panel-eyebrow">Performance Console</p>
                <h2 class="cb-panel-title">Day 6 参数控制台</h2>
            </div>
            <span class="cb-panel-glow"></span>
        </div>

        <p class="cb-panel-copy">先切 `InstancedMesh / Mesh` 看提交成本差异，再试 Bloom + FXAA + 色调映射链路，最后用 LOD 阈值、可见性剔除、贴图方案和自动降级把实验闭环跑完。</p>

        <div class="cb-panel-body">
            <section class="cb-panel-section">
                <div class="cb-panel-section-title">渲染模式对照</div>
                <div class="cb-panel-grid mode-grid">
                    <button
                        v-for="mode in performanceRenderModes"
                        :key="mode.value"
                        type="button"
                        class="cb-panel-option-card mode-card"
                        :class="{ active: controls.renderMode === mode.value }"
                        @click="applyRenderMode(mode.value)"
                    >
                        <strong>{{ mode.label }}</strong>
                        <small>{{ mode.copy }}</small>
                    </button>
                </div>
                <label class="cb-panel-item">
                    <div class="cb-control-head"><span>实例数量</span><strong>{{ controls.instanceCount }}</strong></div>
                    <input v-model.number="controls.instanceCount" type="range" min="200" max="2600" step="50" class="cb-panel-range" />
                </label>
                <div class="cb-panel-grid cb-panel-grid--2 preset-grid">
                    <button v-for="count in instancePresets" :key="count" type="button" class="cb-panel-button" :class="{ active: controls.instanceCount === count }" @click="applyInstancePreset(count)">{{ count }} 个</button>
                </div>
                <div class="cb-panel-note-card note-card">
                    <span class="cb-panel-info-label">对照提醒</span>
                    <strong>{{ drawCallHint }}</strong>
                    <small v-if="meshCapHint">普通 Mesh 模式会在 {{ meshSafeCap }} 处启用安全上限，避免高数量直接拖垮页面。</small>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">分辨率与后处理</div>
                <label class="cb-panel-item">
                    <div class="cb-control-head"><span>像素比上限</span><strong>{{ controls.pixelRatioCap.toFixed(2) }}</strong></div>
                    <input v-model.number="controls.pixelRatioCap" type="range" min="0.85" max="2" step="0.05" class="cb-panel-range" />
                </label>
                <label class="cb-toggle-row cb-toggle-row--compact">
                    <div>
                        <strong>启用 Bloom</strong>
                        <small>观察辉光成本和画面增强是否值得。</small>
                    </div>
                    <input v-model="controls.enableBloom" type="checkbox" class="cb-panel-checkbox" />
                </label>
                <label class="cb-toggle-row cb-toggle-row--compact">
                    <div>
                        <strong>启用 FXAA</strong>
                        <small>让抗锯齿成为可对照的一段后处理链。</small>
                    </div>
                    <input v-model="controls.enableFxaa" type="checkbox" class="cb-panel-checkbox" />
                </label>
                <label class="cb-toggle-row cb-toggle-row--compact">
                    <div>
                        <strong>色调映射</strong>
                        <small>Bloom 依赖 Tone Mapping，因此关闭时会自动校正。</small>
                    </div>
                    <input v-model="controls.toneMappingEnabled" type="checkbox" class="cb-panel-checkbox" />
                </label>
                <label class="cb-panel-item cb-panel-item--compact">
                    <div class="cb-control-head"><span>曝光</span><strong>{{ controls.toneMappingExposure.toFixed(2) }}</strong></div>
                    <input v-model.number="controls.toneMappingExposure" :disabled="exposureDisabled" type="range" min="0.65" max="1.85" step="0.01" class="cb-panel-range" />
                </label>
                <label class="cb-panel-item cb-panel-item--compact">
                    <div class="cb-control-head"><span>Bloom 强度</span><strong>{{ controls.bloomStrength.toFixed(2) }}</strong></div>
                    <input v-model.number="controls.bloomStrength" :disabled="bloomDisabled" type="range" min="0" max="2.2" step="0.01" class="cb-panel-range" />
                </label>
                <label class="cb-panel-item cb-panel-item--compact">
                    <div class="cb-control-head"><span>Bloom 半径</span><strong>{{ controls.bloomRadius.toFixed(2) }}</strong></div>
                    <input v-model.number="controls.bloomRadius" :disabled="bloomDisabled" type="range" min="0" max="1" step="0.01" class="cb-panel-range" />
                </label>
                <label class="cb-panel-item cb-panel-item--compact">
                    <div class="cb-control-head"><span>Bloom 阈值</span><strong>{{ controls.bloomThreshold.toFixed(2) }}</strong></div>
                    <input v-model.number="controls.bloomThreshold" :disabled="bloomDisabled" type="range" min="0" max="1" step="0.01" class="cb-panel-range" />
                </label>
                <div class="cb-panel-note-card summary-card">
                    <span class="cb-panel-info-label">当前链路</span>
                    <strong>{{ postProcessingSummary }}</strong>
                    <small>{{ bloomSummary }}</small>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">LOD 与可见性剔除</div>
                <label class="cb-panel-item">
                    <div class="cb-control-head"><span>Ultra → High</span><strong>{{ controls.lodThresholds.ultraToHigh.toFixed(1) }}</strong></div>
                    <input :value="controls.lodThresholds.ultraToHigh" type="range" min="4" max="16" step="0.5" class="cb-panel-range" @input="updateThreshold('ultraToHigh', $event)" />
                </label>
                <label class="cb-panel-item cb-panel-item--compact">
                    <div class="cb-control-head"><span>High → Mid</span><strong>{{ controls.lodThresholds.highToMid.toFixed(1) }}</strong></div>
                    <input :value="controls.lodThresholds.highToMid" type="range" min="7" max="24" step="0.5" class="cb-panel-range" @input="updateThreshold('highToMid', $event)" />
                </label>
                <label class="cb-panel-item cb-panel-item--compact">
                    <div class="cb-control-head"><span>Mid → Low</span><strong>{{ controls.lodThresholds.midToLow.toFixed(1) }}</strong></div>
                    <input :value="controls.lodThresholds.midToLow" type="range" min="10" max="38" step="0.5" class="cb-panel-range" @input="updateThreshold('midToLow', $event)" />
                </label>
                <label class="cb-toggle-row cb-toggle-row--compact">
                    <div>
                        <strong>启用可见性剔除</strong>
                        <small>仅保持视锥内对象活跃，直观看剔除收益。</small>
                    </div>
                    <input v-model="controls.enableVisibilityCulling" type="checkbox" class="cb-panel-checkbox" />
                </label>
                <div class="cb-panel-info-list insights">
                    <div class="cb-panel-info-row">
                        <div>
                            <p class="cb-panel-info-label">阈值摘要</p>
                            <div class="cb-panel-info-value">{{ lodThresholdSummary }}</div>
                        </div>
                        <span class="cb-panel-badge">当前 {{ metrics.activeLod }}</span>
                    </div>
                    <div class="cb-panel-info-row">
                        <div>
                            <p class="cb-panel-info-label">剔除收益</p>
                            <div class="cb-panel-info-value">{{ cullingSummary }}</div>
                        </div>
                        <span class="cb-panel-badge">距离 {{ metrics.cameraDistance.toFixed(2) }}</span>
                    </div>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">贴图实验</div>
                <div class="cb-panel-grid texture-grid">
                    <button
                        v-for="[profile, descriptor] in textureProfiles"
                        :key="profile"
                        type="button"
                        class="cb-panel-option-card texture-card"
                        :class="{ active: controls.textureProfile === profile }"
                        @click="applyTextureProfile(profile)"
                    >
                        <strong>{{ descriptor.label }}</strong>
                        <small>{{ descriptor.copy }}</small>
                    </button>
                </div>
                <div class="cb-panel-note-card note-card">
                    <span class="cb-panel-info-label">贴图状态</span>
                    <strong>{{ performanceTextureProfileMap[metrics.activeTextureProfile].label }}</strong>
                    <small>估算显存 {{ Math.round(metrics.textureEstimateBytes / 1024) }} KB · 最近加载 {{ metrics.textureLoadMs.toFixed(0) }} ms</small>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">设备策略与实验节奏</div>
                <label class="cb-toggle-row">
                    <div>
                        <strong>自动降级</strong>
                        <small>在低性能设备上自动降低像素比、关闭 Bloom 并切换压缩贴图。</small>
                    </div>
                    <input v-model="controls.autoDowngrade" type="checkbox" class="cb-panel-checkbox" />
                </label>
                <label class="cb-toggle-row cb-toggle-row--compact">
                    <div>
                        <strong>自动旋转实例簇</strong>
                        <small>便于动态观察高光、剔除和 LOD 切换节奏。</small>
                    </div>
                    <input v-model="controls.autoRotate" type="checkbox" class="cb-panel-checkbox" />
                </label>
                <div class="cb-panel-note-card summary-card">
                    <span class="cb-panel-info-label">设备档位</span>
                    <strong>{{ deviceTierLabel }}</strong>
                    <small>{{ downgradeSummary }}</small>
                </div>
                <div class="cb-panel-grid cb-panel-grid--2 action-grid">
                    <button type="button" class="cb-panel-button" @click="restoreHighQualityExperiment">恢复实验默认</button>
                    <button type="button" class="cb-panel-button" @click="requestDeviceRecheck">重新检测设备</button>
                </div>
            </section>
        </div>
    </aside>
</template>

<style scoped>
.practice6-panel { z-index: 40; }
.mode-grid,.preset-grid,.texture-grid,.insights,.action-grid { margin-top: 12px; }
.mode-card strong,.texture-card strong,.note-card strong,.summary-card strong { color: #f8fafc; }
.mode-card small,.texture-card small,.note-card small,.summary-card small { font-size: 12px; line-height: 1.65; color: #94a3b8; }
.note-card,.summary-card { display: grid; gap: 6px; margin-top: 12px; padding: 12px; }
input:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
