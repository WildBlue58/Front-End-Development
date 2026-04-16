<!-- ============================================================
     Practice2Page.vue — Day 2 模型加载与动画控制页面
     
     功能：
     → GLB 模型加载（useGLTF + primitive）
     → 双模型切换
     → 动画播放/暂停/切换/速度调节
     → 相机视角预设切换
     → OrbitControls 交互
     → 加载状态显示
============================================================ -->

<script setup lang="ts">
import ModelScene from "../components/practice2/ModelScene.vue";
import ModelControlPanel from "../components/practice2/ModelControlPanel.vue";
import SketchfabViewer from "../components/practice2/SketchfabViewer.vue";
import { ref } from "vue";

/** 当前激活视图：'local' = 本地模型，'sketchfab' = Sketchfab 在线 */
const activeView = ref<"local" | "sketchfab">("local");

// 保时捷 911 Carrera 4S Sketchfab 公开模型 ID（FREE）
const PORSCHE_SKETCHFAB_ID = "d01b254483794de3819786d93e0e1ebf";
const sfRef = ref<InstanceType<typeof SketchfabViewer> | null>(null);
const sfReady = ref(false);
const sfPaused = ref(false);

function onSfReady() {
    sfReady.value = true;
}

function toggleSfAnimation() {
    if (!sfReady.value) return;
    if (sfPaused.value) {
        sfRef.value?.resumeAnimation();
        sfPaused.value = false;
    } else {
        sfRef.value?.pauseAnimation();
        sfPaused.value = true;
    }
}
</script>

<template>
    <div class="practice2-page">
        <!-- 视图切换 Tab 栏 -->
        <div class="view-tabs">
            <button
                class="view-tab"
                :class="{ active: activeView === 'local' }"
                @click="activeView = 'local'"
            >
                📦 本地模型
            </button>
            <button
                class="view-tab"
                :class="{ active: activeView === 'sketchfab' }"
                @click="activeView = 'sketchfab'"
            >
                🌐 Sketchfab 在线
            </button>

            <!-- Sketchfab 动画控制（仅 Sketchfab 模式显示） -->
            <Transition name="fade-ctrl">
                <button
                    v-if="activeView === 'sketchfab'"
                    class="sf-ctrl-btn"
                    :disabled="!sfReady"
                    @click="toggleSfAnimation"
                >
                    {{
                        sfReady ? (sfPaused ? "▶ 继续" : "⏸ 暂停") : "加载中..."
                    }}
                </button>
            </Transition>
        </div>

        <!-- 本地模型视图 -->
        <div v-show="activeView === 'local'" class="view-pane">
            <ModelScene />
            <ModelControlPanel />
        </div>

        <!-- Sketchfab 在线视图（v-show 保持 iframe 不重载） -->
        <div v-show="activeView === 'sketchfab'" class="view-pane sf-pane">
            <SketchfabViewer
                ref="sfRef"
                :model-id="PORSCHE_SKETCHFAB_ID"
                @ready="onSfReady"
            />
        </div>
    </div>
</template>

<style scoped>
.practice2-page {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
}

/* ---- Tab 栏 ---- */
.view-tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    background: rgba(10, 10, 26, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
    z-index: 200;
}

.view-tab {
    padding: 6px 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    color: #64748b;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.view-tab:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #94a3b8;
}

.view-tab.active {
    background: rgba(99, 102, 241, 0.15);
    border-color: #6366f1;
    color: #e2e8f0;
}

/* Sketchfab 暂停按钮（右侧对齐） */
.sf-ctrl-btn {
    margin-left: auto;
    padding: 5px 14px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 6px;
    color: #818cf8;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.sf-ctrl-btn:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.3);
    border-color: #6366f1;
}

.sf-ctrl-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* 按钮淡入淡出 */
.fade-ctrl-enter-active,
.fade-ctrl-leave-active {
    transition: opacity 0.2s ease;
}
.fade-ctrl-enter-from,
.fade-ctrl-leave-to {
    opacity: 0;
}

/* ---- 视图面板 ---- */
.view-pane {
    position: relative;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}

.sf-pane {
    background: #0d0d1a;
}
</style>
