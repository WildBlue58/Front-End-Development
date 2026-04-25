import { computed, reactive } from "vue";

export type PerformanceLodLevel = "ultra" | "high" | "mid" | "low";
export type PerformanceRenderMode = "instanced" | "mesh";
export type PerformanceTextureProfile = "original" | "compressed";
export type PerformanceDeviceTier = "desktop" | "balanced" | "mobile" | "low";

export interface PerformanceLodThresholds {
    ultraToHigh: number;
    highToMid: number;
    midToLow: number;
}

export interface PerformanceControls {
    instanceCount: number;
    pixelRatioCap: number;
    enableBloom: boolean;
    bloomStrength: number;
    bloomRadius: number;
    bloomThreshold: number;
    autoRotate: boolean;
    renderMode: PerformanceRenderMode;
    enableFxaa: boolean;
    toneMappingEnabled: boolean;
    toneMappingExposure: number;
    lodThresholds: PerformanceLodThresholds;
    enableVisibilityCulling: boolean;
    textureProfile: PerformanceTextureProfile;
    autoDowngrade: boolean;
    downgradeLocked: boolean;
}

export interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
    activeLod: PerformanceLodLevel;
    cameraDistance: number;
    effectivePixelRatio: number;
    resolutionScale: number;
    activePasses: number;
    viewportWidth: number;
    viewportHeight: number;
    visibleCount: number;
    culledCount: number;
    textureEstimateBytes: number;
    textureLoadMs: number;
    jsHeapUsedMB: number | null;
    deviceTier: PerformanceDeviceTier;
    downgradeApplied: boolean;
    activeTextureProfile: PerformanceTextureProfile;
    statusMessage: string;
}

export const meshSafeCap = 900;

export const performanceRenderModes: Array<{ value: PerformanceRenderMode; label: string; copy: string }> = [
    { value: "instanced", label: "InstancedMesh", copy: "低 Draw Calls 的主方案，适合高数量对象阵列。" },
    { value: "mesh", label: "普通 Mesh", copy: `用于观察提交成本抬升，对照时会启用 ${meshSafeCap} 个安全上限。` },
];

export const performanceTextureProfileMap: Record<PerformanceTextureProfile, {
    label: string;
    url: string;
    accent: string;
    copy: string;
    fileBytes: number;
}> = {
    original: {
        label: "原始贴图",
        url: "/textures/practice6/lab-original.svg",
        accent: "#38bdf8",
        copy: "保留更高分辨率与更多细节层，适合观察清晰度上限。",
        fileBytes: 1_180_000,
    },
    compressed: {
        label: "压缩贴图",
        url: "/textures/practice6/lab-compressed.svg",
        accent: "#f59e0b",
        copy: "使用更紧凑的资源配置，优先兼顾加载成本与显存预算。",
        fileBytes: 196_000,
    },
};

export const performanceDeviceTierLabels: Record<PerformanceDeviceTier, string> = {
    desktop: "桌面高配",
    balanced: "均衡设备",
    mobile: "移动端",
    low: "低性能设备",
};

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

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

export function normalizeLodThresholds(thresholds: PerformanceLodThresholds): PerformanceLodThresholds {
    const ultraToHigh = clamp(Number(thresholds.ultraToHigh) || 7, 4, 16);
    const highToMid = clamp(Math.max(Number(thresholds.highToMid) || 13, ultraToHigh + 2), ultraToHigh + 2, 24);
    const midToLow = clamp(Math.max(Number(thresholds.midToLow) || 21, highToMid + 3), highToMid + 3, 38);

    return {
        ultraToHigh: Number(ultraToHigh.toFixed(1)),
        highToMid: Number(highToMid.toFixed(1)),
        midToLow: Number(midToLow.toFixed(1)),
    };
}

function createDefaultControls(): PerformanceControls {
    return {
        instanceCount: 1400,
        pixelRatioCap: 1.55,
        enableBloom: true,
        bloomStrength: 1.02,
        bloomRadius: 0.32,
        bloomThreshold: 0.72,
        autoRotate: true,
        renderMode: "instanced",
        enableFxaa: false,
        toneMappingEnabled: true,
        toneMappingExposure: 1.08,
        lodThresholds: normalizeLodThresholds({ ultraToHigh: 7, highToMid: 13, midToLow: 21 }),
        enableVisibilityCulling: false,
        textureProfile: "original",
        autoDowngrade: true,
        downgradeLocked: false,
    };
}

