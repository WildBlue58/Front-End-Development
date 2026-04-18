import type { WaveMaterialMode, WavePresetKey } from "./useWaveShaderState";

export const interactiveObjectOrder = ["hero-box", "signal-sphere", "porsche-911"] as const;
export type InteractiveObjectId = (typeof interactiveObjectOrder)[number];
export type InteractiveObjectKind = "box" | "sphere" | "model";
export type MaterialPresetKey = "plastic" | "metal" | "ceramic" | "emissive";

export interface Vector3State {
    x: number;
    y: number;
    z: number;
}

export interface InteractiveMaterialState {
    color: string;
    metalness: number;
    roughness: number;
    emissive: string;
    emissiveIntensity: number;
    wireframe: boolean;
    opacity: number;
    preset: MaterialPresetKey;
}

export interface InteractiveSceneObjectState {
    id: InteractiveObjectId;
    kind: InteractiveObjectKind;
    label: string;
    summary: string;
    accent: string;
    position: Vector3State;
    rotation: Vector3State;
    scale: number;
    material: InteractiveMaterialState;
    modelPath?: string;
    baseScale?: number;
}

export interface InteractiveShaderState {
    enabled: boolean;
    preset: WavePresetKey;
    materialMode: WaveMaterialMode;
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
    wireframe: boolean;
    interactiveRipple: boolean;
    normalDetailEnabled: boolean;
    hudBackgroundEnabled: boolean;
    syncActiveColor: boolean;
    respondToDrag: boolean;
}

export const materialPresetDefinitions: Array<{
    key: MaterialPresetKey;
    label: string;
    summary: string;
    accent: string;
}> = [
    { key: "plastic", label: "塑料", summary: "柔和高光，适合基础形体预览。", accent: "#42b883" },
    { key: "metal", label: "金属", summary: "高金属度和更紧致的反射。", accent: "#38bdf8" },
    { key: "ceramic", label: "陶瓷", summary: "白釉质感，反光克制但干净。", accent: "#f8fafc" },
    { key: "emissive", label: "发光体", summary: "自发光更明显，适合交互焦点。", accent: "#f59e0b" },
];

function createVector3(x: number, y: number, z: number): Vector3State {
    return { x, y, z };
}

function createMaterialState(preset: MaterialPresetKey, overrides: Partial<InteractiveMaterialState> = {}): InteractiveMaterialState {
    const material: InteractiveMaterialState = {
        color: "#42b883",
        metalness: 0.35,
        roughness: 0.55,
        emissive: "#0f172a",
        emissiveIntensity: 0,
        wireframe: false,
        opacity: 1,
        preset,
    };

    applyMaterialPreset(material, preset);
    Object.assign(material, overrides);
    material.preset = preset;
    return material;
}

export function createSceneObjectDefaults(): Record<InteractiveObjectId, InteractiveSceneObjectState> {
    return {
        "hero-box": {
            id: "hero-box",
            kind: "box",
            label: "主控立方体",
            summary: "适合观察旋转、线框和 PBR 基础参数。",
            accent: "#67e8f9",
            position: createVector3(-2.15, 0, 0.5),
            rotation: createVector3(0, 0.3, 0),
            scale: 1,
            material: createMaterialState("plastic", { color: "#42b883" }),
        },
        "signal-sphere": {
            id: "signal-sphere",
            kind: "sphere",
            label: "信号球体",
            summary: "更适合观察高光、粗糙度和发光边缘。",
            accent: "#a78bfa",
            position: createVector3(2.25, -0.3, 0.9),
            rotation: createVector3(0.15, -0.45, 0),
            scale: 0.95,
            material: createMaterialState("metal", { color: "#a78bfa", emissive: "#312e81", emissiveIntensity: 0.08 }),
        },
        "porsche-911": {
            id: "porsche-911",
            kind: "model",
            label: "Porsche 911",
            summary: "支持模型部位拾取、材质预设和拖拽位移。",
            accent: "#f87171",
            position: createVector3(0, -1.05, -1.15),
            rotation: createVector3(0, -0.65, 0),
            scale: 0.68,
            material: createMaterialState("ceramic", { color: "#dbeafe", metalness: 0.26, roughness: 0.2 }),
            modelPath: "/models/2014_porsche_911_turbo_991.glb",
            baseScale: 0.72,
        },
    };
}

