<script setup lang="ts">
import { useProductShowcaseState } from "../../composables/useProductShowcaseState";

const { state, variants, hotspots, cameraPresets, currentVariant, currentHotspot, degradeSummary, applyVariant, setCurrentColor, patchDisplay, setCameraPreset, setActiveHotspot } = useProductShowcaseState();
const colors = ["#38bdf8", "#ef4444", "#f59e0b", "#8b5cf6", "#42b883"];
</script>

<template>
    <aside class="cb-control-panel cb-control-panel--absolute practice8-panel">
        <div class="cb-panel-header">
            <div>
                <p class="cb-panel-eyebrow">Showcase Console</p>
                <h2 class="cb-panel-title">Day 8 配置与讲解面板</h2>
            </div>
            <span class="cb-panel-glow"></span>
        </div>
        <p class="cb-panel-copy">右侧面板统一接管 Variant、Color、机位、热点和移动端策略，让综合展示页不只是好看，还能覆盖文档里的验证清单与扩展练习。</p>

        <div class="cb-panel-body">
            <section class="cb-panel-section">
                <div class="cb-panel-section-title">版本 Variant</div>
                <div class="cb-panel-grid variant-grid">
                    <button v-for="item in variants" :key="item.key" type="button" class="cb-panel-option-card" :class="{ active: state.variant === item.key }" @click="applyVariant(item.key)">
                        <strong>{{ item.label }}</strong>
                        <small>{{ item.copy }}</small>
                    </button>
                </div>
                <div class="cb-panel-note-card note-card">
                    <span class="cb-panel-info-label">当前版本说明</span>
                    <strong>{{ currentVariant.label }}</strong>
                    <small>{{ currentVariant.copy }}</small>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">颜色 Color</div>
                <div class="color-grid">
                    <button v-for="color in colors" :key="color" type="button" class="color-dot" :class="{ active: state.currentColor === color }" :style="{ background: color }" @click="setCurrentColor(color)"></button>
                </div>
                <div class="cb-panel-info-list">
                    <div class="cb-panel-info-row"><span class="cb-panel-info-label">当前颜色</span><span class="cb-panel-info-value">{{ state.currentColor }}</span></div>
                    <div class="cb-panel-info-row"><span class="cb-panel-info-label">当前模式</span><span class="cb-panel-info-value">{{ state.renderMode }}</span></div>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">显示策略</div>
                <label class="cb-toggle-row">
                    <div><strong>自动旋转</strong><small>本地模式下持续转动，方便观察高光和轮廓。</small></div>
                    <input :checked="state.autoRotate" type="checkbox" class="cb-panel-checkbox" @change="patchDisplay({ autoRotate: ($event.target as HTMLInputElement).checked })" />
                </label>
                <label class="cb-toggle-row cb-toggle-row--compact">
                    <div><strong>线框模式</strong><small>覆盖验证清单中的 wireframe 切换。</small></div>
                    <input :checked="state.wireframe" type="checkbox" class="cb-panel-checkbox" @change="patchDisplay({ wireframe: ($event.target as HTMLInputElement).checked })" />
                </label>
                <label class="cb-toggle-row cb-toggle-row--compact">
                    <div><strong>质感增强</strong><small>接入 Day 6 的 Bloom 思路，切换本地后处理链路。</small></div>
                    <input :checked="state.bloom" type="checkbox" class="cb-panel-checkbox" @change="patchDisplay({ bloom: ($event.target as HTMLInputElement).checked })" />
                </label>
                <div class="cb-panel-note-card note-card">
                    <span class="cb-panel-info-label">设备策略</span>
                    <strong>{{ degradeSummary }}</strong>
                    <small>移动端会自动关闭高成本选项，保证页面结构和 HUD 仍然可用。</small>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">相机机位预设</div>
                <div class="cb-panel-grid cb-panel-grid--2">
                    <button v-for="preset in cameraPresets" :key="preset.key" type="button" class="cb-panel-button" :class="{ active: state.cameraPreset === preset.key }" @click="setCameraPreset(preset.key)">{{ preset.label }}</button>
                </div>
                <small class="cb-panel-note">支持 `正面 / 侧面 / 细节 / 爆炸图` 机位，切换时 HUD 和焦点文案会一起更新。</small>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">热点讲解系统</div>
                <div class="cb-panel-grid hotspot-grid">
                    <button v-for="item in hotspots" :key="item.id" type="button" class="cb-panel-option-card" :class="{ active: state.activeHotspot === item.id }" @click="setActiveHotspot(item.id)">
                        <strong>{{ item.label }}</strong>
                        <small>{{ item.copy }}</small>
                    </button>
                </div>
                <div class="cb-panel-note-card note-card">
                    <span class="cb-panel-info-label">当前热点</span>
                    <strong>{{ currentHotspot?.label ?? '等待点击模型部件或手动选择热点' }}</strong>
                    <small>{{ currentHotspot?.copy ?? '主视区支持点击模型部件，HUD 会实时同步 Focus 文案。' }}</small>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">Day 7 资源元数据</div>
                <div class="cb-panel-info-list">
                    <div v-for="item in state.metadata" :key="item.label" class="cb-panel-info-row">
                        <span class="cb-panel-info-label">{{ item.label }}</span>
                        <span class="cb-panel-info-value meta-text">{{ item.value }}</span>
                    </div>
                </div>
            </section>
        </div>
    </aside>
</template>

<style scoped>
.practice8-panel { z-index: 30; top: 18px; }
.variant-grid,.hotspot-grid { margin-top: 12px; }
.color-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.color-dot { width: 34px; height: 34px; border-radius: 999px; border: 2px solid transparent; cursor: pointer; }
.color-dot.active { border-color: rgba(255, 255, 255, 0.92); box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.18); }
.note-card { display: grid; gap: 6px; margin-top: 12px; padding: 12px; }
.note-card strong,.cb-panel-option-card strong { color: #f8fafc; }
.note-card small,.cb-panel-option-card small,.cb-panel-note { color: #94a3b8; font-size: 12px; line-height: 1.65; }
.meta-text { max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: rtl; text-align: right; }
</style>
