<!-- ============================================================
     SketchfabViewer.vue — 嵌入 Sketchfab 模型查看器

     核心功能：
     → 动态创建 iframe 嵌入 Sketchfab 模型
     → Sketchfab Viewer API 初始化与生命周期管理
     → 暴露 pauseAnimation / resumeAnimation 供父组件调用
     → onUnmounted 清理 iframe，防止内存泄漏
============================================================ -->

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps<{
    /** Sketchfab 模型 URL ID（32位十六进制字符串） */
    modelId: string;
}>();

const emit = defineEmits<{
    /** 模型加载完成，Viewer API 就绪 */
    ready: [];
}>();

const containerRef = ref<HTMLDivElement>();
let api: any = null;
let iframe: HTMLIFrameElement | null = null;

onMounted(() => {
    if (!containerRef.value) return;

    // 动态创建 iframe 并设置嵌入 URL
    iframe = document.createElement("iframe");
    iframe.src = `https://sketchfab.com/models/${props.modelId}/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0`;
    iframe.style.cssText = "width:100%;height:100%;border:none;display:block;";
    iframe.allow = "autoplay; fullscreen; xr-spatial-tracking";
    containerRef.value.appendChild(iframe);

    // 初始化 Sketchfab Viewer API
    const Sketchfab = (window as any).Sketchfab;
    if (!Sketchfab) {
        console.error(
            "[SketchfabViewer] Sketchfab API 未加载，请确认 index.html 已引入脚本",
        );
        return;
    }

    const client = new Sketchfab(iframe);
    client.init(props.modelId, {
        success: (sketchApi: any) => {
            api = sketchApi;
            api.start();
            api.addEventListener("viewerready", () => {
                emit("ready");
            });
        },
        error: () => {
            console.error(
                "[SketchfabViewer] 初始化失败，请检查模型 ID 是否正确",
            );
        },
    });
});

onUnmounted(() => {
    if (iframe && containerRef.value?.contains(iframe)) {
        containerRef.value.removeChild(iframe);
    }
    api = null;
    iframe = null;
});

/** 暂停 Sketchfab 模型动画 */
function pauseAnimation() {
    api?.pauseAnimation?.();
}

/** 恢复 Sketchfab 模型动画 */
function resumeAnimation() {
    api?.unpauseAnimation?.();
}

defineExpose({ pauseAnimation, resumeAnimation });
</script>

<template>
    <div ref="containerRef" class="sf-viewer" />
</template>

<style scoped>
.sf-viewer {
    width: 100%;
    height: 100%;
}
</style>
