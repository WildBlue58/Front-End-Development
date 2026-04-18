<script setup lang="ts">
import { computed } from "vue";
import { wavePresetDefinitions } from "../../composables/useWaveShaderState";
import { useInteractiveSceneState } from "../../composables/useInteractiveSceneState";

const { objectEntries, activeObjectId, activeObject, statusText, activePartHint, shaderState, autoRotateSelected, storageLabel, hasPersistedState, materialPresetDefinitions, setActiveObject, applyMaterialPresetToActiveObject, restorePersistedSceneState, clearPersistedSceneState, resetInteractiveSceneState } = useInteractiveSceneState();

const positionControls = [
    { key: "x", label: "位置 X", min: -4, max: 4, step: 0.01 },
    { key: "y", label: "位置 Y", min: -1.2, max: 2.2, step: 0.01 },
    { key: "z", label: "位置 Z", min: -4.5, max: 3, step: 0.01 },
] as const;
const rotationControls = [
    { key: "x", label: "旋转 X", min: -3.14, max: 3.14, step: 0.01 },
    { key: "y", label: "旋转 Y", min: -3.14, max: 3.14, step: 0.01 },
    { key: "z", label: "旋转 Z", min: -3.14, max: 3.14, step: 0.01 },
] as const;
const shaderModes = [
    { key: "shader", label: "Shader", desc: "适合快速验证算法" },
    { key: "raw", label: "Raw", desc: "显式声明 attribute / uniform" },
] as const;
const shaderControls = [
    { key: "amplitude", label: "波幅", min: 0, max: 0.8, step: 0.01 },
    { key: "speed", label: "速度", min: 0.2, max: 4, step: 0.05 },
    { key: "rippleStrength", label: "涟漪强度", min: 0, max: 0.8, step: 0.01 },
    { key: "hudIntensity", label: "HUD 强度", min: 0, max: 1, step: 0.01 },
] as const;

const activePartCard = computed(() => activePartHint.value?.objectId === activeObjectId.value ? activePartHint.value : null);
</script>

