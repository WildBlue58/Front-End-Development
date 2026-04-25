<script setup lang="ts">
import ProductShowcaseScene from "../components/practice8/ProductShowcaseScene.vue";
import ProductConfigPanel from "../components/practice8/ProductConfigPanel.vue";
import ProductShowcaseHud from "../components/practice8/ProductShowcaseHud.vue";
import SolutionCompareCard from "../components/practice8/SolutionCompareCard.vue";
import { useProductShowcaseState } from "../composables/useProductShowcaseState";

const { state, currentVariant, heroSummary, setRenderMode, resetProductShowcaseState } = useProductShowcaseState();
resetProductShowcaseState();
</script>

<template>
    <div class="practice8-page">
        <header class="hero-card">
            <div>
                <p class="hero-eyebrow">Day 8 · Premium Product Showcase</p>
                <h1>综合 3D 产品展示页</h1>
                <p class="hero-copy">把前 7 天的模型加载、材质控制、交互、性能和资产管线收束到一个可交付页面里：默认走本地渲染，同时保留 Sketchfab 备用链路、热点讲解、机位预设和方案说明。</p>
            </div>
            <div class="hero-actions">
                <button class="hero-button" :class="{ active: state.renderMode === 'local' }" @click="setRenderMode('local')">本地渲染</button>
                <button class="hero-button" :class="{ active: state.renderMode === 'sketchfab' }" @click="setRenderMode('sketchfab')">Sketchfab 备用</button>
                <div class="hero-pill">
                    <span>{{ currentVariant.label }}</span>
                    <strong>{{ heroSummary }}</strong>
                </div>
            </div>
        </header>

        <main class="workspace">
            <ProductShowcaseScene />
            <ProductConfigPanel />
            <ProductShowcaseHud />
        </main>

        <SolutionCompareCard />
    </div>
</template>

<style scoped>
.practice8-page { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; gap: 18px; width: 100%; height: 100%; padding: 18px; box-sizing: border-box; background: radial-gradient(circle at top, rgba(15, 23, 42, 0.96) 0%, rgba(2, 6, 23, 1) 52%), linear-gradient(180deg, #020617 0%, #020617 100%); }
.hero-card,.workspace { border-radius: 28px; border: 1px solid rgba(148, 163, 184, 0.14); background: rgba(3, 7, 18, 0.72); backdrop-filter: blur(14px); box-shadow: 0 24px 80px rgba(2, 6, 23, 0.38); }
.hero-card { display: flex; justify-content: space-between; gap: 24px; padding: 20px 24px; }
.hero-eyebrow { margin: 0 0 8px; color: #7dd3fc; letter-spacing: 0.18em; text-transform: uppercase; font-size: 11px; }
.hero-card h1 { margin: 0; font-size: 34px; line-height: 1.1; color: #f8fafc; }
.hero-copy { max-width: 820px; margin: 12px 0 0; color: #cbd5e1; line-height: 1.76; font-size: 14px; }
.hero-actions { display: grid; gap: 12px; align-content: start; justify-items: end; min-width: 320px; }
.hero-button { min-height: 40px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.18); background: rgba(15, 23, 42, 0.82); color: #cbd5e1; cursor: pointer; }
.hero-button.active { border-color: rgba(56, 189, 248, 0.4); background: rgba(14, 165, 233, 0.18); color: #e0f2fe; }
.hero-pill { display: grid; gap: 6px; max-width: 320px; padding: 12px 14px; border-radius: 18px; background: rgba(2, 6, 23, 0.72); border: 1px solid rgba(125, 211, 252, 0.16); }
.hero-pill span { color: #7dd3fc; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; }
.hero-pill strong { color: #f8fafc; font-size: 13px; line-height: 1.7; }
.workspace { position: relative; min-height: 0; overflow: hidden; }
@media (max-width: 980px) { .practice8-page { padding: 16px; } .hero-card { flex-direction: column; } .hero-actions { justify-items: start; min-width: 0; } }
@media (max-width: 640px) { .hero-card h1 { font-size: 28px; } }
</style>
