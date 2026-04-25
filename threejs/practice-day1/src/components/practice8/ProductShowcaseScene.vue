<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import SketchfabViewer from "../practice2/SketchfabViewer.vue";
import { hotspots, useProductShowcaseState } from "../../composables/useProductShowcaseState";

const { state, sketchfabModelId, currentVariant, currentPreset, currentHotspot, setActiveHotspot, setCameraPreset, setLocalReady, setSketchfabReady, setStatusMessage, applyResponsiveDowngrade } = useProductShowcaseState();
const containerRef = ref<HTMLDivElement | null>(null);
const scene = shallowRef<THREE.Scene | null>(null);
const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
const composer = shallowRef<EffectComposer | null>(null);
const localBadges = computed(() => [currentPreset.value.label, currentHotspot.value?.label ?? "点击部件触发热点", state.degradeMode ? "移动端降级已启用" : "桌面高质模式"]);
let controls: OrbitControls | null = null;
let bloomPass: UnrealBloomPass | null = null;
let fxaaPass: ShaderPass | null = null;
let resizeObserver: ResizeObserver | null = null;
let frameId = 0;
let currentRoot: THREE.Group | null = null;
let raycaster: THREE.Raycaster | null = null;
const mouse = new THREE.Vector2();
const cameraGoal = new THREE.Vector3();
const targetGoal = new THREE.Vector3();

