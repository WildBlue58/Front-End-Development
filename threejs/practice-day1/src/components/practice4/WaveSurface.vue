<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import { useLoop } from "@tresjs/core";
import * as THREE from "three";
import {
    createWaveMaterial,
    syncWaveMaterial,
    type WaveMaterialInstance,
} from "./waveShaderFactory";
import type { WaveMaterialMode, WavePresetKey } from "../../composables/useWaveShaderState";

interface WaveSurfaceProps {
    amplitude: number;
    frequency: number;
    speed: number;
    fresnelPower: number;
    scanStrength: number;
    colorA: string;
    colorB: string;
    wireframe: boolean;
    preset: WavePresetKey;
    materialMode: WaveMaterialMode;
    rippleStrength: number;
    rippleRadius: number;
    normalDetailStrength: number;
    interactiveRipple: boolean;
    normalDetailEnabled: boolean;
    planeSize?: number;
    planeSegments?: number;
}

const props = withDefaults(defineProps<WaveSurfaceProps>(), {
    planeSize: 5.2,
    planeSegments: 256,
});

const waveMaterial = shallowRef<WaveMaterialInstance | null>(null);
const pointerTarget = new THREE.Vector2(-2, -2);
const pointerCurrent = new THREE.Vector2(-2, -2);
const fallbackNormalTexture = createFallbackNormalTexture();
const normalTexture = shallowRef<THREE.Texture>(fallbackNormalTexture);
let pointerActive = 0;

function createFallbackNormalTexture() {
    const data = new Uint8Array([128, 128, 255, 255]);
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.LinearSRGBColorSpace;
    return texture;
}

function rebuildMaterial() {
    const previousMaterial = waveMaterial.value;
    waveMaterial.value = createWaveMaterial({
        amplitude: props.amplitude,
        frequency: props.frequency,
        fresnelPower: props.fresnelPower,
        scanStrength: props.scanStrength,
        colorA: props.colorA,
        colorB: props.colorB,
        preset: props.preset,
        materialMode: props.materialMode,
        rippleStrength: props.rippleStrength,
        rippleRadius: props.rippleRadius,
        normalDetailStrength: props.normalDetailStrength,
        interactiveRipple: props.interactiveRipple,
        normalDetailEnabled: props.normalDetailEnabled,
        normalMap: normalTexture.value,
        wireframe: props.wireframe,
    });
    previousMaterial?.dispose();
}

function syncMaterial() {
    if (!waveMaterial.value) {
        return;
    }

    syncWaveMaterial(waveMaterial.value, {
        amplitude: props.amplitude,
        frequency: props.frequency,
        fresnelPower: props.fresnelPower,
        scanStrength: props.scanStrength,
        colorA: props.colorA,
        colorB: props.colorB,
        preset: props.preset,
        rippleStrength: props.rippleStrength,
        rippleRadius: props.rippleRadius,
        normalDetailStrength: props.normalDetailStrength,
        interactiveRipple: props.interactiveRipple,
        normalDetailEnabled: props.normalDetailEnabled,
        normalMap: normalTexture.value,
        wireframe: props.wireframe,
    });
}

function handlePointerMove(event: unknown) {
    const uv = (event as { uv?: THREE.Vector2 | null }).uv;
    if (!props.interactiveRipple || !uv) {
        return;
    }
    pointerTarget.copy(uv);
}

function handlePointerLeave() {
    pointerTarget.set(-2, -2);
}

watch(
    () => [props.materialMode, props.wireframe],
    () => {
        rebuildMaterial();
        syncMaterial();
    },
    { immediate: true },
);

watch(
    () => [
        props.amplitude,
        props.frequency,
        props.fresnelPower,
        props.scanStrength,
        props.colorA,
        props.colorB,
        props.preset,
        props.rippleStrength,
        props.rippleRadius,
        props.normalDetailStrength,
        props.interactiveRipple,
        props.normalDetailEnabled,
        props.wireframe,
    ],
    syncMaterial,
    { immediate: true },
);

watch(normalTexture, syncMaterial);

onMounted(() => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        "/textures/normal.png",
        (texture) => {
            texture.colorSpace = THREE.LinearSRGBColorSpace;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.anisotropy = 4;
            normalTexture.value = texture;
            fallbackNormalTexture.dispose();
        },
        undefined,
        (error) => {
            console.error("[Practice4] normal.png 加载失败", error);
        },
    );
});

const { onBeforeRender } = useLoop();
onBeforeRender(({ elapsed, delta }) => {
    if (!waveMaterial.value) {
        return;
    }

    const uniforms = waveMaterial.value.uniforms as Record<string, THREE.IUniform>;
    pointerCurrent.lerp(pointerTarget, Math.min(1, delta * 8));
    pointerActive = THREE.MathUtils.lerp(
        pointerActive,
        props.interactiveRipple && pointerTarget.x >= 0 && pointerTarget.x <= 1 ? 1 : 0,
        Math.min(1, delta * 7),
    );

    uniforms.uTime.value = elapsed * props.speed;
    (uniforms.uPointer.value as THREE.Vector2).copy(pointerCurrent);
    uniforms.uPointerActive.value = pointerActive;
    uniforms.uInteractiveRipple.value = props.interactiveRipple ? 1 : 0;
});

onBeforeUnmount(() => {
    waveMaterial.value?.dispose();
    normalTexture.value.dispose();
});
</script>

<template>
    <TresMesh
        :rotation="[-Math.PI / 2.15, 0, 0]"
        :position="[0, -0.28, 0]"
        @pointermove="handlePointerMove"
        @pointerleave="handlePointerLeave"

    >
        <TresPlaneGeometry :args="[planeSize, planeSize, planeSegments, planeSegments]" />
        <primitive v-if="waveMaterial" :object="waveMaterial" attach="material" />
    </TresMesh>
</template>
