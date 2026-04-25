<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import PerformanceScene from "../components/practice6/PerformanceScene.vue";
import PerformanceControlPanel from "../components/practice6/PerformanceControlPanel.vue";
import PerformanceHud from "../components/practice6/PerformanceHud.vue";
import { usePerformanceSceneState } from "../composables/usePerformanceSceneState";

const { resetPerformanceSceneState } = usePerformanceSceneState();
const pageRoot = ref<HTMLElement | null>(null);
let introObserver: ResizeObserver | null = null;

function updateIntroOffset() {
    const root = pageRoot.value;
    if (!root) return;

    const introCard = root.querySelector(".scene-intro") as HTMLElement | null;
    const introHeight = introCard?.offsetHeight ?? 0;
    root.style.setProperty("--practice6-intro-height", `${introHeight}px`);
}

onMounted(async () => {
    resetPerformanceSceneState();
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
    window.removeEventListener("resize", updateIntroOffset);
    introObserver?.disconnect();
    introObserver = null;
});
</script>

<template>
    <div ref="pageRoot" class="practice6-page">
        <PerformanceScene />
        <PerformanceControlPanel />
        <PerformanceHud />
    </div>
</template>

<style scoped>
.practice6-page {
    --practice6-intro-height: 320px;
    position: relative;
    width: 100%;
    height: 100%;
    background: #020617;
}
</style>
