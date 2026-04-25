<script setup lang="ts">
import { inject, onBeforeUnmount, watch } from "vue";
import * as THREE from "three";
import {
    performanceTextureProfileMap,
    usePerformanceSceneState,
    type PerformanceTextureProfile,
} from "../../composables/usePerformanceSceneState";
import { performanceSceneContextKey } from "./sceneContext";

const sceneContext = inject(performanceSceneContextKey);

if (!sceneContext) {
    throw new Error("TextureCompressionProbe 必须在 PerformanceScene 内使用");
}

const sceneApi = sceneContext;
const { controls, updatePerformanceMetrics, setPerformanceStatus } = usePerformanceSceneState();
const probeRoot = new THREE.Group();
probeRoot.position.set(6.6, 0.68, -5.6);

const textureLoader = new THREE.TextureLoader();
let activeTexture: THREE.Texture | null = null;
let presentationBoard: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null;
let detailPlate: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> | null = null;
let pulseRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null = null;
let loadToken = 0;
let isUnmounted = false;

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
    if (Array.isArray(material)) {
        material.forEach((item) => item.dispose());
        return;
    }

    material.dispose();
}

function disposeTexture() {
    if (!activeTexture) return;
    activeTexture.dispose();
    activeTexture = null;
}

function disposeProbe() {
    probeRoot.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
            mesh.geometry.dispose();
        }

        if (mesh.material) {
            disposeMaterial(mesh.material);
        }
    });

    disposeTexture();
    probeRoot.clear();
    presentationBoard = null;
    detailPlate = null;
    pulseRing = null;
}

function ensureProbe(scene: THREE.Scene) {
    if (probeRoot.parent !== scene) {
        scene.add(probeRoot);
    }

    if (presentationBoard) return;

    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(2.88, 2, 0.16),
        new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.4, metalness: 0.58 }),
    );
    frame.castShadow = true;
    frame.receiveShadow = true;

    presentationBoard = new THREE.Mesh(
        new THREE.PlaneGeometry(2.34, 1.58),
        new THREE.MeshStandardMaterial({
            color: "#f8fafc",
            roughness: 0.38,
            metalness: 0.08,
            emissive: "#38bdf8",
            emissiveIntensity: 0.12,
        }),
    );
    presentationBoard.position.z = 0.09;

    detailPlate = new THREE.Mesh(
        new THREE.BoxGeometry(1.52, 0.12, 0.62),
        new THREE.MeshStandardMaterial({ color: "#111827", roughness: 0.72, metalness: 0.16 }),
    );
    detailPlate.position.set(0, -1.16, 0.18);
    detailPlate.castShadow = true;
    detailPlate.receiveShadow = true;

    pulseRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.48, 0.03, 24, 120),
        new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.46 }),
    );
    pulseRing.rotation.x = Math.PI / 2;
    pulseRing.position.set(0, -1.22, 0);

    const rimLight = new THREE.PointLight("#38bdf8", 10, 10, 2);
    rimLight.position.set(0.8, 0.76, 1.6);

    probeRoot.add(frame, presentationBoard, detailPlate, pulseRing, rimLight);
}

function getTextureSize(texture: THREE.Texture) {
    const image = texture.image as { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number } | undefined;

    const width = image?.naturalWidth ?? image?.width ?? 256;
    const height = image?.naturalHeight ?? image?.height ?? 256;

    return {
        width,
        height,
        bytes: width * height * 4,
    };
}

async function applyTextureProfile(profile: PerformanceTextureProfile) {
    if (!presentationBoard) return;

    const descriptor = performanceTextureProfileMap[profile];
    const currentToken = ++loadToken;
    const startTime = performance.now();

    try {
        const texture = await textureLoader.loadAsync(descriptor.url);

        if (isUnmounted || currentToken !== loadToken) {
            texture.dispose();
            return;
        }

        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        texture.anisotropy = Math.min(sceneApi.renderer.value?.capabilities.getMaxAnisotropy() ?? 1, profile === "original" ? 8 : 2);

        disposeTexture();
        activeTexture = texture;

        presentationBoard.material.map = texture;
        presentationBoard.material.emissive.set(descriptor.accent);
        presentationBoard.material.emissiveIntensity = profile === "original" ? 0.16 : 0.1;
        presentationBoard.material.needsUpdate = true;

        if (detailPlate) {
            detailPlate.material.color.set(profile === "original" ? "#0f172a" : "#1f2937");
        }

        const { bytes } = getTextureSize(texture);
        const loadDuration = performance.now() - startTime;

        updatePerformanceMetrics({
            activeTextureProfile: profile,
            textureEstimateBytes: bytes,
            textureLoadMs: Number(loadDuration.toFixed(1)),
        });
        setPerformanceStatus(`${descriptor.label} 已载入：估算显存 ${Math.round(bytes / 1024)} KB，加载耗时 ${loadDuration.toFixed(0)} ms。`);
    } catch {
        if (currentToken !== loadToken) return;
        setPerformanceStatus(`贴图载入失败：${descriptor.label} 当前不可用，请检查资源路径。`);
    }
}

const stopFrameLoop = sceneApi.registerFrameHandler((delta, elapsed) => {
    probeRoot.rotation.y += delta * 0.18;
    probeRoot.position.y = 0.68 + Math.sin(elapsed * 0.9) * 0.08;

    if (pulseRing) {
        pulseRing.material.opacity = 0.26 + Math.sin(elapsed * 1.8) * 0.14;
        pulseRing.scale.setScalar(1 + Math.sin(elapsed * 1.4) * 0.04);
    }
});

watch(
    () => sceneApi.scene.value,
    (scene) => {
        if (!scene) return;
        ensureProbe(scene);
        void applyTextureProfile(controls.textureProfile);
    },
    { immediate: true },
);

watch(
    () => controls.textureProfile,
    (profile) => {
        if (!presentationBoard) return;
        void applyTextureProfile(profile);
    },
);

onBeforeUnmount(() => {
    isUnmounted = true;
    stopFrameLoop();
    disposeProbe();
    probeRoot.parent?.remove(probeRoot);
});
</script>
