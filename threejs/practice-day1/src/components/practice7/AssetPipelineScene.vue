<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { useAssetPipelineState } from "../../composables/useAssetPipelineState";

const { state, currentTextureStrategy, currentVersion, setLoadingState, setAnimationState, patchAuditSummary, updateMetadata, updateNamingIssues, updateChecklist } = useAssetPipelineState();
const containerRef = ref<HTMLDivElement | null>(null);
const scene = shallowRef<THREE.Scene | null>(null);
const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
const stageTextureUrl = ref(currentTextureStrategy.value.url);
const clock = new THREE.Clock();
const clips = new Map<string, THREE.AnimationAction>();
let controls: OrbitControls | null = null;
let resizeObserver: ResizeObserver | null = null;
let frameId = 0;
let currentRoot: THREE.Group | null = null;
let mixer: THREE.AnimationMixer | null = null;
let textureBoard: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null = null;

const introCards = computed(() => [
    { label: "Version", value: state.currentVariantLabel },
    { label: "Nodes", value: String(state.summary.nodeCount) },
    { label: "Materials", value: String(state.summary.materialCount) },
    { label: "Animations", value: String(state.summary.animationCount) },
]);
const chips = computed(() => [
    state.loadingStage === "error" ? "错误路径测试中" : "主链路正常",
    currentTextureStrategy.value.label,
    state.animation.clipNames.length ? "动画链路可用" : "无动画兜底",
    `${state.summary.textureCount} 张贴图`,
]);

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
    const list = Array.isArray(material) ? material : [material];
    list.forEach((entry) => {
        Object.values(entry).forEach((value) => {
            if (value instanceof THREE.Texture) value.dispose();
        });
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
    mixer = null;
    clips.clear();
}

function syncTextureBoard() {
    if (!textureBoard) return;
    const loader = new THREE.TextureLoader();
    loader.load(currentTextureStrategy.value.url, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        if (textureBoard?.material.map) textureBoard.material.map.dispose();
        textureBoard!.material.map = texture;
        textureBoard!.material.needsUpdate = true;
    });
}

function createStage() {
    if (!scene.value) return;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.95, metalness: 0.04 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.05;
    floor.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.2, 96), new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.02;
    textureBoard = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.92 }));
    textureBoard.position.set(-3.2, 1.2, -1.4);
    const ambient = new THREE.AmbientLight("#dbeafe", 0.65);
    const keyLight = new THREE.DirectionalLight("#ffffff", 2.4);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = true;
    const cyan = new THREE.PointLight("#38bdf8", 18, 18, 2);
    cyan.position.set(-4, 3.4, 2.8);
    const amber = new THREE.PointLight("#f59e0b", 10, 16, 2);
    amber.position.set(4, 2.8, -3);
    scene.value.add(floor, ring, textureBoard, ambient, keyLight, cyan, amber);
    syncTextureBoard();
}

function summarizeBudget(nodeCount: number, materialCount: number, textureCount: number) {
    if (nodeCount > 80 || materialCount > 18 || textureCount > 14) return "当前资产更像审计对象，建议继续压缩或拆分贴图。";
    if (nodeCount > 48 || materialCount > 12 || textureCount > 10) return "结构仍可上线，但移动端需要更保守的纹理和材质预算。";
    return "结构处于可控区间，适合作为 Web 展示页发布版基线。";
}

function auditModel(root: THREE.Object3D, animations: THREE.AnimationClip[]) {
    let nodeCount = 0;
    let meshCount = 0;
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    const namingIssues: Array<{ name: string; reason: string }> = [];
    root.traverse((child) => {
        nodeCount += 1;
        if (child.name && /(^Cube(\.\d+)?$|^Plane(\.\d+)?$|\.fbx$|^Sketchfab_|^t:|^emiss:)/.test(child.name)) namingIssues.push({ name: child.name, reason: "命名带有导出残留或默认前缀" });
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        meshCount += 1;
        const list = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        list.forEach((material) => {
            materials.add(material);
            Object.values(material).forEach((value) => {
                if (value instanceof THREE.Texture) textures.add(value);
            });
        });
    });
    patchAuditSummary({ sceneChildren: root.children.length, nodeCount, meshCount, materialCount: materials.size, textureCount: textures.size, animationCount: animations.length, budgetHint: summarizeBudget(nodeCount, materials.size, textures.size) });
    updateNamingIssues(namingIssues.slice(0, 8));
    updateMetadata([
        { label: "当前版本", value: currentVersion.value.label },
        { label: "资源路径", value: currentVersion.value.path },
        { label: "估算体积", value: `${Math.round(currentVersion.value.estimatedBytes / 1024 / 1024)} MB` },
        { label: "贴图策略", value: currentTextureStrategy.value.label },
        { label: "最近加载", value: new Date().toLocaleTimeString() },
    ]);
    updateChecklist({
        modifiers: { done: true, detail: "模型已完成归一化缩放与落地" },
        pbr: { done: materials.size > 0 && textures.size > 0, detail: materials.size > 0 ? `检测到 ${materials.size} 组材质与 ${textures.size} 张贴图` : "未发现可用材质映射" },
    });
}

