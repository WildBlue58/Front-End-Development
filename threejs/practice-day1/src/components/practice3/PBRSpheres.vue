<!-- ============================================================
     PBRSpheres.vue — 双球 PBR 渲染子组件

     必须作为 TresCanvas 的子组件使用（useTresContext 依赖 TresCanvas 上下文）

     职责：
     → 左球：MeshStandardMaterial
     → 右球：MeshPhysicalMaterial（按预设参数变化）
     → 尝试加载 /hdr/studio.hdr 作为环境贴图，失败时静默忽略
============================================================ -->

<script setup lang="ts">
import { computed, onMounted } from "vue";
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { useTresContext } from "@tresjs/core";
import { usePBRState } from "../../composables/usePBRState";

const {
    color,
    metalness,
    roughness,
    envMapIntensity,
    emissiveColor,
    emissiveIntensity,
    clearcoat,
    clearcoatRoughness,
    transmission,
    ior,
    sheenIntensity,
    sheenColor,
    iridescence,
    physicalPreset,
} = usePBRState();

// --- 获取 Three.js 底层上下文，用于加载 HDR 环境贴图 ---
const { renderer, scene } = useTresContext();

onMounted(() => {
    // 尝试加载 HDR 环境贴图（来源：public/hdr/studio.hdr）
    // 文件不存在时静默忽略，使用场景灯光代替
    try {
        const pmrem = new THREE.PMREMGenerator(
            renderer.value as THREE.WebGLRenderer,
        );
        pmrem.compileEquirectangularShader();

        const rgbeLoader = new RGBELoader();
        rgbeLoader.load(
            "/hdr/studio.hdr",
            (texture) => {
                const envTexture = pmrem.fromEquirectangular(texture).texture;
                (scene.value as THREE.Scene).environment = envTexture;
                texture.dispose();
                pmrem.dispose();
            },
            undefined,
            () => {
                // HDR 文件不存在时静默退出，使用灯光补偿
                pmrem.dispose();
            },
        );
    } catch {
        // useTresContext 之外调用或其他异常，忽略
    }
});

// --- 自发光颜色：强度为 0 时给黑色（避免暗场景中意外发光）---
const effectiveEmissive = computed(() =>
    emissiveIntensity.value > 0 ? emissiveColor.value : "#000000",
);

// --- 玻璃模式需要开启 transparent ---
const isGlass = computed(() => physicalPreset.value === "glass");
</script>

<template>
    <!-- 左球：MeshStandardMaterial -->
    <TresMesh :position="[-2.2, 0, 0]">
        <TresSphereGeometry :args="[1, 64, 64]" />
        <TresMeshStandardMaterial
            :color="color"
            :metalness="metalness"
            :roughness="roughness"
            :emissive="effectiveEmissive"
            :emissive-intensity="emissiveIntensity"
            :env-map-intensity="envMapIntensity"
        />
    </TresMesh>

    <!-- 右球：MeshPhysicalMaterial（随预设变化）-->
    <TresMesh :position="[2.2, 0, 0]">
        <TresSphereGeometry :args="[1, 64, 64]" />
        <TresMeshPhysicalMaterial
            :color="color"
            :metalness="metalness"
            :roughness="roughness"
            :clearcoat="clearcoat"
            :clearcoat-roughness="clearcoatRoughness"
            :transmission="transmission"
            :ior="ior"
            :sheen="sheenIntensity"
            :sheen-color="sheenColor"
            :iridescence="iridescence"
            :transparent="isGlass"
            :env-map-intensity="envMapIntensity"
        />
    </TresMesh>
</template>
