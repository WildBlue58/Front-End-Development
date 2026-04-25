<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch } from "vue";
import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import InstancedCluster from "./InstancedCluster.vue";
import LodProbe from "./LodProbe.vue";
import TextureCompressionProbe from "./TextureCompressionProbe.vue";
import { performanceSceneContextKey } from "./sceneContext";
import {
    performanceDeviceTierLabels,
    usePerformanceSceneState,
    type PerformanceDeviceTier,
} from "../../composables/usePerformanceSceneState";

const {
    controls,
    metrics,
    performanceBadge,
    postProcessingSummary,
    renderModeSummary,
    textureSummary,
    downgradeSummary,
    applyDeviceDowngrade,
    patchPerformanceControls,
    setPerformanceStatus,
    updatePerformanceMetrics,
} = usePerformanceSceneState();

const containerRef = ref<HTMLDivElement | null>(null);
const scene = shallowRef<THREE.Scene | null>(null);
const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
const composer = shallowRef<EffectComposer | null>(null);

const frameHandlers = new Set<(delta: number, elapsed: number) => void>();
let orbitControls: OrbitControls | null = null;
let renderPass: RenderPass | null = null;
let bloomPass: UnrealBloomPass | null = null;
let fxaaPass: ShaderPass | null = null;
let stats: Stats | null = null;
let clock: THREE.Clock | null = null;
let animationFrameId = 0;
let resizeObserver: ResizeObserver | null = null;
let staticGroup: THREE.Group | null = null;

provide(performanceSceneContextKey, {
    scene,
    camera,
    renderer,
    composer,
    registerFrameHandler(handler) {
        frameHandlers.add(handler);
        return () => frameHandlers.delete(handler);
    },
});

const statusCards = computed(() => [
    { label: "Mode", value: controls.renderMode === "instanced" ? "InstancedMesh" : "Mesh" },
    { label: "Visible", value: `${metrics.visibleCount} / ${controls.instanceCount}` },
    { label: "Scale", value: `${(metrics.resolutionScale * 100).toFixed(0)}%` },
    { label: "Passes", value: metrics.activePasses },
    { label: "Texture", value: metrics.activeTextureProfile },
    { label: "Device", value: performanceDeviceTierLabels[metrics.deviceTier] },
]);

const chips = computed(() => [
    controls.enableBloom ? "Bloom 在线" : "Bloom 关闭",
    controls.enableFxaa ? "FXAA 在线" : "FXAA 关闭",
    controls.enableVisibilityCulling ? `剔除 ${metrics.culledCount}` : "全量激活",
    metrics.downgradeApplied ? "自动降级已生效" : "手动实验模式",
    `Draw Calls ${metrics.drawCalls}`,
]);

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
    if (Array.isArray(material)) {
        material.forEach((item) => item.dispose());
        return;
    }

    material.dispose();
}

