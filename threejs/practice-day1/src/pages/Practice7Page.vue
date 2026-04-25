<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import AssetPipelineScene from "../components/practice7/AssetPipelineScene.vue";
import AssetPipelineControlPanel from "../components/practice7/AssetPipelineControlPanel.vue";
import AssetPipelineHud from "../components/practice7/AssetPipelineHud.vue";
import { useAssetPipelineState } from "../composables/useAssetPipelineState";

const { resetAssetPipelineState } = useAssetPipelineState();
resetAssetPipelineState();
const pageRoot = ref<HTMLElement | null>(null);
let introObserver: ResizeObserver | null = null;


function updateIntroOffset() {
    const root = pageRoot.value;
    if (!root) return;
    const introCard = root.querySelector(".scene-intro") as HTMLElement | null;
    const introHeight = introCard?.offsetHeight ?? 0;
    root.style.setProperty("--practice7-intro-height", `${introHeight}px`);
}

onMounted(async () => {
    resetAssetPipelineState();
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
    <div ref="pageRoot" class="practice7-page">
        <AssetPipelineScene />
        <AssetPipelineControlPanel />
        <AssetPipelineHud />
    </div>
</template>

<style scoped>
.practice7-page {
    --practice7-intro-height: 336px;
    position: relative;
    width: 100%;
    height: 100%;
    background: #020617;
}
</style>
