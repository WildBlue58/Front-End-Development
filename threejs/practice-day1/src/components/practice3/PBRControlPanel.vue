<!-- ============================================================
     PBRControlPanel.vue — Day 3 PBR 参数控制面板

     职责：
     → 基础参数（颜色/金属度/粗糙度/反射强度）
     → Standard 专属：自发光强度
     → Physical 专属：三种材质预设切换
     → 深色毛玻璃风格，与 Practice2 一致
============================================================ -->

<script setup lang="ts">
import {
    usePBRState,
    type PhysicalPreset,
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
} = usePBRState();

const presets: { value: PhysicalPreset; label: string; desc: string }[] = [
    { value: "clearcoat", label: "🚗 汽车漆", desc: "清漆层 + 深红底色" },
    { value: "glass", label: "🔮 玻璃", desc: "全透射 + IOR 折射" },
    { value: "velvet", label: "🟣 天鹅绒", desc: "漫反射光泽层" },
];
</script>

<template>
    <div class="pbr-panel">
        <!-- 标题 -->
        <div class="panel-header">
            <span class="header-icon">⚗️</span>
            <h2>PBR 材质控制台</h2>
        </div>

        <div class="panel-body">
            <!-- ── 两球共用：基础参数 ── -->
            <section class="section">
                <div class="section-title">基础参数（两球共用）</div>

                <!-- 颜色 -->
                <div class="row">
                    <label class="row-label">基础颜色</label>
                    <input type="color" v-model="color" class="color-input" />
                    <code class="color-code">{{ color }}</code>
                </div>

                <!-- 金属度 -->
                <div class="row col">
                    <div class="row-header">
                        <label class="row-label"
                            >金属度
                            <span class="hint-text">(metalness)</span></label
                        >
                        <span class="val">{{ metalness.toFixed(2) }}</span>
                    </div>
                    <input
                        type="range"
                        v-model.number="metalness"
                        min="0"
                        max="1"
                        step="0.01"
                        class="slider"
                    />
                    <div class="range-hints">
                        <span>非金属</span><span>全金属</span>
                    </div>
                </div>

                <!-- 粗糙度 -->
                <div class="row col">
                    <div class="row-header">
                        <label class="row-label"
                            >粗糙度
                            <span class="hint-text">(roughness)</span></label
                        >
                        <span class="val">{{ roughness.toFixed(2) }}</span>
                    </div>
                    <input
                        type="range"
                        v-model.number="roughness"
                        min="0"
                        max="1"
                        step="0.01"
                        class="slider"
                    />
                    <div class="range-hints">
                        <span>镜面</span><span>哑光</span>
                    </div>
                </div>

                <!-- 环境反射强度 -->
                <div class="row col">
                    <div class="row-header">
                        <label class="row-label"
                            >环境反射
                            <span class="hint-text"
                                >(envMapIntensity)</span
                            ></label
                        >
                        <span class="val">{{
                            envMapIntensity.toFixed(2)
                        }}</span>
                    </div>
                    <input
                        type="range"
                        v-model.number="envMapIntensity"
                        min="0"
                        max="3"
                        step="0.05"
                        class="slider"
                    />
                </div>
            </section>

            <!-- ── 左球 Standard：自发光 ── -->
            <section class="section">
                <div class="section-title">
                    <span class="badge badge-std">左球</span>
                    Standard · 自发光
                </div>

                <div class="row">
                    <label class="row-label">发光颜色</label>
                    <input
                        type="color"
                        v-model="emissiveColor"
                        class="color-input"
                    />
                </div>

                <div class="row col">
                    <div class="row-header">
                        <label class="row-label"
                            >发光强度
                            <span class="hint-text"
                                >(emissiveIntensity)</span
                            ></label
                        >
                        <span class="val">{{
                            emissiveIntensity.toFixed(2)
                        }}</span>
                    </div>
                    <input
                        type="range"
                        v-model.number="emissiveIntensity"
                        min="0"
                        max="3"
                        step="0.05"
                        class="slider slider-emissive"
                    />
                </div>
            </section>

            <!-- ── 右球 Physical：预设切换 ── -->
            <section class="section">
                <div class="section-title">
                    <span class="badge badge-phys">右球</span>
                    Physical · 材质预设
                </div>

                <div class="preset-grid">
                    <button
                        v-for="p in presets"
                        :key="p.value"
                        class="preset-btn"
                        :class="{ active: physicalPreset === p.value }"
                        @click="applyPreset(p.value)"
                    >
                        <span class="preset-label">{{ p.label }}</span>
                        <span class="preset-desc">{{ p.desc }}</span>
                    </button>
                </div>

                <div class="preset-tip">
                    切换预设会同时修改颜色和左右球共用的基础参数
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.pbr-panel {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 100;
    width: 290px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;

    background: rgba(15, 15, 30, 0.92);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 16px;
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.04) inset;
    color: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px;
}

