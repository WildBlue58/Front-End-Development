import { computed, reactive } from "vue";

export type RenderMode = "local" | "sketchfab";
export type ShowcaseVariantKey = "standard" | "sport" | "luxury";
export type CameraPresetKey = "front" | "side" | "detail" | "exploded";
export type HotspotId = "body" | "lighting" | "rims" | "cockpit";

export interface CameraPreset { key: CameraPresetKey; label: string; position: [number, number, number]; target: [number, number, number]; copy: string; }
export interface HotspotDescriptor { id: HotspotId; label: string; keywords: string[]; copy: string; }
export interface VariantDescriptor { key: ShowcaseVariantKey; label: string; accent: string; focus: string; copy: string; preset: CameraPresetKey; metallic: number; roughness: number; showInternal: boolean; }
export interface CostEntry { route: string; quality: string; latency: string; ops: string; fit: string; verdict: string; }

interface ShowcaseState {
    renderMode: RenderMode;
    variant: ShowcaseVariantKey;
    currentColor: string;
    autoRotate: boolean;
    wireframe: boolean;
    bloom: boolean;
    focusLabel: string;
    activeHotspot: HotspotId | null;
    cameraPreset: CameraPresetKey;
    localReady: boolean;
    sketchfabReady: boolean;
    degradeMode: boolean;
    pixelRatioCap: number;
    statusMessage: string;
    metadata: Array<{ label: string; value: string }>;
}

export const sketchfabModelId = "d01b254483794de3819786d93e0e1ebf";
export const cameraPresets: CameraPreset[] = [
    { key: "front", label: "正面", position: [0, 1.5, 4.8], target: [0, 0.55, 0], copy: "用于主视觉展示与首屏开场。" },
    { key: "side", label: "侧面", position: [4.6, 1.35, 0.9], target: [0, 0.55, 0], copy: "更适合看轮毂比例与车身线条。" },
    { key: "detail", label: "细节", position: [2.2, 1.15, 2.2], target: [1.1, 0.75, 1.1], copy: "聚焦灯组、漆面和高光层次。" },
    { key: "exploded", label: "爆炸图", position: [0.2, 2.4, 6], target: [0, 0.6, 0], copy: "用于讲解部件关系与工程结构。" },
];
export const hotspots: HotspotDescriptor[] = [
    { id: "body", label: "车漆系统", keywords: ["carpaint", "chassis", "plas_s"], copy: "主色、粗糙度和镜面高光会一起定义产品第一眼质感。" },
    { id: "lighting", label: "灯组细节", keywords: ["light", "light_r", "glass_light"], copy: "这里最适合展示 bloom、玻璃层和 emissive 的差异。" },
    { id: "rims", label: "轮毂与制动", keywords: ["rims", "rim_color", "disk", "tire"], copy: "轮毂颜色、金属感和轮胎橡胶决定运动版气质。" },
    { id: "cockpit", label: "座舱与内部", keywords: ["internal", "emiss1", "mirrors"], copy: "高配版会把更多注意力给到内饰与局部材质层次。" },
];
export const variants: VariantDescriptor[] = [
    { key: "standard", label: "标准版", accent: "#38bdf8", focus: "整机预览", copy: "强调稳定加载和默认展示链路。", preset: "front", metallic: 0.42, roughness: 0.38, showInternal: false },
    { key: "sport", label: "运动版", accent: "#ef4444", focus: "运动化外观", copy: "更锐利的轮毂、灯组和高对比漆面。", preset: "side", metallic: 0.58, roughness: 0.24, showInternal: false },
    { key: "luxury", label: "高配版", accent: "#f59e0b", focus: "高级质感与座舱", copy: "提高金属度并开放内部展示。", preset: "detail", metallic: 0.72, roughness: 0.2, showInternal: true },
];
export const costEntries: CostEntry[] = [
    { route: "纯 Web", quality: "高", latency: "低", ops: "低", fit: "前端业务深度整合", verdict: "当前首选" },
    { route: "Unity WebGL", quality: "更高", latency: "中", ops: "中", fit: "已有 Unity 资产团队", verdict: "复用导向" },
    { route: "Pixel Streaming", quality: "最高", latency: "高", ops: "高", fit: "追求极致画质演示", verdict: "重型方案" },
];

function defaultMetadata() {
    return [
        { label: "发布模型", value: "/models/2014_porsche_911_turbo_991.glb" },
        { label: "资源策略", value: "延续 Day 7 的 raw / release / optimize 思路" },
        { label: "HDR 环境", value: "/hdr/studio.hdr" },
        { label: "Sketchfab 备份", value: sketchfabModelId },
    ];
}

