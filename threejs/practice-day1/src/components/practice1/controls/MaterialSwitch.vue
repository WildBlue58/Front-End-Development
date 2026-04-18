<script setup lang="ts">
import { useSceneState } from "../../../composables/useSceneState";
import { LightbulbIcon, LightbulbCircleIcon } from "tdesign-icons-vue-next";

const { materialType, materialLabel } = useSceneState();
</script>

<template>
    <section class="cb-panel-section">
        <h3 class="cb-panel-section-title">材质模式</h3>

        <div class="selector-shell">
            <t-radio-group v-model="materialType" variant="default-filled" size="small" class="material-group">
                <t-radio-button value="standard">Standard</t-radio-button>
                <t-radio-button value="basic">Basic</t-radio-button>
            </t-radio-group>
        </div>

        <div class="material-info">
            <LightbulbIcon v-if="materialType === 'standard'" class="info-icon" />
            <LightbulbCircleIcon v-else class="info-icon off" />
            <div>
                <strong>{{ materialLabel }}</strong>
                <p>Standard 会受光照影响，Basic 以纯色展示模型轮廓。</p>
            </div>
        </div>

        <p class="cb-panel-note">切换后可以直接观察光照、阴影和材质着色差异。</p>
    </section>
</template>

<style scoped>
.selector-shell {
    padding: 4px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    background: rgba(2, 6, 23, 0.38);
}

.material-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    background: rgba(2, 6, 23, 0.38);
}

.material-info strong {
    display: block;
    color: #f8fafc;
    font-size: 13px;
}

.material-info p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.6;
}

.info-icon {
    font-size: 16px;
    color: #fbbf24;
    flex-shrink: 0;
}

.info-icon.off {
    color: #64748b;
}

:deep(.material-group) {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
}

:deep(.material-group .t-radio-button) {
    margin: 0;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: #94a3b8;
    min-height: 38px;
    transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
}

:deep(.material-group .t-radio-button:hover) {
    transform: translateY(-1px);
    background: rgba(15, 23, 42, 0.7);
    color: #f8fafc;
}

:deep(.material-group .t-radio-button.t-is-checked) {
    background: rgba(15, 23, 42, 0.9);
    color: #f8fafc;
    box-shadow: 0 0 0 1px rgba(103, 232, 249, 0.18), 0 14px 28px rgba(8, 47, 73, 0.22);
}
</style>