async function loadModel() {
    if (!scene.value) return;
    disposeCurrentModel();
    setLoadingState({ loadingStage: "loading", loadingProgress: 0, errorMessage: "", currentPath: currentVersion.value.path, sceneReady: false, statusMessage: `正在加载 ${currentVersion.value.label}` });
    const manager = new THREE.LoadingManager();
    manager.onProgress = (_url, loaded, total) => setLoadingState({ loadingProgress: total > 0 ? Math.round((loaded / total) * 100) : 0 });
    manager.onError = (url) => setLoadingState({ errorMessage: `资源加载失败：${url}` });
    const loader = new GLTFLoader(manager);
    try {
        const gltf = await loader.loadAsync(currentVersion.value.path);
        const wrapper = new THREE.Group();
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 2.8 / Math.max(size.x || 1, size.y || 1, size.z || 1);
        model.position.set(-center.x, -box.min.y, -center.z);
        wrapper.scale.setScalar(scale);
        wrapper.position.set(0, -1.02, 0);
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
        auditModel(model, gltf.animations);
        setAnimationState({ clipNames: gltf.animations.map((clip) => clip.name || `Clip ${clips.size + 1}`), activeClip: gltf.animations[0]?.name ?? null, playing: gltf.animations.length > 0, speed: state.animation.speed });
        if (gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => clips.set(clip.name, mixer!.clipAction(clip)));
            const first = clips.get(state.animation.activeClip || gltf.animations[0].name);
            first?.reset().play();
        }
        setLoadingState({ loadingStage: "ready", loadingProgress: 100, sceneReady: true, errorMessage: "", statusMessage: gltf.animations.length ? "模型与动画已加载，可切换动画片段和速度。" : "模型已加载，当前资源无动画但验证链路稳定。", lastLoadedAt: `${currentVersion.value.label} @ ${new Date().toLocaleTimeString()}` });
    } catch (error) {
        const message = error instanceof Error ? error.message : "未知错误";
        setAnimationState({ clipNames: [], activeClip: null, playing: false });
        patchAuditSummary({ sceneChildren: 0, nodeCount: 0, meshCount: 0, materialCount: 0, textureCount: 0, animationCount: 0, budgetHint: "路径错误或资源不可达，等待修复后重试" });
        setLoadingState({ loadingStage: "error", loadingProgress: 100, errorMessage: message, sceneReady: false, statusMessage: "错误探针已触发，请观察 HUD 的路径和错误反馈。", lastLoadedAt: "加载失败" });
    }
}

function syncViewport() {
    const container = containerRef.value;
    if (!container || !renderer.value || !camera.value) return;
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    camera.value.aspect = width / height;
    camera.value.updateProjectionMatrix();
    renderer.value.setSize(width, height, false);
}

function animate() {
    if (!scene.value || !camera.value || !renderer.value) return;
    frameId = window.requestAnimationFrame(animate);
    const delta = clock.getDelta();
    controls?.update();
    mixer?.update(delta * state.animation.speed);
    if (currentRoot && state.loadingStage === "ready" && !state.animation.playing) currentRoot.rotation.y += delta * 0.18;
    renderer.value.render(scene.value, camera.value);
}

onMounted(() => {
    const container = containerRef.value;
    if (!container) return;
    scene.value = new THREE.Scene();
    scene.value.background = new THREE.Color("#020617");
    scene.value.fog = new THREE.Fog("#020617", 10, 28);
    camera.value = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.value.position.set(3.8, 2.3, 5.8);
    renderer.value = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.value.shadowMap.enabled = true;
    renderer.value.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.value.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.value.domElement);
    controls = new OrbitControls(camera.value, renderer.value.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.2, 0);
    createStage();
    syncViewport();
    loadModel();
    animate();
    resizeObserver = new ResizeObserver(() => syncViewport());
    resizeObserver.observe(container);
    window.addEventListener("resize", syncViewport);
});

onBeforeUnmount(() => {
    window.cancelAnimationFrame(frameId);
    window.removeEventListener("resize", syncViewport);
    resizeObserver?.disconnect();
    disposeCurrentModel();
    controls?.dispose();
    if (textureBoard?.material.map) textureBoard.material.map.dispose();
    textureBoard?.geometry.dispose();
    textureBoard?.material.dispose();
    if (containerRef.value && renderer.value?.domElement.parentElement === containerRef.value) containerRef.value.removeChild(renderer.value.domElement);
    renderer.value?.dispose();
    scene.value = null;
    camera.value = null;
    renderer.value = null;
});

