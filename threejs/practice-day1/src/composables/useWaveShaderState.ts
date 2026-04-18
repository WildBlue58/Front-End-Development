import { computed, ref } from "vue";

export type WavePresetKey = "ocean" | "energy_pool" | "hologram" | "lava";
export type WaveMaterialMode = "shader" | "raw";

export interface WavePresetDefinition {
    key: WavePresetKey;
    label: string;
    accent: string;
    summary: string;
    description: string;
    amplitude: number;
    frequency: number;
    speed: number;
    fresnelPower: number;
    scanStrength: number;
    rippleStrength: number;
    rippleRadius: number;
    normalDetailStrength: number;
    hudIntensity: number;
    colorA: string;
    colorB: string;
}

export const wavePresetDefinitions: WavePresetDefinition[] = [
    {
        key: "ocean",
        label: "海面",
        accent: "#38bdf8",
        summary: "低频蓝青浪面，边缘冷光更克制。",
        description: "偏真实海面节奏，强调流动与层次。",
        amplitude: 0.26,
        frequency: 1.85,
        speed: 1.1,
        fresnelPower: 3.0,
        scanStrength: 0.16,
        rippleStrength: 0.24,
        rippleRadius: 0.24,
        normalDetailStrength: 0.34,
        hudIntensity: 0.52,
        colorA: "#0f766e",
        colorB: "#38bdf8",
    },
    {
        key: "energy_pool",
        label: "能量池",
        accent: "#22d3ee",
        summary: "更亮的边缘光与脉冲纹理，像高能反应池。",
        description: "适合观察菲涅尔和扫描线共同驱动的发光层。",
        amplitude: 0.3,
        frequency: 2.8,
        speed: 1.7,
        fresnelPower: 2.2,
        scanStrength: 0.36,
        rippleStrength: 0.42,
        rippleRadius: 0.2,
        normalDetailStrength: 0.52,
        hudIntensity: 0.68,
        colorA: "#164e63",
        colorB: "#67e8f9",
    },
    {
        key: "hologram",
        label: "全息屏",
        accent: "#a78bfa",
        summary: "更密集的扫描线和更平的起伏，突出屏幕感。",
        description: "适合 Raw 模式对比和 HUD 背景风格演示。",
        amplitude: 0.16,
        frequency: 4.4,
        speed: 1.45,
        fresnelPower: 4.8,
        scanStrength: 0.52,
        rippleStrength: 0.36,
        rippleRadius: 0.16,
        normalDetailStrength: 0.42,
        hudIntensity: 0.82,
        colorA: "#312e81",
        colorB: "#67e8f9",
    },
    {
        key: "lava",
        label: "熔岩面",
        accent: "#fb7185",
        summary: "高振幅暖色流动，细节更躁动、更具热能。",
        description: "突出程序噪声与贴图细节叠加后的复杂表面。",
        amplitude: 0.34,
        frequency: 2.35,
        speed: 0.95,
        fresnelPower: 1.8,
        scanStrength: 0.24,
        rippleStrength: 0.3,
        rippleRadius: 0.28,
        normalDetailStrength: 0.66,
        hudIntensity: 0.58,
        colorA: "#7c2d12",
        colorB: "#fb7185",
    },
];

const preset = ref<WavePresetKey>("ocean");
const materialMode = ref<WaveMaterialMode>("shader");
const amplitude = ref(0.26);
const frequency = ref(1.85);
const speed = ref(1.1);
const fresnelPower = ref(3.0);
const scanStrength = ref(0.16);
const rippleStrength = ref(0.24);
const rippleRadius = ref(0.24);
const normalDetailStrength = ref(0.34);
const hudIntensity = ref(0.52);
const colorA = ref("#0f766e");
const colorB = ref("#38bdf8");
const wireframe = ref(false);
const interactiveRipple = ref(true);
const normalDetailEnabled = ref(true);
const hudBackgroundEnabled = ref(true);

const planeSize = 5.2;
const planeSegments = 256;

function applyPreset(nextPresetKey: WavePresetKey) {
    const nextPreset = wavePresetDefinitions.find((item) => item.key === nextPresetKey);
    if (!nextPreset) {
        return;
    }

    preset.value = nextPreset.key;
    amplitude.value = nextPreset.amplitude;
    frequency.value = nextPreset.frequency;
    speed.value = nextPreset.speed;
    fresnelPower.value = nextPreset.fresnelPower;
    scanStrength.value = nextPreset.scanStrength;
    rippleStrength.value = nextPreset.rippleStrength;
    rippleRadius.value = nextPreset.rippleRadius;
    normalDetailStrength.value = nextPreset.normalDetailStrength;
    hudIntensity.value = nextPreset.hudIntensity;
    colorA.value = nextPreset.colorA;
    colorB.value = nextPreset.colorB;
}

export function useWaveShaderState() {
    const activePreset = computed(
        () => wavePresetDefinitions.find((item) => item.key === preset.value) ?? wavePresetDefinitions[0],
    );

    const gradientPreview = computed(
        () => `linear-gradient(135deg, ${colorA.value}, ${colorB.value})`,
    );

    const materialModeLabel = computed(() => (materialMode.value === "raw" ? "Raw Shader" : "ShaderMaterial"));

    const surfaceStats = computed(() => [
        { label: "网格分段", value: `${planeSegments} × ${planeSegments}` },
        { label: "材质模式", value: materialModeLabel.value },
        { label: "当前预设", value: activePreset.value.label },
        { label: "速度倍率", value: `${speed.value.toFixed(2)}x` },
        { label: "鼠标扰动", value: interactiveRipple.value ? "已启用" : "已关闭" },
        { label: "细节贴图", value: normalDetailEnabled.value ? "混合中" : "程序噪声" },
    ]);

    return {
        preset,
        materialMode,
        amplitude,
        frequency,
        speed,
        fresnelPower,
        scanStrength,
        rippleStrength,
        rippleRadius,
        normalDetailStrength,
        hudIntensity,
        colorA,
        colorB,
        wireframe,
        interactiveRipple,
        normalDetailEnabled,
        hudBackgroundEnabled,
        planeSize,
        planeSegments,
        activePreset,
        gradientPreview,
        materialModeLabel,
        surfaceStats,
        wavePresetDefinitions,
        applyPreset,
    };
}
