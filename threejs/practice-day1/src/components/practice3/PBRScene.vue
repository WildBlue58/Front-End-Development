<!-- ============================================================
     PBRScene.vue — Day 3 PBR 材质场景
============================================================ -->

<script setup lang="ts">
import { computed } from "vue";
import { TresCanvas } from "@tresjs/core";
import { OrbitControls } from "@tresjs/cientos";
import PBRSpheres from "./PBRSpheres.vue";
import { usePBRState } from "../../composables/usePBRState";

const { physicalPreset, viewMode, channelView } = usePBRState();

const presetLabel: Record<string, string> = {
    clearcoat: "Physical · 清漆层",
    glass: "Physical · 玻璃折射",
    velvet: "Physical · 天鹅绒",
    gold: "Physical · 黄金",
    chrome: "Physical · 铬合金",
    rubber: "Physical · 亚光橡胶",
    frosted_glass: "Physical · 磨砂玻璃",
    fabric: "Physical · 布料",
};

// 展台模式时用于 5 个球的标注
const showcaseLabels = [
    "全金属·光滑",
    "全金属·粗糙",
    "非金属·光滑",
    "非金属·粗糙",
    "半金属",
];

// 展台模式下相机向后退以容纳 5 个球
const cameraZ = computed(() => (viewMode.value === "showcase" ? 11 : 7));
</script>

<template>
    <div class="pbr-scene">
        <TresCanvas clear-color="#0f0f1a" window-size>
            <TresPerspectiveCamera :position="[0, 0, cameraZ]" :fov="55" />
            <OrbitControls :enable-damping="true" :damping-factor="0.05" />

            <TresAmbientLight :intensity="0.1" />
            <TresDirectionalLight
                :position="[4, 8, 5]"
                color="#ffffff"
                :intensity="1.8"
            />
            <TresPointLight
                :position="[-7, 2, 4]"
                color="#4f8cff"
                :intensity="15"
                :distance="20"
            />
            <TresPointLight
                :position="[7, 1, 4]"
                color="#ff6e3a"
                :intensity="15"
                :distance="20"
            />
            <TresHemisphereLight :args="['#b1e1ff', '#b97a20', 0.6]" />

            <PBRSpheres />
        </TresCanvas>

        <!-- 对比模式标注 -->
        <div class="sphere-labels" v-if="viewMode === 'compare'">
            <span class="label label-standard">Standard Material</span>
            <span class="label label-physical">{{
                presetLabel[physicalPreset] || "Physical"
            }}</span>
        </div>

        <!-- 展台模式标注（5个球） -->
        <div class="showcase-labels" v-if="viewMode === 'showcase'">
            <span
                v-for="(lb, i) in showcaseLabels"
                :key="i"
                class="label label-showcase"
                >{{ lb }}</span
            >
        </div>

        <!-- 通道可视化提醒 -->
        <div class="channel-badge" v-if="channelView !== 'none'">
            🔍 通道可视化：{{ channelView.toUpperCase() }}
        </div>
    </div>
</template>

<style scoped>
.pbr-scene {
    position: absolute;
    inset: 0;
}

/* 对比模式标注 */
.sphere-labels {
    position: absolute;
    bottom: 56px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 160px;
    pointer-events: none;
}

/* 展台模式标注 */
.showcase-labels {
    position: absolute;
    bottom: 56px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 0;
    pointer-events: none;
}
.showcase-labels > .label {
    flex: 1;
    text-align: center;
    max-width: 110px;
}

.label {
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 6px;
    backdrop-filter: blur(6px);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    white-space: nowrap;
}

.label-standard {
    color: rgba(165, 180, 252, 0.8);
    background: rgba(99, 102, 241, 0.12);
    border: 1px solid rgba(99, 102, 241, 0.2);
}
.label-physical {
    color: rgba(167, 139, 250, 0.9);
    background: rgba(139, 92, 246, 0.15);
    border: 1px solid rgba(139, 92, 246, 0.25);
}
.label-showcase {
    color: rgba(148, 163, 184, 0.8);
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 10px;
}

/* 通道可视化徽标 */
.channel-badge {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: #fde68a;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.35);
    padding: 4px 16px;
    border-radius: 20px;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    backdrop-filter: blur(6px);
}
</style>
