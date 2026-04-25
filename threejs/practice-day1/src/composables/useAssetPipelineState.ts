import { computed, reactive } from "vue";

export type AssetVersionKey = "raw-gltf" | "release-glb" | "meshopt-sim" | "animated-glb" | "broken";
export type TextureStrategyKey = "original" | "compressed";

export interface AssetVersionDescriptor { key: AssetVersionKey; label: string; path: string; kind: "raw" | "release" | "optimized" | "animated" | "error"; estimatedBytes: number; accent: string; note: string; thumbnailLabel: string; }
export interface AssetAuditSummary { sceneChildren: number; nodeCount: number; meshCount: number; materialCount: number; textureCount: number; animationCount: number; issueCount: number; budgetHint: string; }
export interface NamingIssue { name: string; reason: string; }
export interface AssetMetadataEntry { label: string; value: string; }
export interface AssetChecklistItem { key: string; label: string; done: boolean; detail: string; }
export interface PipelineReleaseEntry { stage: string; path: string; status: string; note: string; }
export interface PipelineAnimationState { clipNames: string[]; activeClip: string | null; playing: boolean; speed: number; }

interface PipelineState {
    activeVersion: AssetVersionKey;
    loadingStage: "idle" | "loading" | "ready" | "error";
    loadingProgress: number;
    currentPath: string;
    errorMessage: string;
    sceneReady: boolean;
    modelLabel: string;
    textureStrategy: TextureStrategyKey;
    strategySummary: string;
    checklist: AssetChecklistItem[];
    summary: AssetAuditSummary;
    metadata: AssetMetadataEntry[];
    namingIssues: NamingIssue[];
    animation: PipelineAnimationState;
    currentVariantLabel: string;
    statusMessage: string;
    lastLoadedAt: string;
    errorProbeEnabled: boolean;
    activeReleaseStage: string;
}

const assetVersions: AssetVersionDescriptor[] = [
    { key: "raw-gltf", label: "Raw Directory", path: "/models/2014_porsche_911_turbo_991/scene.gltf", kind: "raw", estimatedBytes: 9_480_000, accent: "#38bdf8", note: "目录版资源，便于检查纹理引用和结构命名。", thumbnailLabel: "RAW" },
    { key: "release-glb", label: "Release GLB", path: "/models/2014_porsche_911_turbo_991.glb", kind: "release", estimatedBytes: 10_540_000, accent: "#6366f1", note: "单文件交付版，路径更简单，适合发布验证。", thumbnailLabel: "GLB" },
    { key: "meshopt-sim", label: "Meshopt 模拟版", path: "/models/2014_porsche_911_turbo_991.glb", kind: "optimized", estimatedBytes: 7_960_000, accent: "#f59e0b", note: "仓库里暂无真实 meshopt 文件，这里用发布版做策略位模拟。", thumbnailLabel: "SIM" },
    { key: "animated-glb", label: "Animated GLB", path: "/models/hatsune_miku_lbx_ver_yuki_custom__redesign.glb", kind: "animated", estimatedBytes: 4_410_000, accent: "#ec4899", note: "补齐动画控制链路，用于验证 clip、速度与播放暂停。", thumbnailLabel: "ANI" },
    { key: "broken", label: "错误路径探针", path: "/models/practice7-missing.glb", kind: "error", estimatedBytes: 0, accent: "#ef4444", note: "故意制造 404，验证 HUD 错误提示是否可读。", thumbnailLabel: "ERR" },
];

export const textureStrategies: Record<TextureStrategyKey, { label: string; url: string; estimatedBytes: number; copy: string; accent: string }> = {
    original: { label: "原始贴图策略", url: "/textures/practice6/lab-original.svg", estimatedBytes: 1_180_000, copy: "保留更完整细节，适合检查材质上限与高光表现。", accent: "#38bdf8" },
    compressed: { label: "压缩贴图策略", url: "/textures/practice6/lab-compressed.svg", estimatedBytes: 196_000, copy: "优先兼顾移动端带宽和显存预算。", accent: "#f59e0b" },
};

const baseChecklist = () => [
    { key: "named", label: "对象命名清晰", done: false, detail: "等待模型预检" },
    { key: "modifiers", label: "缩放与导出结构可用", done: false, detail: "等待模型预检" },
    { key: "pbr", label: "PBR 贴图通道可用", done: false, detail: "等待模型预检" },
    { key: "texture", label: "贴图预算已纳入策略", done: true, detail: textureStrategies.original.label },
    { key: "optimize", label: "发布 / 优化版本已映射", done: false, detail: "等待版本切换" },
    { key: "animation", label: "动画链路已验证", done: false, detail: "当前资源无动画" },
] as AssetChecklistItem[];

function createDefaultState(): PipelineState {
    return {
        activeVersion: "raw-gltf",
        loadingStage: "idle",
        loadingProgress: 0,
        currentPath: assetVersions[0].path,
        errorMessage: "",
        sceneReady: false,
        modelLabel: assetVersions[0].label,
        textureStrategy: "original",
        strategySummary: textureStrategies.original.copy,
        checklist: baseChecklist(),
        summary: { sceneChildren: 0, nodeCount: 0, meshCount: 0, materialCount: 0, textureCount: 0, animationCount: 0, issueCount: 0, budgetHint: "等待模型加载后计算预算" },
        metadata: [],
        namingIssues: [],
        animation: { clipNames: [], activeClip: null, playing: false, speed: 1 },
        currentVariantLabel: assetVersions[0].label,
        statusMessage: "等待启动资产实验台",
        lastLoadedAt: "尚未加载",
        errorProbeEnabled: false,
        activeReleaseStage: "raw",
    };
}