function createStage() {
    if (!scene.value) return;

    const group = new THREE.Group();

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 60, 1, 1),
        new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.94, metalness: 0.08 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.9;
    floor.receiveShadow = true;

    const ring = new THREE.Mesh(
        new THREE.RingGeometry(5.6, 6.3, 128),
        new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.88;

    const halo = new THREE.Mesh(
        new THREE.CircleGeometry(7.4, 96),
        new THREE.MeshBasicMaterial({ color: "#0ea5e9", transparent: true, opacity: 0.06, side: THREE.DoubleSide }),
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -1.895;

    const grid = new THREE.GridHelper(30, 30, "#164e63", "#0f2436");
    grid.position.y = -1.86;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach((material) => {
        material.transparent = true;
        material.opacity = 0.32;
    });

    const ambient = new THREE.AmbientLight("#dbeafe", 0.55);
    const directional = new THREE.DirectionalLight("#ffffff", 2.25);
    directional.position.set(6, 10, 8);
    directional.castShadow = true;
    directional.shadow.mapSize.set(2048, 2048);

    const cyanLight = new THREE.PointLight("#38bdf8", 18, 26, 2);
    cyanLight.position.set(-7, 4, 5);
    const greenLight = new THREE.PointLight("#42b883", 12, 20, 2);
    greenLight.position.set(5, 3, -4);

    group.add(floor, ring, halo, grid, ambient, directional, cyanLight, greenLight);
    scene.value.add(group);
    staticGroup = group;
}

function resolveActivePasses() {
    return 1 + Number(controls.enableBloom) + Number(controls.enableFxaa);
}

function shouldUseComposer() {
    return Boolean(composer.value && (controls.enableBloom || controls.enableFxaa));
}

function updateFxaaResolution(width: number, height: number) {
    if (!fxaaPass || !renderer.value) return;

    const pixelRatio = renderer.value.getPixelRatio();
    const resolution = fxaaPass.material.uniforms.resolution.value as THREE.Vector2;
    resolution.set(1 / Math.max(width * pixelRatio, 1), 1 / Math.max(height * pixelRatio, 1));
}

function applyToneMapping() {
    if (!renderer.value) return;

    renderer.value.toneMapping = controls.toneMappingEnabled ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    renderer.value.toneMappingExposure = controls.toneMappingEnabled ? controls.toneMappingExposure : 1;
}

function applyPixelRatio() {
    if (!renderer.value) return;

    const nativeDpr = window.devicePixelRatio || 1;
    const cappedDpr = Math.min(nativeDpr, controls.pixelRatioCap);

    renderer.value.setPixelRatio(cappedDpr);
    composer.value?.setPixelRatio(cappedDpr);

    updatePerformanceMetrics({
        effectivePixelRatio: renderer.value.getPixelRatio(),
        resolutionScale: Number((cappedDpr / nativeDpr).toFixed(2)),
    });
}

function syncViewport() {
    const container = containerRef.value;
    if (!container || !renderer.value || !camera.value) return;

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    camera.value.aspect = width / height;
    camera.value.updateProjectionMatrix();
    renderer.value.setSize(width, height, false);
    composer.value?.setSize(width, height);
    updateFxaaResolution(width, height);

    if (stats) {
        stats.dom.style.transform = width < 980 ? "scale(0.88)" : "scale(1)";
        stats.dom.style.transformOrigin = "bottom right";
    }

    updatePerformanceMetrics({ viewportWidth: width, viewportHeight: height });
}

function setupPostProcessing() {
    if (!renderer.value || !scene.value || !camera.value) return;

    composer.value = new EffectComposer(renderer.value);
    renderPass = new RenderPass(scene.value, camera.value);
    bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), controls.bloomStrength, controls.bloomRadius, controls.bloomThreshold);
    fxaaPass = new ShaderPass(FXAAShader);

    composer.value.addPass(renderPass);
    composer.value.addPass(bloomPass);
    composer.value.addPass(fxaaPass);
}

function updatePostProcessingSettings() {
    applyToneMapping();

    if (bloomPass) {
        bloomPass.enabled = controls.enableBloom;
        bloomPass.strength = controls.bloomStrength;
        bloomPass.radius = controls.bloomRadius;
        bloomPass.threshold = controls.bloomThreshold;
    }

    if (fxaaPass) {
        fxaaPass.enabled = controls.enableFxaa;
    }

    updatePerformanceMetrics({ activePasses: resolveActivePasses() });
}

function getMemoryUsageMB() {
    const perf = performance as Performance & { memory?: { usedJSHeapSize?: number } };
    const used = perf.memory?.usedJSHeapSize;

    return typeof used === "number" ? Number((used / 1024 / 1024).toFixed(1)) : null;
}

function detectDeviceTier() {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const deviceMemory = nav.deviceMemory ?? 8;
    const hardwareConcurrency = nav.hardwareConcurrency ?? 8;
    const coarsePointer = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)").matches : false;
    const narrowViewport = window.innerWidth < 960;
    const highDpr = (window.devicePixelRatio || 1) > 2.2;

    if (deviceMemory <= 4 || hardwareConcurrency <= 4 || (coarsePointer && (narrowViewport || highDpr))) {
        return {
            tier: "low" as PerformanceDeviceTier,
            shouldDowngrade: true,
            reason: "检测到较低硬件预算或高 DPR 移动设备，建议优先保住帧率和触控流畅度。",
        };
    }

    if (coarsePointer || narrowViewport || highDpr || deviceMemory <= 6 || hardwareConcurrency <= 6) {
        return {
            tier: "mobile" as PerformanceDeviceTier,
            shouldDowngrade: true,
            reason: "当前设备更接近移动端/均衡档，建议默认走更轻的渲染预设。",
        };
    }

    if (deviceMemory <= 8 || hardwareConcurrency <= 8) {
        return {
            tier: "balanced" as PerformanceDeviceTier,
            shouldDowngrade: false,
            reason: "当前设备属于均衡档，可保留主要特效并继续手动实验。",
        };
    }

    return {
        tier: "desktop" as PerformanceDeviceTier,
        shouldDowngrade: false,
        reason: "当前设备足够宽裕，适合保留完整实验链路。",
    };
}