function matchHotspot(name: string) {
    const lower = name.toLowerCase();
    return hotspots.find((item) => item.keywords.some((keyword) => lower.includes(keyword))) ?? null;
}
function disposeMaterial(material: THREE.Material | THREE.Material[]) {
    const list = Array.isArray(material) ? material : [material];
    list.forEach((entry) => {
        Object.values(entry).forEach((value) => value instanceof THREE.Texture && value.dispose());
        entry.dispose();
    });
}
function disposeCurrentModel() {
    currentRoot?.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) disposeMaterial(mesh.material);
    });
    currentRoot?.parent?.remove(currentRoot);
    currentRoot = null;
}
function applyPreset() {
    cameraGoal.fromArray(currentPreset.value.position);
    targetGoal.fromArray(currentPreset.value.target);
    setStatusMessage(`机位已切到 ${currentPreset.value.label}：${currentPreset.value.copy}`);
}
function applyModelLook() {
    if (!currentRoot) return;
    currentRoot.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.userData.basePosition ??= mesh.position.clone();
        const sourceName = `${mesh.name}|${Array.isArray(mesh.material) ? mesh.material.map((item) => item.name).join("|") : mesh.material?.name ?? ""}`;
        const hotspot = matchHotspot(sourceName);
        const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        materials.forEach((material) => {
            if (!(material instanceof THREE.MeshStandardMaterial)) return;
            material.userData.baseColor ??= material.color.getHex();
            material.wireframe = state.wireframe;
            const isPaint = /carpaint|chassis|plas_s/.test(sourceName.toLowerCase());
            material.color.setHex(Number(material.userData.baseColor));
            if (isPaint) material.color.set(state.currentColor);
            material.metalness = isPaint ? currentVariant.value.metallic : material.metalness;
            material.roughness = isPaint ? currentVariant.value.roughness : material.roughness;
            material.emissiveIntensity = hotspot && state.activeHotspot === hotspot.id ? 0.28 : state.bloom ? 0.04 : 0;
            material.needsUpdate = true;
        });
        const basePosition = mesh.userData.basePosition as THREE.Vector3;
        mesh.position.copy(basePosition);
        if (state.cameraPreset === "exploded") {
            if (/rim|disk|tire/.test(sourceName.toLowerCase())) mesh.position.x += Math.sign(basePosition.x || 1) * 0.35;
            if (/internal|emiss1/.test(sourceName.toLowerCase())) mesh.position.z += 0.45;
            if (/light/.test(sourceName.toLowerCase())) mesh.position.z += 0.25;
        }
        mesh.visible = currentVariant.value.showInternal || state.cameraPreset === "exploded" || !/internal|emiss1/.test(sourceName.toLowerCase());
    });
}
async function loadModel() {
    if (!scene.value) return;
    disposeCurrentModel();
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync("/models/2014_porsche_911_turbo_991.glb");
    const wrapper = new THREE.Group();
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 2.9 / Math.max(size.x || 1, size.y || 1, size.z || 1);
    model.position.set(-center.x, -box.min.y, -center.z);
    wrapper.scale.setScalar(scale);
    wrapper.position.set(0, -1.05, 0);
    wrapper.add(model);
    wrapper.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
    });
    scene.value.add(wrapper);
    currentRoot = wrapper;
    applyModelLook();
    setLocalReady(true);
    setStatusMessage("本地模型已就绪，可切换 Variant、机位、热点和后处理。");
}
function updateFxaa(width: number, height: number) {
    if (!fxaaPass || !renderer.value) return;
    const pixelRatio = renderer.value.getPixelRatio();
    const resolution = fxaaPass.material.uniforms.resolution.value as THREE.Vector2;
    resolution.set(1 / Math.max(width * pixelRatio, 1), 1 / Math.max(height * pixelRatio, 1));
}
function syncViewport() {
    const container = containerRef.value;
    if (!container || !renderer.value || !camera.value) return;
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    camera.value.aspect = width / height;
    camera.value.updateProjectionMatrix();
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, state.pixelRatioCap));
    renderer.value.setSize(width, height, false);
    composer.value?.setSize(width, height);
    updateFxaa(width, height);
    applyResponsiveDowngrade(width < 880 || window.matchMedia("(pointer: coarse)").matches);
}
function createStage() {
    if (!scene.value) return;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.95, metalness: 0.06 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.08;
    floor.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.3, 96), new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.04;
    scene.value.add(floor, ring, new THREE.AmbientLight("#dbeafe", 0.55));
    const key = new THREE.DirectionalLight("#ffffff", 2.2); key.position.set(5, 9, 6); key.castShadow = true; scene.value.add(key);
    scene.value.add(new THREE.PointLight("#38bdf8", 18, 24, 2).position.set(-4, 3.2, 3));
    scene.value.add(new THREE.PointLight("#f59e0b", 10, 16, 2).position.set(4, 2.4, -3));
}
function handleCanvasClick(event: PointerEvent) {
    if (!renderer.value || !camera.value || !scene.value || !currentRoot) return;
    const rect = renderer.value.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    if (!raycaster) return;
    raycaster.setFromCamera(mouse, camera.value);
    const hits = raycaster.intersectObjects(currentRoot.children, true);
    const hit = hits[0];
    if (!hit) return setActiveHotspot(null);

    const hotspot = matchHotspot(`${hit.object.name}|${(hit.object as THREE.Mesh).material ? ((hit.object as THREE.Mesh).material as THREE.Material).name : ""}`);
    setActiveHotspot(hotspot?.id ?? null);
    if (hotspot) setCameraPreset("detail");
}
function animate() {
    if (!scene.value || !camera.value || !renderer.value) return;
    frameId = window.requestAnimationFrame(animate);
    controls?.update();
    camera.value.position.lerp(cameraGoal, 0.08);
    controls?.target.lerp(targetGoal, 0.08);
    if (currentRoot && state.autoRotate && state.renderMode === "local") currentRoot.rotation.y += 0.0045;
    if (state.renderMode === "local") {
        bloomPass && (bloomPass.enabled = state.bloom && !state.degradeMode);
        composer.value?.render();
    }
}
onMounted(async () => {
    const container = containerRef.value;
    if (!container) return;
    scene.value = new THREE.Scene();
    scene.value.background = new THREE.Color("#020617");
    camera.value = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    renderer.value = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    renderer.value.shadowMap.enabled = true;
    renderer.value.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.value.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.value.domElement);
    controls = new OrbitControls(camera.value, renderer.value.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.6;
    controls.maxDistance = 9.2;
    controls.maxPolarAngle = Math.PI * 0.48;
    composer.value = new EffectComposer(renderer.value);
    composer.value.addPass(new RenderPass(scene.value, camera.value));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.32, 0.74); composer.value.addPass(bloomPass);
    fxaaPass = new ShaderPass(FXAAShader); composer.value.addPass(fxaaPass);
    raycaster = new THREE.Raycaster();
    createStage();
    new RGBELoader().load("/hdr/studio.hdr", (texture) => { texture.mapping = THREE.EquirectangularReflectionMapping; scene.value!.environment = texture; });
    await loadModel();
    applyPreset();
    syncViewport();
    renderer.value.domElement.addEventListener("pointerdown", handleCanvasClick);
    resizeObserver = new ResizeObserver(() => syncViewport()); resizeObserver.observe(container);
    window.addEventListener("resize", syncViewport);
    animate();
});
onBeforeUnmount(() => {
    window.cancelAnimationFrame(frameId);
    window.removeEventListener("resize", syncViewport);
    resizeObserver?.disconnect();
    renderer.value?.domElement.removeEventListener("pointerdown", handleCanvasClick);
    disposeCurrentModel();
    controls?.dispose();
    composer.value?.dispose();
    if (containerRef.value && renderer.value?.domElement.parentElement === containerRef.value) containerRef.value.removeChild(renderer.value.domElement);
    renderer.value?.dispose(); renderer.value?.forceContextLoss();
    scene.value = null; camera.value = null; renderer.value = null; composer.value = null;
});
watch(() => state.cameraPreset, () => { applyPreset(); applyModelLook(); });
watch(() => [state.currentColor, state.wireframe, state.variant, state.activeHotspot], () => applyModelLook());
watch(() => state.pixelRatioCap, () => syncViewport());
watch(() => state.renderMode, (mode) => { if (mode === "local") applyPreset(); });
</script>

