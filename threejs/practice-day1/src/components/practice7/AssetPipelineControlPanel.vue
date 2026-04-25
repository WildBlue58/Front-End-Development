<script setup lang="ts">
import { computed } from "vue";
import { currentTextureStrategy, useAssetPipelineState, type AssetVersionKey, type TextureStrategyKey } from "../../composables/useAssetPipelineState";

const { state, assetVersions, textureStrategies, releaseEntries, currentVersion, setActiveAssetVersion, setTextureStrategy } = useAssetPipelineState();

const budgetCards = computed(() => [
    { label: "节点预算", value: `${state.summary.nodeCount} / 48`, tone: state.summary.nodeCount > 48 ? "warning" : "good" },
    { label: "材质预算", value: `${state.summary.materialCount} / 16`, tone: state.summary.materialCount > 16 ? "warning" : "good" },
    { label: "贴图预算", value: `${state.summary.textureCount} / 12`, tone: state.summary.textureCount > 12 ? "warning" : "good" },
    { label: "命名问题", value: String(state.summary.issueCount), tone: state.summary.issueCount > 0 ? "warning" : "good" },
]);

const textureEntries = computed(() => Object.entries(textureStrategies) as Array<[TextureStrategyKey, (typeof textureStrategies)[TextureStrategyKey]]>);
const versionCards = computed(() => assetVersions.map((item) => ({ ...item, active: state.activeVersion === item.key })));
const animationDisabled = computed(() => state.animation.clipNames.length === 0);

function chooseVersion(key: AssetVersionKey) {
    setActiveAssetVersion(key);
}

function chooseTextureStrategy(key: TextureStrategyKey) {
    setTextureStrategy(key);
}
</script>

<template>
    <aside class="cb-control-panel cb-control-panel--absolute practice7-panel">
        <div class="cb-panel-header">
            <div>
                <p class="cb-panel-eyebrow">Asset Pipeline Console</p>
                <h2 class="cb-panel-title">Day 7 资产实验台</h2>
            </div>
            <span class="cb-panel-glow"></span>
        </div>

        <p class="cb-panel-copy">这里把资源版本切换、加载校验、命名预检、贴图策略、动画控制和发布清单收在一个面板里，目标是不只“加载成功”，还要把资产交付事实讲清楚。</p>

        <div class="cb-panel-body">
            <section class="cb-panel-section">
                <div class="cb-panel-section-title">资源版本</div>
                <div class="version-grid">
                    <button v-for="item in versionCards" :key="item.key" type="button" class="version-card cb-panel-option-card" :class="{ active: item.active }" @click="chooseVersion(item.key)">
                        <span class="thumb" :style="{ '--thumb-accent': item.accent }">{{ item.thumbnailLabel }}</span>
                        <strong>{{ item.label }}</strong>
                        <small>{{ item.note }}</small>
                    </button>
                </div>
                <div class="cb-panel-note-card note-card">
                    <span class="cb-panel-info-label">当前路径</span>
                    <strong>{{ currentVersion.path }}</strong>
                    <small>{{ currentVersion.note }}</small>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">模型预检与预算提示</div>
                <div class="cb-panel-info-list">
                    <div class="cb-panel-info-row"><span class="cb-panel-info-label">模型</span><span class="cb-panel-info-value">{{ state.modelLabel }}</span></div>
                    <div class="cb-panel-info-row"><span class="cb-panel-info-label">场景子级</span><span class="cb-panel-info-value">{{ state.summary.sceneChildren }}</span></div>
                    <div class="cb-panel-info-row"><span class="cb-panel-info-label">Mesh / 材质 / 动画</span><span class="cb-panel-info-value">{{ state.summary.meshCount }} / {{ state.summary.materialCount }} / {{ state.summary.animationCount }}</span></div>
                    <div class="cb-panel-info-row"><span class="cb-panel-info-label">贴图数量</span><span class="cb-panel-info-value">{{ state.summary.textureCount }}</span></div>
                    <div class="cb-panel-info-row"><span class="cb-panel-info-label">预算结论</span><span class="cb-panel-info-value">{{ state.summary.budgetHint }}</span></div>
                </div>
                <div class="budget-grid">
                    <div v-for="item in budgetCards" :key="item.label" class="budget-chip" :class="item.tone">
                        <span>{{ item.label }}</span>
                        <strong>{{ item.value }}</strong>
                    </div>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">导出检查项</div>
                <div class="checklist-list">
                    <div v-for="item in state.checklist" :key="item.key" class="check-item">
                        <div class="check-flag" :class="item.done ? 'done' : 'pending'"></div>
                        <div>
                            <strong>{{ item.label }}</strong>
                            <small>{{ item.detail }}</small>
                        </div>
                    </div>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">贴图策略对照</div>
                <div class="texture-grid">
                    <button v-for="[key, item] in textureEntries" :key="key" type="button" class="texture-card cb-panel-option-card" :class="{ active: state.textureStrategy === key }" @click="chooseTextureStrategy(key)">
                        <img :src="item.url" :alt="item.label" />
                        <strong>{{ item.label }}</strong>
                        <small>{{ item.copy }}</small>
                    </button>
                </div>
                <div class="cb-panel-note-card note-card">
                    <span class="cb-panel-info-label">当前贴图策略</span>
                    <strong>{{ currentTextureStrategy.label }}</strong>
                    <small>{{ currentTextureStrategy.copy }}</small>
                </div>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">动画控制区</div>
                <div class="cb-panel-grid cb-panel-grid--2">
                    <button v-for="clip in state.animation.clipNames" :key="clip" type="button" class="cb-panel-button" :class="{ active: state.animation.activeClip === clip }" :disabled="animationDisabled">{{ clip }}</button>
                </div>
                <div class="cb-panel-info-list">
                    <div class="cb-panel-info-row"><span class="cb-panel-info-label">播放状态</span><span class="cb-panel-info-value">{{ state.animation.playing ? '播放中' : '待机 / 暂停' }}</span></div>
                    <div class="cb-panel-info-row"><span class="cb-panel-info-label">速度</span><span class="cb-panel-info-value">{{ state.animation.speed.toFixed(1) }}x</span></div>
                </div>
                <small class="cb-panel-note">如果当前是 Porsche 资源，这一块会安全降级为“无动画但页面稳定”；切到 `Animated GLB` 时会出现真实 clip。</small>
            </section>

            <section class="cb-panel-section">
                <div class="cb-panel-section-title">命名校验与资源发布清单</div>
                <div class="cb-panel-note-card note-card">
                    <span class="cb-panel-info-label">命名校验</span>
                    <strong>{{ state.namingIssues.length ? `发现 ${state.namingIssues.length} 项待整理` : '节点命名通过当前规则' }}</strong>
                    <small>{{ state.namingIssues[0]?.name ?? '未发现 Cube.001 / 空格名 / 默认导出残留。' }}</small>
                </div>
                <div class="release-list">
                    <div v-for="entry in releaseEntries" :key="entry.stage" class="cb-panel-info-row">
                        <div>
                            <p class="cb-panel-info-label">{{ entry.stage }}</p>
                            <div class="cb-panel-info-value path-text">{{ entry.path }}</div>
                        </div>
                        <span class="cb-panel-badge">{{ entry.status }}</span>
                    </div>
                </div>
            </section>
        </div>
    </aside>
