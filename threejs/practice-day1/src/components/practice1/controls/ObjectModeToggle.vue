<script setup lang="ts">
import { useSceneState } from "../../../composables/useSceneState";
import { LayersIcon, AppIcon } from "tdesign-icons-vue-next";

const { showMultiple } = useSceneState();
</script>

<template>
    <section class="cb-panel-section">
        <h3 class="cb-panel-section-title">物体模式</h3>

        <div class="toggle-shell cb-toggle-row">
            <div class="switch-label">
                <AppIcon v-if="!showMultiple" class="status-icon single" />
                <LayersIcon v-else class="status-icon multiple" />
                <div>
                    <strong>{{ showMultiple ? "3 个物体" : "单物体" }}</strong>
                    <p>{{ showMultiple ? "并排观察空间层次" : "聚焦单个主体表现" }}</p>
                </div>
            </div>
            <t-switch v-model="showMultiple" size="large" />
        </div>

        <p class="cb-panel-note">开启后会显示绿、紫、红三个不同位置的物体，便于观察构图和空间关系。</p>
    </section>
</template>

<style scoped>
.toggle-shell {
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    background: rgba(2, 6, 23, 0.38);
}

.switch-label {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #e2e8f0;
}

.switch-label strong {
    display: block;
    color: #f8fafc;
    font-size: 13px;
}

.switch-label p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 12px;
}

.status-icon {
    font-size: 18px;
    flex-shrink: 0;
}

.status-icon.single {
    color: #64748b;
}

.status-icon.multiple {
    color: #38bdf8;
}

:deep(.t-switch) {
    --td-brand-color: #38bdf8;
}
</style>