<template>
    <section class="showcase-scene-shell">
        <div class="viewport-title"><strong>{{ currentVariant.label }}</strong><span>{{ state.renderMode === 'local' ? '本地 Three.js 主链路' : 'Sketchfab 备用 Viewer' }}</span></div>
        <div class="badge-row"><span v-for="item in localBadges" :key="item" class="scene-badge">{{ item }}</span></div>
        <div ref="containerRef" v-show="state.renderMode === 'local'" class="scene-viewport"></div>
        <div v-show="state.renderMode === 'sketchfab'" class="scene-viewport sf-shell"><SketchfabViewer :model-id="sketchfabModelId" @ready="setSketchfabReady(true); setStatusMessage('Sketchfab 备用模式已就绪，HUD 与焦点文案已同步。')" /></div>
    </section>
</template>

<style scoped>
.showcase-scene-shell { position: absolute; inset: 0; right: 372px; overflow: hidden; border-radius: 28px; background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 26%), radial-gradient(circle at bottom right, rgba(245, 158, 11, 0.14), transparent 24%), linear-gradient(180deg, #07111f 0%, #091120 56%, #020617 100%); }
.scene-viewport,.sf-shell { position: absolute; inset: 0; }
.viewport-title { position: absolute; top: 18px; left: 18px; z-index: 12; display: grid; gap: 6px; padding: 14px 16px; border-radius: 18px; background: rgba(2, 6, 23, 0.58); border: 1px solid rgba(125, 211, 252, 0.16); }
.viewport-title strong { color: #f8fafc; }
.viewport-title span,.scene-badge { color: #cbd5e1; font-size: 12px; }
.badge-row { position: absolute; left: 18px; bottom: 18px; z-index: 12; display: flex; flex-wrap: wrap; gap: 10px; max-width: calc(100% - 36px); }
.scene-badge { display: inline-flex; align-items: center; min-height: 28px; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(56, 189, 248, 0.24); background: rgba(56, 189, 248, 0.12); color: #a5f3fc; letter-spacing: 0.06em; }
@media (max-width: 1180px) { .showcase-scene-shell { right: 0; bottom: 300px; } }
@media (max-width: 768px) { .showcase-scene-shell { position: relative; right: auto; bottom: auto; height: 52vh; min-height: 360px; } }
</style>
