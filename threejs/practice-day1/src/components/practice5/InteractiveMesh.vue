<script setup lang="ts">
import { computed } from "vue";
import { useLoop } from "@tresjs/core";
import type { InteractiveObjectId } from "../../composables/practice5SceneCatalog";
import { useInteractiveSceneState } from "../../composables/useInteractiveSceneState";

const props = defineProps<{
    objectId: InteractiveObjectId;
}>();

const { sceneObjects, activeObjectId, hoveredObjectId, autoRotateSelected, dragState, setHoveredObject, setActiveObject, armDrag, shouldIgnoreSelectionClick } = useInteractiveSceneState();
const { onBeforeRender } = useLoop();

const objectState = computed(() => sceneObjects[props.objectId]);
const isActive = computed(() => activeObjectId.value === props.objectId);
const isHovered = computed(() => hoveredObjectId.value === props.objectId);
const displayColor = computed(() => (isActive.value ? "#f59e0b" : isHovered.value ? objectState.value.accent : objectState.value.material.color));
const emissiveColor = computed(() => (isActive.value ? "#f59e0b" : isHovered.value ? objectState.value.accent : objectState.value.material.emissive));
const emissiveIntensity = computed(() => Math.max(objectState.value.material.emissiveIntensity, isActive.value ? 0.34 : isHovered.value ? 0.16 : 0));
const meshScale = computed(() => objectState.value.scale);
const meshPosition = computed<[number, number, number]>(() => [objectState.value.position.x, objectState.value.position.y, objectState.value.position.z]);
const meshRotation = computed<[number, number, number]>(() => [objectState.value.rotation.x, objectState.value.rotation.y, objectState.value.rotation.z]);


function onPointerMove() {
    setHoveredObject(props.objectId);
}

function onPointerLeave() {
    setHoveredObject(null);
}

function onPointerDown() {
    armDrag(props.objectId);
}

function onClick() {
    if (shouldIgnoreSelectionClick()) return;
    setActiveObject(props.objectId);
}

onBeforeRender(({ delta }) => {
    if (!isActive.value || !autoRotateSelected.value || dragState.active) return;
    objectState.value.rotation.y += delta * (objectState.value.kind === "sphere" ? 0.55 : 0.85);
    if (objectState.value.rotation.y > Math.PI * 2) objectState.value.rotation.y -= Math.PI * 2;
});
</script>

<template>
    <TresMesh
        :position="meshPosition"
        :rotation="meshRotation"
        :scale="meshScale"
        :name="objectId"
        cast-shadow
        receive-shadow
        @pointermove.stop="onPointerMove"
        @pointerleave.stop="onPointerLeave"
        @pointerdown.stop="onPointerDown"

        @click.stop="onClick"
    >
        <TresBoxGeometry v-if="objectState.kind === 'box'" :args="[1.25, 1.25, 1.25]" />
        <TresSphereGeometry v-else :args="[0.72, 48, 48]" />
        <TresMeshStandardMaterial
            :color="displayColor"
            :metalness="objectState.material.metalness"
            :roughness="objectState.material.roughness"
            :wireframe="objectState.material.wireframe"
            :emissive="emissiveColor"
            :emissive-intensity="emissiveIntensity"
            :opacity="objectState.material.opacity"
            :transparent="objectState.material.opacity < 1"
        />
    </TresMesh>
</template>