const state = reactive<ShowcaseState>({
    renderMode: "local",
    variant: "standard",
    currentColor: variants[0].accent,
    autoRotate: true,
    wireframe: false,
    bloom: true,
    focusLabel: variants[0].focus,
    activeHotspot: null,
    cameraPreset: variants[0].preset,
    localReady: false,
    sketchfabReady: false,
    degradeMode: false,
    pixelRatioCap: 1.45,
    statusMessage: "等待综合展示页初始化",
    metadata: defaultMetadata(),
});

export const currentVariant = computed(() => variants.find((item) => item.key === state.variant) ?? variants[0]);
export const currentPreset = computed(() => cameraPresets.find((item) => item.key === state.cameraPreset) ?? cameraPresets[0]);
export const currentHotspot = computed(() => hotspots.find((item) => item.id === state.activeHotspot) ?? null);
export const heroSummary = computed(() => state.renderMode === "sketchfab" ? "当前使用 Sketchfab 备用方案，适合快速外链验证与内容嵌入。" : state.bloom ? "当前使用本地渲染 + 后处理链路，优先展示质感与聚焦讲解。" : "当前使用本地渲染轻量模式，优先保证移动端稳定。");
export const degradeSummary = computed(() => state.degradeMode ? `已启用移动端降级：像素比上限 ${state.pixelRatioCap.toFixed(2)}，并优先关闭高成本效果。` : `桌面预设在线：像素比上限 ${state.pixelRatioCap.toFixed(2)}，可保留 bloom 与热点讲解。`);

export function applyVariant(key: ShowcaseVariantKey) {
    const next = variants.find((item) => item.key === key);
    if (!next) return;
    state.variant = key;
    state.currentColor = next.accent;
    state.focusLabel = next.focus;
    state.cameraPreset = next.preset;
    state.bloom = next.key !== "standard" || !state.degradeMode;
    state.statusMessage = `已切换到 ${next.label}，颜色、镜头和展示重点已一起更新。`;
}
export function setRenderMode(mode: RenderMode) {
    state.renderMode = mode;
    state.focusLabel = mode === "sketchfab" ? "Sketchfab 外部预览" : currentVariant.value.focus;
    state.statusMessage = mode === "sketchfab" ? "已切到外部 Viewer 方案，方便验证备用链路。" : `已回到本地渲染，当前机位：${currentPreset.value.label}。`;
}
export function setCurrentColor(color: string) {
    state.currentColor = color;
    state.statusMessage = `当前颜色已切换到 ${color}，本地材质会实时更新。`;
}
export function patchDisplay(partial: Partial<Pick<ShowcaseState, "autoRotate" | "wireframe" | "bloom">>) {
    Object.assign(state, partial);
}
export function setCameraPreset(key: CameraPresetKey) {
    state.cameraPreset = key;
    state.statusMessage = `机位已切到 ${currentPreset.value.label}：${currentPreset.value.copy}`;
}
export function setActiveHotspot(id: HotspotId | null) {
    state.activeHotspot = id;
    state.focusLabel = id ? hotspots.find((item) => item.id === id)?.label ?? currentVariant.value.focus : currentVariant.value.focus;
}
export function setLocalReady(ready: boolean) { state.localReady = ready; }
export function setSketchfabReady(ready: boolean) { state.sketchfabReady = ready; }
export function setStatusMessage(message: string) { state.statusMessage = message; }
export function applyResponsiveDowngrade(enabled: boolean) {
    state.degradeMode = enabled;
    state.pixelRatioCap = enabled ? 1 : 1.45;
    if (enabled) {
        state.wireframe = false;
        state.bloom = false;
        state.statusMessage = "检测到移动端 / 小屏环境，已自动关闭高成本特效并降低像素比。";
    }
}
export function resetProductShowcaseState() {
    Object.assign(state, {
        renderMode: "local",
        variant: "standard",
        currentColor: variants[0].accent,
        autoRotate: true,
        wireframe: false,
        bloom: true,
        focusLabel: variants[0].focus,
        activeHotspot: null,
        cameraPreset: variants[0].preset,
        localReady: false,
        sketchfabReady: false,
        degradeMode: false,
        pixelRatioCap: 1.45,
        statusMessage: "等待综合展示页初始化",
        metadata: defaultMetadata(),
    });
}

export function useProductShowcaseState() {
    return {
        state,
        variants,
        hotspots,
        costEntries,
        cameraPresets,
        sketchfabModelId,
        currentVariant,
        currentPreset,
        currentHotspot,
        heroSummary,
        degradeSummary,
        applyVariant,
        setRenderMode,
        setCurrentColor,
        patchDisplay,
        setCameraPreset,
        setActiveHotspot,
        setLocalReady,
        setSketchfabReady,
        setStatusMessage,
        applyResponsiveDowngrade,
        resetProductShowcaseState,
    };
}
