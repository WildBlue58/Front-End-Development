<script setup lang="ts">
import { onBeforeUnmount, shallowRef, watch } from "vue";
import { useLoop } from "@tresjs/core";
import * as THREE from "three";
import {
    createHudMaterial,
    syncHudMaterial,
    type WaveMaterialInstance,
} from "./waveShaderFactory";
import type { WaveMaterialMode, WavePresetKey } from "../../composables/useWaveShaderState";

interface HudPanelSurfaceProps {
    colorA: string;
    colorB: string;
    preset: WavePresetKey;
    materialMode: WaveMaterialMode;
    hudIntensity: number;
    speed: number;
}

const props = defineProps<HudPanelSurfaceProps>();
const hudMaterial = shallowRef<WaveMaterialInstance | null>(null);

function rebuildMaterial() {
    const previousMaterial = hudMaterial.value;
    hudMaterial.value = createHudMaterial({
        colorA: props.colorA,
        colorB: props.colorB,
        preset: props.preset,
        materialMode: props.materialMode,
        hudIntensity: props.hudIntensity,
    });
    previousMaterial?.dispose();
}

function syncMaterial() {
    if (!hudMaterial.value) {
        return;
    }

    syncHudMaterial(hudMaterial.value, {
        colorA: props.colorA,
        colorB: props.colorB,
        preset: props.preset,
        hudIntensity: props.hudIntensity,
    });
}

watch(
    () => props.materialMode,
    () => {
        rebuildMaterial();
        syncMaterial();
    },
    { immediate: true },
);

watch(
    () => [props.colorA, props.colorB, props.preset, props.hudIntensity],
    syncMaterial,
    { immediate: true },
);

const { onBeforeRender } = useLoop();
onBeforeRender(({ elapsed }) => {
    if (!hudMaterial.value) {
        return;
    }
    const uniforms = hudMaterial.value.uniforms as Record<string, THREE.IUniform>;
    uniforms.uTime.value = elapsed * props.speed * 0.72;
});

onBeforeUnmount(() => {
    hudMaterial.value?.dispose();
});
</script>

<template>
    <TresMesh :position="[2.05, 0.36, -1.92]" :rotation="[0.08, -0.58, 0.02]">
        <TresPlaneGeometry :args="[1.7, 0.96, 1, 1]" />
        <primitive v-if="hudMaterial" :object="hudMaterial" attach="material" />
    </TresMesh>
</template>
