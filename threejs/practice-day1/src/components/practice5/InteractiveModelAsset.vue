<script setup lang="ts">
import { computed, watch } from "vue";
import { useGLTF } from "@tresjs/cientos";
import * as THREE from "three";
import type { InteractiveObjectId } from "../../composables/practice5SceneCatalog";
import { useInteractiveSceneState } from "../../composables/useInteractiveSceneState";

const props = defineProps<{
    objectId: InteractiveObjectId;
}>();

const { sceneObjects, activeObjectId, hoveredObjectId, setHoveredObject, setActiveObject, armDrag, setActiveModelPart, shouldIgnoreSelectionClick } = useInteractiveSceneState();
const objectState = computed(() => sceneObjects[props.objectId]);
const isActive = computed(() => activeObjectId.value === props.objectId);
const isHovered = computed(() => hoveredObjectId.value === props.objectId);
const modelPath = computed(() => objectState.value.modelPath ?? "/models/2014_porsche_911_turbo_991.glb");
const groupPosition = computed<[number, number, number]>(() => [objectState.value.position.x, objectState.value.position.y, objectState.value.position.z]);
const groupRotation = computed<[number, number, number]>(() => [objectState.value.rotation.x, objectState.value.rotation.y, objectState.value.rotation.z]);
const groupScale = computed<[number, number, number]>(() => {
    const scalar = objectState.value.scale * (objectState.value.baseScale ?? 1);
    return [scalar, scalar, scalar];
});


const { state } = useGLTF(modelPath);
const model = computed(() => state.value?.scene ?? null);

function onPointerMove() {
    setHoveredObject(props.objectId);
}

function onPointerLeave() {
    setHoveredObject(null);
}

function onPointerDown() {
    armDrag(props.objectId);
}

function onClick(event: unknown) {
    if (shouldIgnoreSelectionClick()) return;
    const rawName = (event as { object?: { name?: string } }).object?.name ?? "car-body";
    setActiveObject(props.objectId);
    setActiveModelPart(props.objectId, rawName);
}

function syncModelMaterial() {
    if (!model.value) return;
    const stateMaterial = objectState.value.material;
    const highlightColor = isActive.value ? "#f59e0b" : isHovered.value ? objectState.value.accent : stateMaterial.color;
    const emissiveColor = isActive.value ? "#f59e0b" : isHovered.value ? objectState.value.accent : stateMaterial.emissive;

    model.value.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh || !mesh.material) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
            const standardMaterial = material as THREE.MeshStandardMaterial;
            if (standardMaterial.color) standardMaterial.color.set(highlightColor);
            if ("metalness" in standardMaterial) standardMaterial.metalness = stateMaterial.metalness;
            if ("roughness" in standardMaterial) standardMaterial.roughness = stateMaterial.roughness;
            if ("wireframe" in standardMaterial) standardMaterial.wireframe = stateMaterial.wireframe;
            if (standardMaterial.emissive) standardMaterial.emissive.set(emissiveColor);
            if ("emissiveIntensity" in standardMaterial) {
                standardMaterial.emissiveIntensity = Math.max(stateMaterial.emissiveIntensity, isActive.value ? 0.42 : isHovered.value ? 0.18 : stateMaterial.emissiveIntensity);
            }
            if ("opacity" in standardMaterial) {
                standardMaterial.opacity = stateMaterial.opacity;
                standardMaterial.transparent = stateMaterial.opacity < 1;
            }
            standardMaterial.needsUpdate = true;
        });
    });
}

watch(
    () => [
        model.value,
        objectState.value.material.color,
        objectState.value.material.metalness,
        objectState.value.material.roughness,
        objectState.value.material.emissive,
        objectState.value.material.emissiveIntensity,
        objectState.value.material.wireframe,
        objectState.value.material.opacity,
        isActive.value,
        isHovered.value,
    ],
    syncModelMaterial,
    { immediate: true },
);
</script>

<template>
    <TresGroup :position="groupPosition" :rotation="groupRotation" :scale="groupScale">
        <primitive
            v-if="model"
            :object="model"
            name="porsche-911"
            @pointermove.stop="onPointerMove"
            @pointerleave.stop="onPointerLeave"
            @pointerdown.stop="onPointerDown"

            @click.stop="onClick"
        />
    </TresGroup>
</template>