function createDefaultMetrics(): PerformanceMetrics {
    return {
        fps: 0,
        frameTime: 0,
        drawCalls: 0,
        triangles: 0,
        geometries: 0,
        textures: 0,
        activeLod: "high",
        cameraDistance: 0,
        effectivePixelRatio: 1,
        resolutionScale: 1,
        activePasses: 1,
        viewportWidth: 0,
        viewportHeight: 0,
        visibleCount: 0,
        culledCount: 0,
        textureEstimateBytes: 0,
        textureLoadMs: 0,
        jsHeapUsedMB: null,
        deviceTier: "desktop",
        downgradeApplied: false,
        activeTextureProfile: "original",
        statusMessage: "等待渲染器初始化",
    };
}

const controls = reactive(createDefaultControls());
const metrics = reactive(createDefaultMetrics());

const drawCallHint = computed(() => {
    if (controls.renderMode === "instanced") {
        if (metrics.drawCalls <= 16) {
            return controls.enableVisibilityCulling ? "实例化 + 剔除让提交成本保持在极低区间" : "实例化仍把 Draw Calls 压在很低位置";
        }
        if (metrics.drawCalls <= 30) {
            return "实例化稳定，但后处理或附加目标已经开始抬高成本";
        }
        return "实例化收益仍在，当前瓶颈更像是后处理或分辨率倍率";
    }

    if (metrics.drawCalls <= 80) return "普通 Mesh 仍在可控范围，可以继续往上推数量观察拐点";
    if (metrics.drawCalls <= 180) return "普通 Mesh 已明显抬高提交成本，对照差异已经出现";
    return "普通 Mesh 的提交成本已经很高，适合切回 InstancedMesh 做横向对比";
});

const fpsTone = computed(() => {
    if (metrics.fps >= 55) return "稳定";
    if (metrics.fps >= 42) return "可接受";
    return "需要继续优化";
});

const bloomSummary = computed(() =>
    controls.enableBloom
        ? `Bloom 在线 · 强度 ${controls.bloomStrength.toFixed(2)} / 半径 ${controls.bloomRadius.toFixed(2)} / 阈值 ${controls.bloomThreshold.toFixed(2)}`
        : "Bloom 已关闭 · 当前只保留基础光照和色调映射路径",
);

const postProcessingSummary = computed(() => {
    const features = ["基础 RenderPass"];

    if (controls.enableBloom) features.push("Bloom");
    if (controls.enableFxaa) features.push("FXAA");

    return `${features.join(" + ")} · ${controls.toneMappingEnabled ? `ACES ${controls.toneMappingExposure.toFixed(2)}` : "Tone Mapping Off"}`;
});

const viewportSummary = computed(() =>
    metrics.viewportWidth > 0 && metrics.viewportHeight > 0
        ? `${metrics.viewportWidth} × ${metrics.viewportHeight} · DPR ${metrics.effectivePixelRatio.toFixed(2)} · 比例 ${(metrics.resolutionScale * 100).toFixed(0)}%`
        : "等待画布尺寸同步",
);

const renderModeSummary = computed(() =>
    controls.renderMode === "instanced"
        ? "InstancedMesh：同一批对象共享几何与材质，提交开销最低。"
        : `普通 Mesh：每个对象独立提交，超过 ${meshSafeCap} 时自动触发安全上限。`,
);

const textureSummary = computed(() => {
    const activeProfile = performanceTextureProfileMap[metrics.activeTextureProfile];
    return `${activeProfile.label} · 估算 ${formatBytes(metrics.textureEstimateBytes)} · 加载 ${metrics.textureLoadMs.toFixed(0)} ms`;
});

const cullingSummary = computed(() =>
    controls.enableVisibilityCulling
        ? `可见 ${metrics.visibleCount} / 剔除 ${metrics.culledCount}`
        : "可见性剔除关闭，所有对象都保持激活",
);

const lodThresholdSummary = computed(() => {
    const { ultraToHigh, highToMid, midToLow } = normalizeLodThresholds(controls.lodThresholds);
    return `U/H ${ultraToHigh.toFixed(1)} · H/M ${highToMid.toFixed(1)} · M/L ${midToLow.toFixed(1)}`;
});

const downgradeSummary = computed(() =>
    metrics.downgradeApplied
        ? `已按 ${performanceDeviceTierLabels[metrics.deviceTier]} 预设降级，可手动恢复实验默认。`
        : `当前设备分级：${performanceDeviceTierLabels[metrics.deviceTier]}。`,
);

