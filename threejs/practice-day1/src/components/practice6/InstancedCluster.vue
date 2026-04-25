<script setup lang="ts">
import { inject, onBeforeUnmount, watch } from "vue";
import * as THREE from "three";
import { meshSafeCap, usePerformanceSceneState } from "../../composables/usePerformanceSceneState";
import { getClusterDataset, type ClusterDatum } from "./clusterDataset";
import { performanceSceneContextKey } from "./sceneContext";

const sceneContext = inject(performanceSceneContextKey);

if (!sceneContext) {
    throw new Error("InstancedCluster 必须在 PerformanceScene 内使用");
}

const sceneApi = sceneContext;
const { controls, updatePerformanceMetrics, setPerformanceStatus } = usePerformanceSceneState();
const clusterRoot = new THREE.Group();
clusterRoot.position.set(0, -0.4, 0);

let instancedMesh: THREE.InstancedMesh | null = null;
let meshGroup: THREE.Group | null = null;
let sharedGeometry: THREE.BoxGeometry | null = null;
let sharedMaterial: THREE.MeshStandardMaterial | null = null;
let currentDataset: ClusterDatum[] = [];

const frustum = new THREE.Frustum();
const projectionMatrix = new THREE.Matrix4();
const tempSphere = new THREE.Sphere();
const visibleSet = new Set<number>();

function disposeSharedResources() {
    sharedGeometry?.dispose();
    sharedMaterial?.dispose();
    sharedGeometry = null;
    sharedMaterial = null;
}

function disposeCurrentCluster() {
    if (instancedMesh) {
        clusterRoot.remove(instancedMesh);
        instancedMesh = null;
    }

    if (meshGroup) {
        clusterRoot.remove(meshGroup);
        meshGroup.clear();
        meshGroup = null;
    }

    disposeSharedResources();
    currentDataset = [];
}

function ensureRootInScene(scene: THREE.Scene) {
    if (clusterRoot.parent !== scene) {
        scene.add(clusterRoot);
    }
}

function getActiveDatasetCount() {
    return controls.renderMode === "mesh" ? Math.min(controls.instanceCount, meshSafeCap) : controls.instanceCount;
}

function createClusterMaterial(vertexColors: boolean) {
    return new THREE.MeshStandardMaterial({
        color: vertexColors ? "#ffffff" : "#67e8f9",
        roughness: 0.34,
        metalness: 0.48,
        emissive: vertexColors ? "#0f7898" : "#12516c",
        emissiveIntensity: 0.24,
        vertexColors,
    });
}

function applyInstancedMatrices(indices: number[]) {
    if (!instancedMesh) return;

    indices.forEach((datasetIndex, slot) => {
        const datum = currentDataset[datasetIndex];
        instancedMesh?.setMatrixAt(slot, datum.matrix);
        instancedMesh?.setColorAt(slot, datum.color);
    });

    instancedMesh.count = indices.length;
    instancedMesh.instanceMatrix.needsUpdate = true;

    if (instancedMesh.instanceColor) {
        instancedMesh.instanceColor.needsUpdate = true;
    }
}

function applyMeshVisibility(indices: number[]) {
    if (!meshGroup) return;

    visibleSet.clear();
    indices.forEach((index) => visibleSet.add(index));

    meshGroup.children.forEach((child, index) => {
        child.visible = visibleSet.has(index);
    });
}

function updateVisibilityState() {
    if (!currentDataset.length) {
        updatePerformanceMetrics({ visibleCount: 0, culledCount: 0 });
        return;
    }

    const activeCount = currentDataset.length;

    if (!controls.enableVisibilityCulling) {
        const indices = currentDataset.map((_, index) => index);

        if (controls.renderMode === "instanced") {
            applyInstancedMatrices(indices);
        } else {
            applyMeshVisibility(indices);
        }

        updatePerformanceMetrics({ visibleCount: activeCount, culledCount: 0 });
        return;
    }

    const camera = sceneApi.camera.value;
    if (!camera) return;

    clusterRoot.updateMatrixWorld(true);
    projectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projectionMatrix);

    const visibleIndices: number[] = [];

    currentDataset.forEach((datum, index) => {
        tempSphere.copy(datum.sphere).applyMatrix4(clusterRoot.matrixWorld);

        if (frustum.intersectsSphere(tempSphere)) {
            visibleIndices.push(index);
        }
    });

    if (controls.renderMode === "instanced") {
        applyInstancedMatrices(visibleIndices);
    } else {
        applyMeshVisibility(visibleIndices);
    }

    updatePerformanceMetrics({
        visibleCount: visibleIndices.length,
        culledCount: Math.max(activeCount - visibleIndices.length, 0),
    });
}

function buildCluster(scene: THREE.Scene) {
    ensureRootInScene(scene);
    disposeCurrentCluster();

    currentDataset = getClusterDataset(getActiveDatasetCount());
    const geometry = new THREE.BoxGeometry(0.56, 0.56, 0.56);
    const material = createClusterMaterial(controls.renderMode === "instanced");
    sharedGeometry = geometry;
    sharedMaterial = material;

    if (controls.renderMode === "instanced") {
        const mesh = new THREE.InstancedMesh(geometry, material, currentDataset.length);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        instancedMesh = mesh;
        clusterRoot.add(mesh);
    } else {
        meshGroup = new THREE.Group();

        currentDataset.forEach((datum) => {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.frustumCulled = false;
            mesh.matrixAutoUpdate = false;
            mesh.matrix.copy(datum.matrix);
            mesh.matrixWorldNeedsUpdate = true;
            meshGroup?.add(mesh);
        });

        clusterRoot.add(meshGroup);
    }

    updateVisibilityState();

    if (controls.renderMode === "mesh" && controls.instanceCount > meshSafeCap) {
        setPerformanceStatus(`普通 Mesh 模式已启用 ${meshSafeCap} 个安全上限，避免高数量直接拖垮页面。`);
    }
}

const stopFrameLoop = sceneContext.registerFrameHandler((delta, elapsed) => {
    if (!controls.autoRotate) {
        clusterRoot.rotation.y += (0 - clusterRoot.rotation.y) * 0.08;
        clusterRoot.rotation.x += (0 - clusterRoot.rotation.x) * 0.08;
    } else {
        clusterRoot.rotation.y += delta * 0.2;
        clusterRoot.rotation.x = Math.sin(elapsed * 0.38) * 0.07;
    }

    if (controls.enableVisibilityCulling) {
        updateVisibilityState();
    }
});

watch(
    () => sceneContext.scene.value,
    (scene) => {
        if (!scene) return;
        buildCluster(scene);
    },
    { immediate: true },
);

watch(
    () => [controls.instanceCount, controls.renderMode],
    () => {
        const scene = sceneApi.scene.value;
        if (!scene) return;
        buildCluster(scene);
    },
);

watch(
    () => controls.enableVisibilityCulling,
    (value) => {
        updateVisibilityState();
        setPerformanceStatus(value ? "已启用轻量视锥剔除：HUD 会显示可见数量与剔除收益。" : "已关闭视锥剔除：当前保持全量对象激活，方便做基线对照。");
    },
);

onBeforeUnmount(() => {
    stopFrameLoop();
    disposeCurrentCluster();
    clusterRoot.parent?.remove(clusterRoot);
});
</script>
