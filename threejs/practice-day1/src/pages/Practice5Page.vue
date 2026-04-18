<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import InteractiveScene from "../components/practice5/InteractiveScene.vue";
import InteractionControlPanel from "../components/practice5/InteractionControlPanel.vue";
import SceneHud from "../components/practice5/SceneHud.vue";
import { useInteractiveSceneState } from "../composables/useInteractiveSceneState";

const { initializeInteractiveSceneState, releaseDrag } = useInteractiveSceneState();

const pageRoot = ref<HTMLElement | null>(null);
let introObserver: ResizeObserver | null = null;

function updateIntroOffset() {
    const root = pageRoot.value;
    if (!root) return;
    const introCard = root.querySelector(".scene-intro") as HTMLElement | null;
    const introHeight = introCard?.offsetHeight ?? 0;
    root.style.setProperty("--practice5-intro-height", `${introHeight}px`);
}

onMounted(async () => {
    initializeInteractiveSceneState();
    window.addEventListener("pointerup", releaseDrag);
    window.addEventListener("pointercancel", releaseDrag);
    window.addEventListener("resize", updateIntroOffset);

    await nextTick();
    updateIntroOffset();

    const introCard = pageRoot.value?.querySelector(".scene-intro") as HTMLElement | null;
    if (introCard && "ResizeObserver" in window) {
        introObserver = new ResizeObserver(() => updateIntroOffset());
        introObserver.observe(introCard);
    }
});

onBeforeUnmount(() => {
    window.removeEventListener("pointerup", releaseDrag);
    window.removeEventListener("pointercancel", releaseDrag);
    window.removeEventListener("resize", updateIntroOffset);
    introObserver?.disconnect();
    introObserver = null;
    releaseDrag();
});
</script>

<template>
    <div ref="pageRoot" class="practice5-page">
        <InteractiveScene />
        <InteractionControlPanel />
        <SceneHud />
    </div>
</template>

<style scoped>
.practice5-page {
    --practice5-intro-height: 300px;
    position: relative;
    width: 100%;
    height: 100%;
}
</style>