const memorySummary = computed(() =>
    metrics.jsHeapUsedMB == null
        ? `JS Heap 不可读 · 贴图估算 ${formatBytes(metrics.textureEstimateBytes)}`
        : `JS Heap ${metrics.jsHeapUsedMB.toFixed(1)} MB · 贴图估算 ${formatBytes(metrics.textureEstimateBytes)}`,
);

const performanceBadge = computed(() => `${metrics.fps} FPS · ${fpsTone.value}`);

function patchPerformanceControls(partial: Partial<PerformanceControls>) {
    const nextControls: Partial<PerformanceControls> = { ...partial };

    if (typeof nextControls.instanceCount === "number") {
        nextControls.instanceCount = clamp(Math.round(nextControls.instanceCount), 200, 2600);
    }

    if (typeof nextControls.pixelRatioCap === "number") {
        nextControls.pixelRatioCap = Number(clamp(nextControls.pixelRatioCap, 0.85, 2).toFixed(2));
    }

    if (typeof nextControls.bloomStrength === "number") {
        nextControls.bloomStrength = Number(clamp(nextControls.bloomStrength, 0, 2.2).toFixed(2));
    }

    if (typeof nextControls.bloomRadius === "number") {
        nextControls.bloomRadius = Number(clamp(nextControls.bloomRadius, 0, 1).toFixed(2));
    }

    if (typeof nextControls.bloomThreshold === "number") {
        nextControls.bloomThreshold = Number(clamp(nextControls.bloomThreshold, 0, 1).toFixed(2));
    }

    if (typeof nextControls.toneMappingExposure === "number") {
        nextControls.toneMappingExposure = Number(clamp(nextControls.toneMappingExposure, 0.65, 1.85).toFixed(2));
    }

    Object.assign(controls, nextControls);

    if (partial.lodThresholds) {
        controls.lodThresholds = normalizeLodThresholds({
            ...controls.lodThresholds,
            ...partial.lodThresholds,
        });
    }
}

function setLodThreshold(key: keyof PerformanceLodThresholds, value: number) {
    patchPerformanceControls({
        lodThresholds: {
            ...controls.lodThresholds,
            [key]: value,
        },
    });
}

function resetPerformanceSceneState() {
    Object.assign(controls, createDefaultControls());
    Object.assign(metrics, createDefaultMetrics());
}

function restoreHighQualityExperiment() {
    const defaults = createDefaultControls();
    Object.assign(controls, {
        ...defaults,
        autoDowngrade: false,
        downgradeLocked: false,
    });
    updatePerformanceMetrics({ downgradeApplied: false });
    setPerformanceStatus("已恢复实验默认配置，自动降级已暂时关闭，方便你手动对照不同策略。");
}

function applyDeviceDowngrade(tier: PerformanceDeviceTier) {
    const preset: Partial<PerformanceControls> = tier === "low"
        ? {
            renderMode: "instanced",
            instanceCount: 720,
            pixelRatioCap: 1,
            enableBloom: false,
            enableFxaa: true,
            toneMappingEnabled: true,
            toneMappingExposure: 0.96,
            enableVisibilityCulling: true,
            textureProfile: "compressed",
            autoRotate: false,
            autoDowngrade: true,
            downgradeLocked: true,
        }
        : {
            renderMode: "instanced",
            instanceCount: 900,
            pixelRatioCap: 1.15,
            enableBloom: false,
            enableFxaa: true,
            toneMappingEnabled: true,
            toneMappingExposure: 1,
            enableVisibilityCulling: true,
            textureProfile: "compressed",
            autoRotate: true,
            autoDowngrade: true,
            downgradeLocked: true,
        };

    patchPerformanceControls(preset);
    updatePerformanceMetrics({
        deviceTier: tier,
        downgradeApplied: true,
        activeTextureProfile: preset.textureProfile ?? metrics.activeTextureProfile,
    });
}

function updatePerformanceMetrics(partial: Partial<PerformanceMetrics>) {
    Object.assign(metrics, partial);
}

function setPerformanceStatus(message: string) {
    metrics.statusMessage = message;
}

export function usePerformanceSceneState() {
    return {
        controls,
        metrics,
        drawCallHint,
        fpsTone,
        bloomSummary,
        postProcessingSummary,
        viewportSummary,
        renderModeSummary,
        textureSummary,
        cullingSummary,
        lodThresholdSummary,
        downgradeSummary,
        memorySummary,
        performanceBadge,
        patchPerformanceControls,
        setLodThreshold,
        resetPerformanceSceneState,
        restoreHighQualityExperiment,
        applyDeviceDowngrade,
        updatePerformanceMetrics,
        setPerformanceStatus,
    };
}