<template>
    <aside class="cb-control-panel cb-control-panel--absolute practice5-panel">
        <div class="cb-panel-header">
            <div>
                <p class="cb-panel-eyebrow">Reactive Console</p>
                <h2 class="cb-panel-title">Day 5 多对象控制台</h2>
            </div>
            <span class="cb-panel-glow"></span>
        </div>

        <p class="cb-panel-copy">{{ statusText }}</p>

        <div class="cb-panel-body">
            <section class="cb-panel-section">
                <div class="cb-panel-section-title">对象选择</div>
                <div class="cb-panel-grid">
                    <button
                        v-for="item in objectEntries"
                        :key="item.id"
                        type="button"
                        class="cb-panel-option-card object-card"
                        :class="{ active: activeObjectId === item.id }"
                        @click="setActiveObject(item.id)"
                    >
                        <div class="cb-panel-split">
                            <strong>{{ item.label }}</strong>
                            <span class="cb-panel-pill">{{ item.kind }}</span>
                        </div>
                        <small>{{ item.summary }}</small>
                    </button>
                </div>
                <div class="toolbar-row">
                    <button type="button" class="cb-panel-button" @click="setActiveObject(null)">取消聚焦</button>
                    <span class="cb-panel-note">控制台会自动切换到当前编辑对象的独立参数。</span>
                </div>
            </section>

            <section v-if="activeObject" class="cb-panel-section">
                <div class="cb-panel-section-title">变换编辑</div>
                <label v-for="item in positionControls" :key="item.key" class="cb-panel-item">
                    <div class="cb-control-head"><span>{{ item.label }}</span><strong>{{ activeObject.position[item.key].toFixed(2) }}</strong></div>
                    <input v-model.number="activeObject.position[item.key]" type="range" :min="item.min" :max="item.max" :step="item.step" class="cb-panel-range" />
                </label>
                <label v-for="item in rotationControls" :key="item.key" class="cb-panel-item">
                    <div class="cb-control-head"><span>{{ item.label }}</span><strong>{{ activeObject.rotation[item.key].toFixed(2) }}</strong></div>
                    <input v-model.number="activeObject.rotation[item.key]" type="range" :min="item.min" :max="item.max" :step="item.step" class="cb-panel-range" />
                </label>
                <label class="cb-panel-item">
                    <div class="cb-control-head"><span>统一缩放</span><strong>{{ activeObject.scale.toFixed(2) }}</strong></div>
                    <input v-model.number="activeObject.scale" type="range" min="0.35" max="2.2" step="0.01" class="cb-panel-range" />
                </label>
            </section>

            <section v-if="activeObject" class="cb-panel-section">
                <div class="cb-panel-section-title">材质预设</div>
                <div class="cb-panel-grid cb-panel-grid--2">
                    <button
                        v-for="preset in materialPresetDefinitions"
                        :key="preset.key"
                        type="button"
                        class="cb-panel-option-card"
                        :class="{ active: activeObject.material.preset === preset.key }"
                        @click="applyMaterialPresetToActiveObject(preset.key)"
                    >
                        <strong>{{ preset.label }}</strong>
                        <small>{{ preset.summary }}</small>
                    </button>
                </div>
                <div v-if="activePartCard" class="part-note cb-panel-note-card">
                    <span class="cb-panel-info-label">当前部位</span>
                    <strong>{{ activePartCard.label }}</strong>
                    <p class="cb-panel-help-text">{{ activePartCard.hint }}</p>
                </div>
            </section>

            <section v-if="activeObject" class="cb-panel-section">
                <div class="cb-panel-section-title">材质微调</div>
                <div class="cb-panel-grid cb-panel-grid--2">
                    <label class="cb-panel-color-card">
                        <span>主颜色</span>
                        <input v-model="activeObject.material.color" type="color" class="cb-panel-color-input" />
                        <code class="cb-panel-code">{{ activeObject.material.color }}</code>
                    </label>
                    <label class="cb-panel-color-card">
                        <span>发光色</span>
                        <input v-model="activeObject.material.emissive" type="color" class="cb-panel-color-input" />
                        <code class="cb-panel-code">{{ activeObject.material.emissive }}</code>
                    </label>
                </div>
                <label class="cb-panel-item">
                    <div class="cb-control-head"><span>金属度</span><strong>{{ activeObject.material.metalness.toFixed(2) }}</strong></div>
                    <input v-model.number="activeObject.material.metalness" type="range" min="0" max="1" step="0.01" class="cb-panel-range" />
                </label>
                <label class="cb-panel-item">
                    <div class="cb-control-head"><span>粗糙度</span><strong>{{ activeObject.material.roughness.toFixed(2) }}</strong></div>
                    <input v-model.number="activeObject.material.roughness" type="range" min="0" max="1" step="0.01" class="cb-panel-range" />
                </label>
                <label class="cb-panel-item">
                    <div class="cb-control-head"><span>发光强度</span><strong>{{ activeObject.material.emissiveIntensity.toFixed(2) }}</strong></div>
                    <input v-model.number="activeObject.material.emissiveIntensity" type="range" min="0" max="1.2" step="0.01" class="cb-panel-range" />
                </label>
                <label class="cb-toggle-row cb-toggle-row--compact">
                    <div>
                        <strong>线框模式</strong>
                        <small>观察几何结构与模型表面边界。</small>
                    </div>
                    <input v-model="activeObject.material.wireframe" type="checkbox" class="cb-panel-checkbox" />
                </label>
                <label class="cb-toggle-row cb-toggle-row--compact">
                    <div>
                        <strong>选中后自动旋转</strong>
                        <small>仅对当前聚焦对象生效，拖拽时会自动暂停。</small>
                    </div>
                    <input v-model="autoRotateSelected" type="checkbox" class="cb-panel-checkbox" />
                </label>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">Shader 联动</div>
                <label class="cb-toggle-row">
                    <div>
                        <strong>启用联动预览</strong>
                        <small>把 Day 4 的 Shader 平面作为当前工作台的联动显示器。</small>
                    </div>
                    <input v-model="shaderState.enabled" type="checkbox" class="cb-panel-checkbox" />
                </label>
                <div class="cb-panel-grid cb-panel-grid--2 mode-grid">
                    <button
                        v-for="mode in shaderModes"
                        :key="mode.key"
                        type="button"
                        class="cb-panel-option-card"
                        :class="{ active: shaderState.materialMode === mode.key }"
                        @click="shaderState.materialMode = mode.key"
                    >
                        <strong>{{ mode.label }}</strong>
                        <small>{{ mode.desc }}</small>
                    </button>
                </div>
                <div class="cb-panel-grid cb-panel-grid--2">
                    <button
                        v-for="preset in wavePresetDefinitions"
                        :key="preset.key"
                        type="button"
                        class="cb-panel-option-card"
                        :class="{ active: shaderState.preset === preset.key }"
                        @click="shaderState.preset = preset.key"
                    >
                        <strong>{{ preset.label }}</strong>
                        <small>{{ preset.summary }}</small>
                    </button>
                </div>
                <label v-for="item in shaderControls" :key="item.key" class="cb-panel-item">
                    <div class="cb-control-head"><span>{{ item.label }}</span><strong>{{ shaderState[item.key].toFixed(2) }}</strong></div>
                    <input v-model.number="shaderState[item.key]" type="range" :min="item.min" :max="item.max" :step="item.step" class="cb-panel-range" />
                </label>
                <div class="cb-panel-grid cb-panel-grid--2">
                    <label class="cb-panel-color-card">
                        <span>颜色 A</span>
                        <input v-model="shaderState.colorA" :disabled="shaderState.syncActiveColor" type="color" class="cb-panel-color-input" />
                        <code class="cb-panel-code">{{ shaderState.colorA }}</code>
                    </label>
                    <label class="cb-panel-color-card">
                        <span>颜色 B</span>
                        <input v-model="shaderState.colorB" type="color" class="cb-panel-color-input" />
                        <code class="cb-panel-code">{{ shaderState.colorB }}</code>
                    </label>
                </div>
                <label class="cb-toggle-row cb-toggle-row--compact">
                    <div>
                        <strong>跟随当前对象颜色</strong>
                        <small>启用后，Shader 会直接读取当前编辑对象的材质主色。</small>
                    </div>
                    <input v-model="shaderState.syncActiveColor" type="checkbox" class="cb-panel-checkbox" />
                </label>
                <label class="cb-toggle-row cb-toggle-row--compact">
                    <div>
                        <strong>拖拽时增强反馈</strong>
                        <small>拖拽对象时自动提高波速与涟漪强度。</small>
                    </div>
                    <input v-model="shaderState.respondToDrag" type="checkbox" class="cb-panel-checkbox" />
                </label>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">状态持久化</div>
                <div class="cb-panel-info-row">
                    <div>
                        <p class="cb-panel-info-label">本地存储</p>
                        <div class="cb-panel-info-value">{{ storageLabel }}</div>
                    </div>
                    <span class="cb-panel-badge">{{ hasPersistedState ? 'LOCAL ON' : 'NO SNAPSHOT' }}</span>
                </div>
                <p class="cb-panel-help">会自动保存对象参数、当前选中对象和 Shader 联动配置；hover、拖拽过程与时间轴不会入库。</p>
                <div class="action-grid cb-panel-grid cb-panel-grid--2">
                    <button type="button" class="cb-panel-button" :disabled="!hasPersistedState" @click="restorePersistedSceneState">恢复存档</button>
                    <button type="button" class="cb-panel-button" @click="() => resetInteractiveSceneState()">恢复默认</button>

                    <button type="button" class="cb-panel-button" @click="clearPersistedSceneState">清除存档</button>
                </div>
            </section>
        </div>
    </aside>
</template>

<style scoped>
.practice5-panel {
    z-index: 40;
}

.object-card strong,
.toolbar-row strong,
.part-note strong {
    color: #f8fafc;
}

.toolbar-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
}

.toolbar-row .cb-panel-note {
    margin: 0;
}

.part-note {
    display: grid;
    gap: 6px;
    margin-top: 12px;
    padding: 12px;
}

.part-note p {
    margin: 0;
}

.mode-grid,
.action-grid {
    margin-top: 12px;
}

@media (max-width: 980px) {
    .toolbar-row {
        align-items: flex-start;
        flex-direction: column;
    }
}
</style>
