<script setup lang="ts">
import { inject, onBeforeUnmount, watch } from "vue";
import * as THREE from "three";
import { normalizeLodThresholds, usePerformanceSceneState } from "../../composables/usePerformanceSceneState";
import { performanceSceneContextKey } from "./sceneContext";

const sceneContext = inject(performanceSceneContextKey);

if (!sceneContext) {
    throw new Error("LodProbe 必须在 PerformanceScene 内使用");
}

const { controls, updatePerformanceMetrics, setPerformanceStatus } = usePerformanceSceneState();
const probeRoot = new THREE.Group();
probeRoot.position.set(0, 1.35, -10.6);
let lod: THREE.LOD | null = null;

function disposeProbe() {
    probeRoot.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
            mesh.geometry.dispose();
        }

        if (mesh.material) {
            const material = mesh.material;
            if (Array.isArray(material)) {
                material.forEach((item) => item.dispose());
            } else {
                material.dispose();
            }
        }
    });

    probeRoot.clear();
    lod = null;
}

function createProbeMaterial(color: string, emissiveIntensity: number) {
    return new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity,
        roughness: 0.26,
        metalness: 0.66,
    });
}

function buildProbe(scene: THREE.Scene) {
    disposeProbe();

    if (probeRoot.parent !== scene) {
        scene.add(probeRoot);
    }

    const thresholds = normalizeLodThresholds(controls.lodThresholds);

    const ultraPoly = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.96, 6),
        createProbeMaterial("#fde68a", 1.82),
    );
    const highPoly = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.96, 4),
        createProbeMaterial("#f59e0b", 1.52),
    );
    const midPoly = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.96, 2),
        createProbeMaterial("#fb923c", 1.2),
    );
    const lowPoly = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.04, 0),
        createProbeMaterial("#fdba74", 0.96),
    );

    [ultraPoly, highPoly, midPoly, lowPoly].forEach((mesh) => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    });

    const probeLod = new THREE.LOD();
    probeLod.addLevel(ultraPoly, 0);
    probeLod.addLevel(highPoly, thresholds.ultraToHigh);
    probeLod.addLevel(midPoly, thresholds.highToMid);
    probeLod.addLevel(lowPoly, thresholds.midToLow);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.54, 0.04, 24, 120),
        new THREE.MeshBasicMaterial({ color: "#fb7185", transparent: true, opacity: 0.46 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.12;

    const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(1.26, 1.54, 0.28, 48),
        new THREE.MeshStandardMaterial({ color: "#111827", roughness: 0.78, metalness: 0.12 }),
    );
    pedestal.position.y = -1.28;
    pedestal.receiveShadow = true;

    const glow = new THREE.PointLight("#fb923c", 18, 12, 2);
    glow.position.set(0, 0.35, 0.4);

    lod = probeLod;
    probeRoot.add(probeLod, ring, pedestal, glow);
}

const stopFrameLoop = sceneContext.registerFrameHandler((delta) => {
    const camera = sceneContext.camera.value;
    if (!camera || !lod) return;

    lod.rotation.y += delta * 0.42;
    lod.update(camera);

    const distance = camera.position.distanceTo(probeRoot.position);
    const thresholds = normalizeLodThresholds(controls.lodThresholds);
    const activeLod = distance >= thresholds.midToLow
        ? "low"
        : distance >= thresholds.highToMid
            ? "mid"
            : distance >= thresholds.ultraToHigh
                ? "high"
                : "ultra";

    updatePerformanceMetrics({
        activeLod,
        cameraDistance: Number(distance.toFixed(2)),
    });
});

watch(
    () => sceneContext.scene.value,
    (scene) => {
        if (!scene) return;
        buildProbe(scene);
    },
    { immediate: true },
);

watch(
    () => [controls.lodThresholds.ultraToHigh, controls.lodThresholds.highToMid, controls.lodThresholds.midToLow],
    () => {
        const scene = sceneContext.scene.value;
        if (!scene) return;
        buildProbe(scene);
        const thresholds = normalizeLodThresholds(controls.lodThresholds);
        setPerformanceStatus(`LOD 阈值已更新：Ultra/High ${thresholds.ultraToHigh.toFixed(1)}，High/Mid ${thresholds.highToMid.toFixed(1)}，Mid/Low ${thresholds.midToLow.toFixed(1)}。`);
    },
);

onBeforeUnmount(() => {
    stopFrameLoop();
    disposeProbe();
    probeRoot.parent?.remove(probeRoot);
});
</script>
