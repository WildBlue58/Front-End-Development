<!-- ============================================================
     App.vue — 主入口组件（路由版）
     
     重构后的 App.vue 负责：
     1. 顶部导航栏 — 切换 Practice1 / Practice2
     2. <router-view> — 渲染当前路由对应的页面
     
     原有 Practice1 代码完整保留在：
     - pages/Practice1Page.vue → 包装 SceneCanvas + ControlPanel
     - components/ — 所有原有组件不变
     - composables/useSceneState.ts — 不变
============================================================ -->

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

/** 导航项配置 */
const navItems = [
    { path: "/practice1", label: "Day 1：基础3D场景" },
    { path: "/practice2", label: "Day 2：模型加载与动画" },
    { path: "/practice3", label: "Day 3：PBR 材质" },
    { path: "/practice4", label: "Day 4：Shader 波浪" },
    { path: "/practice5", label: "Day 5：响应式 3D 交互" },
    { path: "/practice6", label: "Day 6：性能优化与后处理" },
    { path: "/practice7", label: "Day 7：资产管线实验台" },
    { path: "/practice8", label: "Day 8：综合产品展示页" },
];

/** 切换页面 */
function navigateTo(path: string) {
    router.push(path);
}
</script>

<template>
    <div class="app-container">
        <!-- 顶部导航栏 -->
        <nav class="top-nav">
            <div class="nav-left">
                <span class="nav-logo">■</span>
                <span class="nav-title">Three.js 练习</span>
            </div>
            <div class="nav-tabs">
                <button
                    v-for="item in navItems"
                    :key="item.path"
                    class="nav-tab"
                    :class="{
                        active:
                            route.path === item.path ||
                            (route.path === '/' && item.path === '/practice1'),
                    }"
                    @click="navigateTo(item.path)"
                >
                    {{ item.label }}
                </button>
            </div>
        </nav>

        <!-- 页面内容 -->
        <main class="main-content">
            <router-view />
        </main>
    </div>
</template>

<!-- 全局样式 -->
<style>
/* 重置浏览器默认边距 */
html,
body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #1a1a2e;
}

/* Vue 挂载点占满视口 */
#app {
    width: 100%;
    height: 100%;
}
</style>

<!-- 组件局部样式 -->
<style scoped>
.app-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
}

/* ---- 顶部导航栏 ---- */
.top-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    padding: 0 16px;
    background: rgba(20, 20, 40, 0.9);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 1000;
    flex-shrink: 0;
}

.nav-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.nav-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: #42b883;
    color: #fff;
    font-size: 14px;
    font-weight: bold;
    border-radius: 4px;
}

.nav-title {
    font-size: 14px;
    font-weight: 600;
    color: #e2e8f0;
}

.nav-tabs {
    display: flex;
    gap: 4px;
    max-width: calc(100vw - 180px);
    overflow-x: auto;
    scrollbar-width: none;
}

.nav-tabs::-webkit-scrollbar {
    display: none;
}

.nav-tab {
    padding: 6px 16px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    color: #94a3b8;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.nav-tab:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #cbd5e1;
}

.nav-tab.active {
    background: rgba(66, 184, 131, 0.15);
    border-color: rgba(66, 184, 131, 0.3);
    color: #42b883;
    font-weight: 500;
}

/* ---- 主内容区 ---- */
.main-content {
    flex: 1;
    position: relative;
    overflow: hidden;
}
</style>