export function createDefaultShaderState(): InteractiveShaderState {
    return {
        enabled: true,
        preset: "energy_pool",
        materialMode: "shader",
        amplitude: 0.24,
        frequency: 2.2,
        speed: 1.35,
        fresnelPower: 2.8,
        scanStrength: 0.22,
        rippleStrength: 0.28,
        rippleRadius: 0.2,
        normalDetailStrength: 0.46,
        hudIntensity: 0.58,
        colorA: "#164e63",
        colorB: "#67e8f9",
        wireframe: false,
        interactiveRipple: true,
        normalDetailEnabled: true,
        hudBackgroundEnabled: true,
        syncActiveColor: true,
        respondToDrag: true,
    };
}

export function applyMaterialPreset(target: InteractiveMaterialState, preset: MaterialPresetKey) {
    if (preset === "plastic") {
        Object.assign(target, { color: "#42b883", metalness: 0.12, roughness: 0.58, emissive: "#0f172a", emissiveIntensity: 0, wireframe: false, opacity: 1 });
    } else if (preset === "metal") {
        Object.assign(target, { color: "#94a3ff", metalness: 0.92, roughness: 0.2, emissive: "#0f172a", emissiveIntensity: 0.04, wireframe: false, opacity: 1 });
    } else if (preset === "ceramic") {
        Object.assign(target, { color: "#f8fafc", metalness: 0.18, roughness: 0.34, emissive: "#1e293b", emissiveIntensity: 0.02, wireframe: false, opacity: 1 });
    } else {
        Object.assign(target, { color: "#f59e0b", metalness: 0.08, roughness: 0.14, emissive: "#fb923c", emissiveIntensity: 0.92, wireframe: false, opacity: 1 });
    }

    target.preset = preset;
}

const porschePartMatchers: Array<{ match: RegExp; label: string; hint: string }> = [
    { match: /Paint|CarPaint/i, label: "车身漆面", hint: "当前命中车身漆面，可观察整体材质变化。" },
    { match: /Rim|Rims|rim_Color/i, label: "轮毂", hint: "当前命中轮毂区域，适合观察金属质感。" },
    { match: /tire/i, label: "轮胎", hint: "当前命中轮胎区域，黑色橡胶对粗糙度更敏感。" },
    { match: /BrakeDisc|Caliper|disk|phong16/i, label: "制动系统", hint: "当前命中刹车盘 / 卡钳，可观察高亮边缘。" },
    { match: /Light|glass_light|Light_R|windows/i, label: "灯组 / 玻璃", hint: "当前命中灯组或玻璃区，适合对比透明与发光。" },
    { match: /mirror|glass_surr/i, label: "后视镜", hint: "当前命中后视镜区域。" },
    { match: /Internal|Engine|emiss1/i, label: "发动机舱", hint: "当前命中内部机械结构，可结合发光预设观察。" },
    { match: /LicensePlate|plater/i, label: "牌照框", hint: "当前命中牌照框区域。" },
    { match: /Badges/i, label: "车标", hint: "当前命中徽标细节区域。" },
    { match: /GrilleB|grille/i, label: "进气格栅", hint: "当前命中前脸格栅区域。" },
    { match: /glass/i, label: "玻璃结构", hint: "当前命中玻璃部件。" },
];

export function resolvePorschePart(rawName: string) {
    const normalized = rawName || "car-body";
    const matched = porschePartMatchers.find((item) => item.match.test(normalized));
    return matched ?? { label: "车身部件", hint: "当前命中模型部件，可在 HUD 中查看拾取日志。" };
}