function evaluateDeviceProfile(forceStatus = false) {
    const detection = detectDeviceTier();
    updatePerformanceMetrics({ deviceTier: detection.tier });

    if (controls.autoDowngrade && !controls.downgradeLocked && detection.shouldDowngrade) {
        applyDeviceDowngrade(detection.tier);
        setPerformanceStatus(`已自动套用 ${performanceDeviceTierLabels[detection.tier]} 安全预设：${detection.reason}`);
        return;
    }

    if (!forceStatus) return;

    if (!controls.autoDowngrade) {
        setPerformanceStatus(`自动降级已关闭：当前仍会显示设备档位（${performanceDeviceTierLabels[detection.tier]}），但不再自动改参数。`);
        return;
    }

    if (controls.downgradeLocked && metrics.downgradeApplied) {
        setPerformanceStatus(`当前保持已锁定的降级预设（${performanceDeviceTierLabels[detection.tier]}），可在控制台手动恢复。`);
        return;
    }

    setPerformanceStatus(detection.reason);
}

function handleResize() {
    applyPixelRatio();
    syncViewport();

    if (controls.autoDowngrade && !controls.downgradeLocked) {
        evaluateDeviceProfile(false);
    }
}

function initScene() {
    const container = containerRef.value;
    if (!container) return;

    scene.value = new THREE.Scene();
    scene.value.background = new THREE.Color("#020617");
    scene.value.fog = new THREE.Fog("#020617", 14, 34);

    camera.value = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.value.position.set(0, 4.4, 7.6);

    renderer.value = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    renderer.value.shadowMap.enabled = true;
    renderer.value.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.value.outputColorSpace = THREE.SRGBColorSpace;
    applyToneMapping();

    container.appendChild(renderer.value.domElement);

    orbitControls = new OrbitControls(camera.value, renderer.value.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.06;
    orbitControls.minDistance = 4.2;
    orbitControls.maxDistance = 22;
    orbitControls.maxPolarAngle = Math.PI * 0.48;
    orbitControls.target.set(0, 0.25, -2.6);
    orbitControls.update();

    createStage();
    setupPostProcessing();
    applyPixelRatio();
    syncViewport();
    updatePostProcessingSettings();
    evaluateDeviceProfile(false);

    stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.position = "absolute";
    stats.dom.style.right = "20px";
    stats.dom.style.bottom = "18px";
    stats.dom.style.left = "auto";
    stats.dom.style.top = "auto";
    stats.dom.style.pointerEvents = "none";
    container.appendChild(stats.dom);

    clock = new THREE.Clock();
    setPerformanceStatus("Performance Lab 已就绪：现在可以直接切换渲染模式、后处理、LOD 阈值和贴图方案做对照。");
}

function animate() {
    if (!scene.value || !camera.value || !renderer.value || !clock) return;

    animationFrameId = window.requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();
    orbitControls?.update();
    frameHandlers.forEach((handler) => handler(delta, elapsed));

    if (shouldUseComposer()) {
        composer.value?.render();
    } else {
        renderer.value.render(scene.value, camera.value);
    }

    stats?.update();
    updatePerformanceMetrics({
        fps: delta > 0 ? Math.round(1 / delta) : 0,
        frameTime: Number((delta * 1000).toFixed(1)),
        drawCalls: renderer.value.info.render.calls,
        triangles: renderer.value.info.render.triangles,
        geometries: renderer.value.info.memory.geometries,
        textures: renderer.value.info.memory.textures,
        activePasses: resolveActivePasses(),
        effectivePixelRatio: renderer.value.getPixelRatio(),
        jsHeapUsedMB: getMemoryUsageMB(),
    });
}

function disposeStage() {
    staticGroup?.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) disposeMaterial(mesh.material);
    });

    staticGroup?.parent?.remove(staticGroup);
    staticGroup = null;
}

