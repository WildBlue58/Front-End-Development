<!-- ============================================================
     PBRScene.vue — Day 3 PBR 材质场景

     职责：
     → TresCanvas 容器 + 灯光系统
     → 渲染 PBRSpheres（双球对比）
     → 球体底部标注文字（HTML overlay）
============================================================ -->

<script setup lang="ts">
import { TresCanvas } from "@tresjs/core";
import { OrbitControls } from "@tresjs/cientos";
import PBRSpheres from "./PBRSpheres.vue";
import { usePBRState } from "../../composables/usePBRState";

const { physicalPreset } = usePBRState();

/** 右球标签文字（随预设变化）*/
const presetLabel: Record<string, string> = {
    clearcoat: "Physical · 清漆层",
    glass: "Physical · 玻璃折射",
    velvet: "Physical · 天鹅绒",
};
</script>

<template>
    <div class="pbr-scene">
        <TresCanvas clear-color="#0f0f1a" window-size>
            <TresPerspectiveCamera :position="[0, 0, 7]" :fov="50" />
            <OrbitControls :enable-damping="true" :damping-factor="0.05" />

            <!--
                灯光系统：多彩组合光
                无 HDR 文件时也能清晰展示 PBR 差异
            -->
            <!-- 环境光（极低，让暗部不死黑）-->
            <TresAmbientLight :intensity="0.1" />

            <!-- 主方向光（顶侧，白色）-->
            <TresDirectionalLight
                :position="[4, 8, 5]"
                color="#ffffff"
                :intensity="1.8"
            />

            <!-- 蓝色补光（左侧，冷色）-->
            <TresPointLight
                :position="[-7, 2, 4]"
                color="#4f8cff"
                :intensity="15"
                :distance="20"
            />

            <!-- 橙色补光（右侧，暖色）-->
            <TresPointLight
                :position="[7, 1, 4]"
                color="#ff6e3a"
                :intensity="15"
                :distance="20"
            />

            <!-- 天空/地面半球光（模拟环境漫反射）-->
            <TresHemisphereLight :args="['#b1e1ff', '#b97a20', 0.6]" />

            <!-- 双球渲染（含 HDR 加载逻辑）-->
            <PBRSpheres />
        </TresCanvas>

        <!-- 球体底部标注（HTML overlay，不占用 WebGL 资源）-->
        <div class="sphere-labels">
            <span class="label label-standard">Standard Material</span>
            <span class="label label-physical">{{
                presetLabel[physicalPreset]
            }}</span>
        </div>

        <!-- HDR 提示 -->
        <div class="hdr-tip">
            放置 <code>public/hdr/studio.hdr</code> 可启用 HDR 环境反射
        </div>
    </div>
</template>

<style scoped>
.pbr-scene {
    position: absolute;
    inset: 0;
}

/* 球体标注 */
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

.label {
    font-size: 12px;
    padding: 4px 14px;
    border-radius: 6px;
    backdrop-filter: blur(6px);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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

/* HDR 提示 */
.hdr-tip {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    color: #475569;
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.hdr-tip code {
    color: #64748b;
    font-size: 11px;
    background: rgba(255, 255, 255, 0.05);
    padding: 1px 5px;
    border-radius: 3px;
}
</style>