.pbr-panel::-webkit-scrollbar {
    width: 4px;
}
.pbr-panel::-webkit-scrollbar-track {
    background: transparent;
}
.pbr-panel::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 2px;
}

/* 标题 */
.panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 18px;
    border-bottom: 1px solid rgba(139, 92, 246, 0.15);
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent);
    border-radius: 16px 16px 0 0;
}
.header-icon {
    font-size: 18px;
}
.panel-header h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #e2e8f0;
}

/* 内容区 */
.panel-body {
    padding: 14px 16px;
}

/* 分区 */
.section {
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.section:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
}

.badge {
    font-size: 10px;
    padding: 1px 7px;
    border-radius: 4px;
    font-weight: 600;
    text-transform: none;
    letter-spacing: 0;
}
.badge-std {
    background: rgba(99, 102, 241, 0.2);
    color: #818cf8;
}
.badge-phys {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
}

/* 单行控件 */
.row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}
.row.col {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
}
.row:last-child {
    margin-bottom: 0;
}

.row-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.row-label {
    font-size: 12px;
    color: #cbd5e1;
}

.hint-text {
    font-size: 10px;
    color: #64748b;
    font-style: normal;
}

.val {
    font-size: 13px;
    font-weight: 600;
    color: #a78bfa;
    min-width: 32px;
    text-align: right;
}

/* 颜色输入 */
.color-input {
    width: 32px;
    height: 22px;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    background: none;
    cursor: pointer;
    flex-shrink: 0;
}
.color-code {
    font-size: 11px;
    color: #64748b;
    flex: 1;
}

/* 滑块 */
.slider {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(139, 92, 246, 0.2);
    border-radius: 2px;
    outline: none;
}
.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 13px;
    height: 13px;
    background: rgb(139, 92, 246);
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid #0f0f1a;
}
.slider-emissive {
    background: rgba(251, 191, 36, 0.15);
}
.slider-emissive::-webkit-slider-thumb {
    background: #fbbf24;
}

.range-hints {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #475569;
}

/* 预设按钮 */
.preset-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.preset-btn {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 9px 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    color: #94a3b8;
    cursor: pointer;
    text-align: left;
    transition: all 0.18s ease;
}
.preset-btn:hover {
    background: rgba(139, 92, 246, 0.1);
    border-color: rgba(139, 92, 246, 0.3);
    color: #e2e8f0;
}
.preset-btn.active {
    background: rgba(139, 92, 246, 0.18);
    border-color: #8b5cf6;
    color: #e2e8f0;
}
.preset-label {
    font-size: 13px;
    font-weight: 500;
}
.preset-desc {
    font-size: 10px;
    color: #64748b;
}
.preset-btn.active .preset-desc {
    color: #94a3b8;
}

.preset-tip {
    margin-top: 8px;
    font-size: 10px;
    color: #475569;
    line-height: 1.5;
}
</style>