onMounted(() => {
    initScene();
    animate();

    if (containerRef.value && "ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(containerRef.value);
    }

    window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", handleResize);
    resizeObserver?.disconnect();
    orbitControls?.dispose();
    disposeStage();
    bloomPass?.dispose();
    composer.value?.dispose();

    const container = containerRef.value;
    if (container && stats?.dom.parentElement === container) container.removeChild(stats.dom);
    if (container && renderer.value?.domElement.parentElement === container) container.removeChild(renderer.value.domElement);

    renderer.value?.dispose();
    renderer.value?.forceContextLoss();
    frameHandlers.clear();
    scene.value = null;
    camera.value = null;
    renderer.value = null;
    composer.value = null;
    stats = null;
    clock = null;
    renderPass = null;
    bloomPass = null;
    fxaaPass = null;
});

watch(
    () => controls.instanceCount,
    (value) => {
        if (!scene.value) return;
        setPerformanceStatus(`实例数量已更新到 ${value}，继续观察 Draw Calls、可见数量和 FPS 的联动变化。`);
    },
);

watch(
    () => controls.renderMode,
    (value) => {
        if (!scene.value) return;
        setPerformanceStatus(value === "instanced" ? "已切到 InstancedMesh 模式：重点观察 Draw Calls 是否保持低位。" : "已切到普通 Mesh 对照模式：现在更容易看到提交成本抬升。");
    },
);

watch(
    () => controls.pixelRatioCap,
    (value) => {
        if (!renderer.value) return;
        applyPixelRatio();
        syncViewport();
        setPerformanceStatus(`像素比上限切到 ${value.toFixed(2)}，对比画面锐度与分辨率倍率变化。`);
    },
);

watch(
    () => [controls.enableBloom, controls.enableFxaa, controls.toneMappingEnabled, controls.toneMappingExposure, controls.bloomStrength, controls.bloomRadius, controls.bloomThreshold],
    () => {
        if (!scene.value) return;

        if (controls.enableBloom && !controls.toneMappingEnabled) {
            patchPerformanceControls({ toneMappingEnabled: true });
            setPerformanceStatus("Bloom 依赖 tone mapping，已自动恢复色调映射开关。");
            return;
        }

        updatePostProcessingSettings();
        setPerformanceStatus(postProcessingSummary.value);
    },
);

watch(
    () => controls.autoRotate,
    (value) => {
        if (!scene.value) return;
        setPerformanceStatus(value ? "自动旋转已开启：更容易观察高光、纹理与 LOD 变化。" : "自动旋转已关闭：更适合静止状态下做性能对照。");
    },
);

watch(
    () => [controls.autoDowngrade, controls.downgradeLocked],
    () => {
        if (!scene.value) return;
        evaluateDeviceProfile(true);
    },
);
</script>

<template>
    <div class="performance-scene">
        <div ref="containerRef" class="scene-viewport"></div>
        <InstancedCluster />
        <LodProbe />
        <TextureCompressionProbe />

        <section class="scene-intro">
            <div class="intro-header">
                <div>
                    <p class="eyebrow">Day 6 · Performance & Post FX Lab</p>
                    <h2>性能优化与后处理实验台</h2>
                </div>
                <span class="status-pill">{{ performanceBadge }}</span>
            </div>
            <p class="intro-copy">现在这个实验场会同时展示普通 Mesh / InstancedMesh 对照、Bloom + FXAA 后处理、四档 LOD、可见性剔除、贴图方案切换和设备自动降级，所有结果都会统一写回 HUD。</p>
            <div class="status-banner">{{ metrics.statusMessage }}</div>
            <div class="chip-row">
                <span v-for="chip in chips" :key="chip" class="chip">{{ chip }}</span>
            </div>
            <div class="stats-grid">
                <div v-for="item in statusCards" :key="item.label" class="stat-card">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                </div>
            </div>
            <div class="summary-stack">
                <div class="summary-card">
                    <span>渲染模式</span>
                    <strong>{{ renderModeSummary }}</strong>
                </div>
                <div class="summary-card">
                    <span>后处理链</span>
                    <strong>{{ postProcessingSummary }}</strong>
                </div>
                <div class="summary-card">
                    <span>贴图实验</span>
                    <strong>{{ textureSummary }}</strong>
                </div>
                <div class="summary-card">
                    <span>设备策略</span>
                    <strong>{{ downgradeSummary }}</strong>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.performance-scene {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 26%),
        radial-gradient(circle at top right, rgba(66, 184, 131, 0.14), transparent 24%),
        linear-gradient(180deg, #08111f 0%, #091120 56%, #020617 100%);
}