const state = reactive(createDefaultState());
export const currentVersion = computed(() => assetVersions.find((item) => item.key === state.activeVersion) ?? assetVersions[0]);
export const currentTextureStrategy = computed(() => textureStrategies[state.textureStrategy]);
export const statusBadge = computed(() => state.loadingStage === "error" ? "Path Error" : state.loadingStage === "loading" ? `${state.loadingProgress}%` : state.loadingStage === "ready" ? "Ready" : "Idle");
export const pipelineSummary = computed(() => `${state.currentVariantLabel} · ${currentTextureStrategy.value.label} · ${state.summary.budgetHint}`);
export const releaseEntries = computed<PipelineReleaseEntry[]>(() => [
    { stage: "原始资产", path: assetVersions[0].path, status: state.activeReleaseStage === "raw" ? "当前对照" : "可回溯", note: assetVersions[0].note },
    { stage: "发布资产", path: assetVersions[1].path, status: state.activeReleaseStage === "release" ? "当前对照" : "候选发布", note: assetVersions[1].note },
    { stage: "优化策略", path: assetVersions[2].path, status: state.activeReleaseStage === "optimized" ? "当前对照" : "模拟映射", note: assetVersions[2].note },
]);

export function formatBytes(bytes: number) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }
    return `${size >= 10 || unitIndex === 0 ? size.toFixed(unitIndex === 0 ? 0 : 1) : size.toFixed(2)} ${units[unitIndex]}`;
}

function patchChecklist(key: string, done: boolean, detail: string) {
    const item = state.checklist.find((entry) => entry.key === key);
    if (!item) return;
    item.done = done;
    item.detail = detail;
}

export function setActiveAssetVersion(key: AssetVersionKey) {
    const next = assetVersions.find((item) => item.key === key);
    if (!next) return;
    state.activeVersion = key;
    state.currentPath = next.path;
    state.currentVariantLabel = next.label;
    state.modelLabel = next.label;
    state.errorProbeEnabled = key === "broken";
    state.activeReleaseStage = next.kind === "raw" ? "raw" : next.kind === "release" ? "release" : "optimized";
    state.statusMessage = `已切换到 ${next.label}，等待重新加载并更新预检。`;
    patchChecklist("optimize", next.kind !== "raw" && next.kind !== "error", next.kind === "raw" ? "当前处于原始目录版" : `当前验证 ${next.label}`);
}

export function setTextureStrategy(strategy: TextureStrategyKey) {
    state.textureStrategy = strategy;
    state.strategySummary = textureStrategies[strategy].copy;
    patchChecklist("texture", true, textureStrategies[strategy].label);
}

export function setLoadingState(partial: Partial<Pick<PipelineState, "loadingStage" | "loadingProgress" | "errorMessage" | "currentPath" | "sceneReady" | "statusMessage" | "lastLoadedAt">>) {
    Object.assign(state, partial);
}

export function setAnimationState(partial: Partial<PipelineAnimationState>) {
    Object.assign(state.animation, partial);
    const detail = state.animation.clipNames.length > 0 ? `${state.animation.clipNames.length} 段动画 · ${state.animation.activeClip ?? state.animation.clipNames[0]}` : "当前资源无动画，链路保持稳定";
    patchChecklist("animation", state.animation.clipNames.length > 0, detail);
}

export function setAnimationClip(name: string) {
    if (!state.animation.clipNames.includes(name)) return;
    state.animation.activeClip = name;
}

export function setAnimationSpeed(speed: number) {
    state.animation.speed = Number(Math.min(Math.max(speed, 0.2), 2.4).toFixed(1));
}

export function toggleAnimationPlaying() {
    if (!state.animation.clipNames.length) return;
    state.animation.playing = !state.animation.playing;
}

export function patchAuditSummary(summary: Partial<AssetAuditSummary>) {
    Object.assign(state.summary, summary);
}

export function updateMetadata(entries: AssetMetadataEntry[]) {
    state.metadata = entries;
}

export function updateNamingIssues(issues: NamingIssue[]) {
    state.namingIssues = issues;
    state.summary.issueCount = issues.length;
    patchChecklist("named", issues.length === 0, issues.length === 0 ? "节点命名通过规则校验" : `发现 ${issues.length} 项命名风险`);
}

export function updateChecklist(details: Partial<Record<AssetChecklistItem["key"], { done: boolean; detail: string }>>) {
    state.checklist = state.checklist.map((item) => details[item.key] ? { ...item, ...details[item.key] } : item);
}

export function resetAssetPipelineState() {
    Object.assign(state, createDefaultState());
}

export function useAssetPipelineState() {
    return {
        state,
        assetVersions,
        textureStrategies,
        currentVersion,
        currentTextureStrategy,
        statusBadge,
        pipelineSummary,
        releaseEntries,
        formatBytes,
        setActiveAssetVersion,
        setTextureStrategy,
        setLoadingState,
        setAnimationState,
        setAnimationClip,
        setAnimationSpeed,
        toggleAnimationPlaying,
        patchAuditSummary,
        updateMetadata,
        updateNamingIssues,
        updateChecklist,
        resetAssetPipelineState,
    };
}