</template>

<style scoped>
.practice7-panel { z-index: 40; }
.version-grid,.texture-grid,.budget-grid,.checklist-list,.release-list { display: grid; gap: 10px; margin-top: 12px; }
.thumb { display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, var(--thumb-accent), rgba(15, 23, 42, 0.9)); color: #f8fafc; font-size: 12px; letter-spacing: 0.14em; }
.version-card,.texture-card { gap: 8px; }
.version-card strong,.texture-card strong,.check-item strong,.note-card strong { color: #f8fafc; }
.version-card small,.texture-card small,.check-item small,.note-card small,.cb-panel-note { font-size: 12px; line-height: 1.65; color: #94a3b8; }
.texture-card img { width: 100%; height: 92px; object-fit: cover; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.12); background: rgba(2, 6, 23, 0.68); }
.note-card { display: grid; gap: 6px; margin-top: 12px; padding: 12px; }
.budget-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.budget-chip { padding: 12px; border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.12); background: rgba(2, 6, 23, 0.36); display: grid; gap: 6px; }
.budget-chip span { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #7dd3fc; }
.budget-chip strong { color: #f8fafc; }
.budget-chip.warning { border-color: rgba(245, 158, 11, 0.34); }
.budget-chip.good { border-color: rgba(34, 197, 94, 0.24); }
.check-item { display: flex; gap: 10px; padding: 12px; border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.12); background: rgba(2, 6, 23, 0.36); }
.check-flag { width: 10px; min-width: 10px; height: 10px; border-radius: 999px; margin-top: 6px; }
.check-flag.done { background: #22c55e; box-shadow: 0 0 14px rgba(34, 197, 94, 0.55); }
.check-flag.pending { background: #f59e0b; box-shadow: 0 0 14px rgba(245, 158, 11, 0.4); }
.speed-box { display: grid; gap: 8px; padding: 12px; border-radius: 14px; border: 1px solid rgba(148, 163, 184, 0.12); background: rgba(2, 6, 23, 0.28); }
.path-text { max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: rtl; text-align: right; }
@media (max-width: 980px) { .budget-grid,.playback-grid { grid-template-columns: 1fr; } }
</style>