.scene-viewport {
    position: absolute;
    inset: 0;
}

.scene-intro {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 25;
    width: min(520px, calc(100vw - 420px));
    max-height: clamp(240px, 42vh, 360px);
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px;
    border-radius: 24px;
    border: 1px solid rgba(125, 211, 252, 0.16);
    background: linear-gradient(180deg, rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.48));
    box-shadow: 0 24px 60px rgba(2, 6, 23, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(16px);
    color: #dbeafe;
    scrollbar-width: thin;
    scrollbar-color: rgba(103, 232, 249, 0.45) rgba(15, 23, 42, 0.36);
}

.scene-intro::-webkit-scrollbar {
    width: 8px;
}

.scene-intro::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.36);
    border-radius: 999px;
}

.scene-intro::-webkit-scrollbar-thumb {
    background: rgba(103, 232, 249, 0.45);
    border-radius: 999px;
}

.scene-intro::-webkit-scrollbar-thumb:hover {
    background: rgba(103, 232, 249, 0.62);
}

.intro-header,
.chip-row,
.stats-grid,
.summary-stack {
    display: grid;
    gap: 12px;
}

.intro-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
}

.eyebrow,
.stat-card span,
.summary-card span {
    margin: 0 0 6px;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #7dd3fc;
}

.scene-intro h2 {
    margin: 0;
    font-size: 28px;
    line-height: 1.08;
    color: #f8fafc;
}

.status-pill,
.chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 30px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(56, 189, 248, 0.24);
    background: rgba(56, 189, 248, 0.12);
    color: #a5f3fc;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.status-pill {
    white-space: nowrap;
}

.intro-copy,
.status-banner,
.summary-card strong {
    font-size: 13px;
    line-height: 1.72;
}

.intro-copy {
    margin: 14px 0 0;
    color: #cbd5e1;
}

.status-banner {
    margin-top: 16px;
    padding: 12px 14px;
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    background: rgba(15, 23, 42, 0.54);
    color: #e2e8f0;
}

.chip-row {
    display: flex;
    flex-wrap: wrap;
    margin-top: 14px;
}

.stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 14px;
}

.stat-card,
.summary-card {
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    background: rgba(15, 23, 42, 0.52);
}

.stat-card {
    padding: 14px;
}

.stat-card strong,
.summary-card strong {
    color: #f8fafc;
    word-break: break-word;
}

.summary-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: 14px;
}

.summary-card {
    padding: 14px;
    display: grid;
    gap: 6px;
}

@media (max-width: 1180px) {
    .scene-intro {
        width: min(520px, calc(100vw - 40px));
        max-height: clamp(220px, 40vh, 340px);
    }
}

@media (max-width: 980px) {
    .scene-intro {
        right: 16px;
        left: 16px;
        top: 16px;
        width: auto;
        max-height: 42vh;
        overflow-y: auto;
    }

    .stats-grid,
    .summary-stack {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .scene-intro h2 {
        font-size: 24px;
    }

    .intro-header {
        flex-direction: column;
        gap: 10px;
    }

    .stats-grid,
    .summary-stack {
        grid-template-columns: 1fr;
    }
}

@media (max-height: 760px) {
    .scene-intro {
        max-height: clamp(210px, 36vh, 300px);
    }

    .intro-copy {
        display: none;
    }
}
</style>
