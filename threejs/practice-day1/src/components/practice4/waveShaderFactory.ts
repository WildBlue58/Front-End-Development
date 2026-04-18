import * as THREE from "three";
import type { WaveMaterialMode, WavePresetKey } from "../../composables/useWaveShaderState";

export type WaveMaterialInstance = THREE.ShaderMaterial | THREE.RawShaderMaterial;

type UniformRecord = Record<string, THREE.IUniform>;

export interface WaveUniformSeed {
    amplitude: number;
    frequency: number;
    fresnelPower: number;
    scanStrength: number;
    colorA: string;
    colorB: string;
    preset: WavePresetKey;
    rippleStrength: number;
    rippleRadius: number;
    normalDetailStrength: number;
    interactiveRipple: boolean;
    normalDetailEnabled: boolean;
    normalMap: THREE.Texture;
}

export interface HudUniformSeed {
    colorA: string;
    colorB: string;
    preset: WavePresetKey;
    hudIntensity: number;
}

const presetIndexMap: Record<WavePresetKey, number> = {
    ocean: 0,
    energy_pool: 1,
    hologram: 2,
    lava: 3,
};

function baseShaderPrefix(raw: boolean, extra = "") {
    return `${raw ? "precision highp float;\nprecision highp int;\n" : ""}${extra}`;
}