watch(() => state.activeVersion, () => loadModel());
watch(() => state.textureStrategy, () => { stageTextureUrl.value = currentTextureStrategy.value.url; syncTextureBoard(); });
watch(() => state.animation.activeClip, (clipName) => {
    if (!clipName || !mixer) return;
    clips.forEach((action, name) => name === clipName ? action.reset().fadeIn(0.2).play() : action.fadeOut(0.18));
});
watch(() => state.animation.playing, (playing) => {
    if (!mixer) return;
    mixer.timeScale = playing ? state.animation.speed : 0;
});
watch(() => state.animation.speed, (speed) => { if (mixer && state.animation.playing) mixer.timeScale = speed; });
</script>

<template>
    <div class="asset-pipeline-scene">
        <div ref="containerRef" class="scene-viewport"></div>
        <section class="scene-intro">
            <div class="intro-header">
                <div>
                    <p class="eyebrow">Day 7 · Asset Audit Workbench</p>
                    <h2>Blender → glTF → Web 资产验证实验台</h2>
                </div>
                <span class="status-pill">{{ state.loadingStage === 'error' ? 'Error Probe' : state.loadingStage === 'ready' ? 'Pipeline Ready' : 'Loading' }}</span>
            </div>
            <p class="intro-copy">这一页不只负责把模型显示出来，还会同时验证版本切换、贴图策略、命名残留、错误提示、动画兜底和资源发布映射。切到 `Animated GLB` 可以完整跑一次动画控制链路。</p>
            <div class="status-banner">{{ state.statusMessage }}</div>
            <div class="chip-row"><span v-for="chip in chips" :key="chip" class="chip">{{ chip }}</span></div>
            <div class="stats-grid"><div v-for="item in introCards" :key="item.label" class="stat-card"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div></div>
        </section>
        <div class="texture-preview"><span>Texture Board</span><strong>{{ currentTextureStrategy.label }}</strong><small>{{ stageTextureUrl }}</small></div>
    </div>
</template>

<style scoped>
.asset-pipeline-scene { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 24%), radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), transparent 20%), linear-gradient(180deg, #07111f 0%, #091120 56%, #020617 100%); }
.scene-viewport { position: absolute; inset: 0; }
.scene-intro { position: absolute; top: 20px; left: 20px; z-index: 25; width: min(540px, calc(100vw - 420px)); max-height: clamp(240px, 42vh, 360px); overflow-y: auto; padding: 20px; border-radius: 24px; border: 1px solid rgba(125, 211, 252, 0.16); background: linear-gradient(180deg, rgba(2, 6, 23, 0.76), rgba(2, 6, 23, 0.52)); box-shadow: 0 24px 60px rgba(2, 6, 23, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.06); backdrop-filter: blur(16px); color: #dbeafe; }
.texture-preview { position: absolute; right: 372px; bottom: 24px; z-index: 18; display: grid; gap: 4px; min-width: 180px; padding: 12px 14px; border-radius: 18px; background: rgba(2, 6, 23, 0.72); border: 1px solid rgba(148, 163, 184, 0.14); color: #dbeafe; }
.intro-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.eyebrow,.stat-card span,.texture-preview span { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #7dd3fc; }
.scene-intro h2 { margin: 0; font-size: 28px; line-height: 1.08; color: #f8fafc; }
.status-pill,.chip { display: inline-flex; align-items: center; justify-content: center; min-height: 30px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(56, 189, 248, 0.24); background: rgba(56, 189, 248, 0.12); color: #a5f3fc; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
.intro-copy,.status-banner,.texture-preview small { font-size: 13px; line-height: 1.72; }
.intro-copy { margin: 14px 0 0; color: #cbd5e1; }
.status-banner { margin-top: 16px; padding: 12px 14px; border-radius: 18px; border: 1px solid rgba(148, 163, 184, 0.12); background: rgba(15, 23, 42, 0.54); color: #e2e8f0; }
.chip-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
.stat-card { padding: 14px; border-radius: 18px; border: 1px solid rgba(148, 163, 184, 0.12); background: rgba(15, 23, 42, 0.52); }
.stat-card strong,.texture-preview strong { color: #f8fafc; }
@media (max-width: 1180px) { .scene-intro { width: min(520px, calc(100vw - 40px)); } .texture-preview { right: 24px; bottom: 96px; } }
@media (max-width: 980px) { .scene-intro { right: 16px; left: 16px; width: auto; max-height: 42vh; } .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .texture-preview { right: 16px; left: 16px; bottom: calc(46vh + 22px); } }
@media (max-width: 640px) { .scene-intro h2 { font-size: 24px; } .intro-header { flex-direction: column; } .stats-grid { grid-template-columns: 1fr; } }
</style>