function waveVertexShader(raw: boolean) {
    const builtins = raw
        ? "uniform mat4 modelMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat3 normalMatrix;\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec2 uv;\n"
        : "";

    return `${baseShaderPrefix(raw, builtins)}uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;
uniform vec2 uPointer;
uniform float uRippleStrength;
uniform float uRippleRadius;
uniform float uPointerActive;
uniform float uInteractiveRipple;

varying vec2 vUv;
varying float vElevation;
varying float vRipple;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

float rippleAt(vec2 uvValue, vec2 pointerUv, float radius, float strength, float active, float time) {
    float dist = distance(uvValue, pointerUv);
    float ring = sin(dist * 36.0 - time * 5.8);
    float falloff = exp(-(dist * dist) / max(0.0008, radius * radius));
    return ring * falloff * strength * active;
}

void main() {
    vUv = uv;

    vec3 pos = position;
    float waveX = sin(pos.x * uFrequency + uTime);
    float waveY = sin(pos.y * (uFrequency * 0.72) + uTime * 1.15);
    float crossWave = cos((pos.x + pos.y) * (uFrequency * 0.55) - uTime * 0.8);
    float elevation = (waveX * waveY + crossWave * 0.35) * uAmplitude;
    float ripple = rippleAt(uv, uPointer, uRippleRadius, uRippleStrength, uPointerActive * uInteractiveRipple, uTime);

    pos.z += elevation + ripple;
    vElevation = elevation;
    vRipple = ripple;

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;
}

function waveFragmentShader(raw: boolean) {
    const builtins = raw ? "uniform vec3 cameraPosition;\n" : "";

    return `${baseShaderPrefix(raw, builtins)}uniform float uTime;
uniform float uAmplitude;
uniform float uFresnelPower;
uniform float uScanStrength;
uniform float uPresetIndex;
uniform float uNormalDetailStrength;
uniform float uDetailEnabled;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform sampler2D uNormalMap;

varying vec2 vUv;
varying float vElevation;
varying float vRipple;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

float scanLine(float uvY, float time) {
    return smoothstep(0.0, 0.02, abs(sin(uvY * 78.0 - time * 3.0)));
}

float fresnel(vec3 viewDir, vec3 normal, float power) {
    return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec3 presetAccent(float idx) {
    if (idx < 0.5) return vec3(0.22, 0.78, 0.96);
    if (idx < 1.5) return vec3(0.12, 1.0, 0.88);
    if (idx < 2.5) return vec3(0.66, 0.56, 1.0);
    return vec3(1.0, 0.44, 0.22);
}

float presetPulse(float idx, vec2 uv, float time) {
    if (idx < 0.5) return noise(uv * 4.0 + vec2(time * 0.02, -time * 0.01)) * 0.08;
    if (idx < 1.5) return (sin(uv.x * 16.0 + uv.y * 8.0 - time * 4.8) * 0.5 + 0.5) * 0.24;
    if (idx < 2.5) return scanLine(uv.y * 1.65 + sin(uv.x * 6.0) * 0.02, time * 1.45) * 0.28;
    return noise(uv * 14.0 - vec2(time * 0.06, time * 0.02)) * 0.36;
}

float detailSample(vec2 uv, float time, float strength) {
    vec3 tex = texture2D(uNormalMap, uv * mix(3.2, 6.8, clamp(strength, 0.0, 1.0)) + vec2(time * 0.025, -time * 0.018)).xyz;
    float mapped = dot(tex, vec3(0.3333));
    float procedural = noise(uv * 8.0 + vec2(time * 0.05, -time * 0.04));
    return mix(procedural, mix(procedural, mapped, 0.72), uDetailEnabled);
}

void main() {
    float pulse = presetPulse(uPresetIndex, vUv, uTime);
    float detail = detailSample(vUv, uTime, uNormalDetailStrength) * (0.05 + uNormalDetailStrength * 0.14);
    float gradient = smoothstep(-uAmplitude * 1.15, uAmplitude * 1.15, vElevation + vRipple * 0.35 + pulse * 0.06);
    vec3 baseColor = mix(uColorA, uColorB, clamp(gradient, 0.0, 1.0));
    float line = scanLine(vUv.y + detail * 0.18 + pulse * 0.08, uTime) * (uScanStrength + pulse * 0.25);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float edge = fresnel(viewDir, normalize(vWorldNormal), uFresnelPower);
    vec3 accent = presetAccent(uPresetIndex);

    vec3 color = baseColor;
    color += accent * (edge * 0.92 + line * 0.58 + pulse * 0.42);
    color += vec3(detail) * 0.2;
    color += accent * abs(vRipple) * 0.95;

    if (uPresetIndex > 2.5) {
        color += vec3(0.28, 0.04, 0.0) * (pulse + detail * 1.8);
    }

    gl_FragColor = vec4(clamp(color, 0.0, 1.4), 1.0);
}`;
}

function hudVertexShader(raw: boolean) {
    const builtins = raw
        ? "uniform mat4 modelMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat3 normalMatrix;\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec2 uv;\n"
        : "";

    return `${baseShaderPrefix(raw, builtins)}varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
}

function hudFragmentShader(raw: boolean) {
    const builtins = raw ? "uniform vec3 cameraPosition;\n" : "";

    return `${baseShaderPrefix(raw, builtins)}uniform float uTime;
uniform float uPresetIndex;
uniform float uHudIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

float scanLine(float uvY, float time) {
    return smoothstep(0.0, 0.02, abs(sin(uvY * 92.0 - time * 2.6)));
}

float fresnel(vec3 viewDir, vec3 normal) {
    return pow(1.0 - max(dot(viewDir, normal), 0.0), 1.6);
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(91.7, 267.3))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec3 presetAccent(float idx) {
    if (idx < 0.5) return vec3(0.22, 0.78, 0.96);
    if (idx < 1.5) return vec3(0.12, 1.0, 0.88);
    if (idx < 2.5) return vec3(0.66, 0.56, 1.0);
    return vec3(1.0, 0.44, 0.22);
}

float borderMask(vec2 uv) {
    vec2 edge = min(uv, 1.0 - uv);
    float dist = min(edge.x, edge.y);
    return 1.0 - smoothstep(0.025, 0.13, dist);
}

void main() {
    float grain = noise(vUv * 18.0 + vec2(uTime * 0.06, -uTime * 0.04)) * 0.14;
    float line = scanLine(vUv.y + grain * 0.18, uTime) * (0.3 + uHudIntensity);
    float grid = smoothstep(0.76, 1.0, sin((vUv.x + uTime * 0.04) * 22.0) * 0.5 + 0.5) * 0.18;
    float border = borderMask(vUv);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float edge = fresnel(viewDir, normalize(vWorldNormal));
    vec3 accent = presetAccent(uPresetIndex);
    vec3 baseColor = mix(uColorA, uColorB, clamp(vUv.y + grain * 0.12, 0.0, 1.0));

    vec3 color = baseColor * (0.22 + uHudIntensity * 0.38);
    color += accent * (line + grid + edge * 0.56 + border * 0.72);
    color += grain * 0.16;

    float alpha = clamp(0.24 + uHudIntensity * 0.44 + border * 0.18, 0.0, 0.92);
    gl_FragColor = vec4(clamp(color, 0.0, 1.35), alpha);
}`;
}

function createWaveUniforms(seed: WaveUniformSeed): UniformRecord {
    return {
        uTime: { value: 0 },
        uAmplitude: { value: seed.amplitude },
        uFrequency: { value: seed.frequency },
        uFresnelPower: { value: seed.fresnelPower },
        uScanStrength: { value: seed.scanStrength },
        uPresetIndex: { value: presetIndexMap[seed.preset] },
        uRippleStrength: { value: seed.rippleStrength },
        uRippleRadius: { value: seed.rippleRadius },
        uPointer: { value: new THREE.Vector2(-2, -2) },
        uPointerActive: { value: 0 },
        uInteractiveRipple: { value: seed.interactiveRipple ? 1 : 0 },
        uNormalDetailStrength: { value: seed.normalDetailStrength },
        uDetailEnabled: { value: seed.normalDetailEnabled ? 1 : 0 },
        uColorA: { value: new THREE.Color(seed.colorA) },
        uColorB: { value: new THREE.Color(seed.colorB) },
        uNormalMap: { value: seed.normalMap },
    };
}

function createHudUniforms(seed: HudUniformSeed): UniformRecord {
    return {
        uTime: { value: 0 },
        uPresetIndex: { value: presetIndexMap[seed.preset] },
        uHudIntensity: { value: seed.hudIntensity },
        uColorA: { value: new THREE.Color(seed.colorA) },
        uColorB: { value: new THREE.Color(seed.colorB) },
    };
}

export function createWaveMaterial(options: WaveUniformSeed & { materialMode: WaveMaterialMode; wireframe: boolean }) {
    const raw = options.materialMode === "raw";
    const MaterialCtor = raw ? THREE.RawShaderMaterial : THREE.ShaderMaterial;

    return new MaterialCtor({
        uniforms: createWaveUniforms(options),
        vertexShader: waveVertexShader(raw),
        fragmentShader: waveFragmentShader(raw),
        side: THREE.DoubleSide,
        wireframe: options.wireframe,
        toneMapped: false,
    });
}

export function createHudMaterial(options: HudUniformSeed & { materialMode: WaveMaterialMode }) {
    const raw = options.materialMode === "raw";
    const MaterialCtor = raw ? THREE.RawShaderMaterial : THREE.ShaderMaterial;

    return new MaterialCtor({
        uniforms: createHudUniforms(options),
        vertexShader: hudVertexShader(raw),
        fragmentShader: hudFragmentShader(raw),
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
    });
}

export function syncWaveMaterial(
    material: WaveMaterialInstance,
    values: WaveUniformSeed & { wireframe: boolean },
) {
    const uniforms = material.uniforms as UniformRecord;

    uniforms.uAmplitude.value = values.amplitude;
    uniforms.uFrequency.value = values.frequency;
    uniforms.uFresnelPower.value = values.fresnelPower;
    uniforms.uScanStrength.value = values.scanStrength;
    uniforms.uPresetIndex.value = presetIndexMap[values.preset];
    uniforms.uRippleStrength.value = values.rippleStrength;
    uniforms.uRippleRadius.value = values.rippleRadius;
    uniforms.uNormalDetailStrength.value = values.normalDetailStrength;
    uniforms.uDetailEnabled.value = values.normalDetailEnabled ? 1 : 0;
    uniforms.uInteractiveRipple.value = values.interactiveRipple ? 1 : 0;
    uniforms.uColorA.value.set(values.colorA);
    uniforms.uColorB.value.set(values.colorB);
    uniforms.uNormalMap.value = values.normalMap;
    material.wireframe = values.wireframe;
}

export function syncHudMaterial(material: WaveMaterialInstance, values: HudUniformSeed) {
    const uniforms = material.uniforms as UniformRecord;

    uniforms.uPresetIndex.value = presetIndexMap[values.preset];
    uniforms.uHudIntensity.value = values.hudIntensity;
    uniforms.uColorA.value.set(values.colorA);
    uniforms.uColorB.value.set(values.colorB);
}
