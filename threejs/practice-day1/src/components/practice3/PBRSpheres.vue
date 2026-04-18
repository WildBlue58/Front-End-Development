<!-- ============================================================
     PBRSpheres.vue — PBR 渲染核心子组件

     支持三种功能：
     1. 对比模式（compare）：左 Standard / 右 Physical 双球对比
     2. 展台模式（showcase）：5 球横排展示典型 PBR 状态
     3. 通道可视化（channelView != 'none'）：用 MeshBasicMaterial 单独显示某贴图通道
     4. 多 HDR 切换：4 个 HDR 文件按需加载并缓存
============================================================ -->

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { useTresContext } from "@tresjs/core";
import { usePBRState } from "../../composables/usePBRState";

const {
    color,
    metalness,
    roughness,
    envMapIntensity,
    emissiveColor,
    emissiveIntensity,
    clearcoat,
    clearcoatRoughness,
    transmission,
    ior,
    sheenIntensity,
    sheenColor,
    iridescence,
    physicalPreset,
    useBasecolorMap,
    useRoughnessMap,
    useNormalMap,
    useAoMap,
    useHdr,
    normalScale,
    aoIntensity,
    viewMode,
    hdrFile,
    channelView,
} = usePBRState();

const { renderer, scene } = useTresContext();

// ── 纹理缓存 ──────────────────────────────────────────────────
const basecolorTex = shallowRef<THREE.Texture | null>(null);
const roughnessTex = shallowRef<THREE.Texture | null>(null);
const normalTex = shallowRef<THREE.Texture | null>(null);
const aoTex = shallowRef<THREE.Texture | null>(null);

type HdrCacheEntry = {
    background: THREE.Texture;
    environment: THREE.Texture;
};

const hdrCache = new Map<string, HdrCacheEntry>();
const hdrPending = new Map<string, Promise<HdrCacheEntry | null>>();
const hdrFiles: Record<string, string> = {
    studio: "/hdr/studio.hdr",
    canary_wharf: "/hdr/canary_wharf_1k.hdr",
    lilienstein: "/hdr/lilienstein_1k.hdr",
    moonless_golf: "/hdr/moonless_golf_1k.hdr",
};
const tresReady = ref(false);
let hdrRequestId = 0;
let destroyed = false;

function applyHdr(entry: HdrCacheEntry | null) {
    const currentScene = scene.value as THREE.Scene | null;
    if (!currentScene) return;

    currentScene.environment = entry?.environment ?? null;
    currentScene.background = entry?.background ?? null;
    currentScene.backgroundBlurriness = entry ? 0.04 : 0;
}

async function ensureHdrLoaded(key: string): Promise<HdrCacheEntry | null> {
    const currentRenderer = renderer.instance as THREE.WebGLRenderer | null;
    if (!currentRenderer) return null;


    const cached = hdrCache.get(key);
    if (cached) return cached;

    const pending = hdrPending.get(key);
    if (pending) return pending;

    const task = new Promise<HdrCacheEntry | null>((resolve) => {
        const pmrem = new THREE.PMREMGenerator(currentRenderer);
        pmrem.compileEquirectangularShader();

        new RGBELoader().load(
            hdrFiles[key] ?? hdrFiles.studio,
            (tex) => {
                tex.mapping = THREE.EquirectangularReflectionMapping;
                const environment = pmrem.fromEquirectangular(tex).texture;
                pmrem.dispose();

                if (destroyed) {
                    tex.dispose();
                    environment.dispose();
                    hdrPending.delete(key);
                    resolve(null);
                    return;
                }

                const entry: HdrCacheEntry = {
                    background: tex,
                    environment,
                };

                hdrCache.set(key, entry);
                hdrPending.delete(key);
                resolve(entry);
            },
            undefined,
            (error) => {
                console.warn(`[PBR] HDR 加载失败: ${key}`, error);
                pmrem.dispose();
                hdrPending.delete(key);
                resolve(null);
            },
        );
    });

    hdrPending.set(key, task);
    return task;
}

async function syncHdr(key: string) {
    if (!tresReady.value) return;

    const requestId = ++hdrRequestId;

    if (!useHdr.value) {
        applyHdr(null);
        return;
    }

    const entry = await ensureHdrLoaded(key);
    if (
        destroyed ||
        requestId !== hdrRequestId ||
        !useHdr.value ||
        hdrFile.value !== key
    ) {
        return;
    }

    applyHdr(entry);
}

onMounted(() => {
    const loader = new THREE.TextureLoader();

    const bc = loader.load("/textures/basecolor.png");
    bc.colorSpace = THREE.SRGBColorSpace;
    basecolorTex.value = bc;

    const rg = loader.load("/textures/roughness.png");
    rg.colorSpace = THREE.LinearSRGBColorSpace;
    roughnessTex.value = rg;

    const nm = loader.load("/textures/normal.png");
    nm.colorSpace = THREE.LinearSRGBColorSpace;
    normalTex.value = nm;

    const ao = loader.load("/textures/ao.png");
    ao.colorSpace = THREE.LinearSRGBColorSpace;
    aoTex.value = ao;
});

const stopRendererReady = renderer.onReady(() => {
    tresReady.value = Boolean(scene.value && renderer.instance);
    void syncHdr(hdrFile.value);
}) as undefined | { off: () => void };


watch(
    () => scene.value,
    (currentScene) => {
        tresReady.value = Boolean(currentScene && renderer.instance);
    },
    { immediate: true },
);

watch(
    [hdrFile, useHdr],
    () => {
        if (!tresReady.value) return;
        void syncHdr(hdrFile.value);
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    stopRendererReady?.off();
    destroyed = true;


    hdrRequestId += 1;
    applyHdr(null);


    hdrCache.forEach(({ background, environment }) => {
        background.dispose();
        environment.dispose();
    });
    hdrCache.clear();
    hdrPending.clear();
});



// ── 条件贴图 ─────────────────────────────────────────────────
const activeBasecolor = computed(() =>
    useBasecolorMap.value ? basecolorTex.value : null,
);
const activeRoughness = computed(() =>
    useRoughnessMap.value ? roughnessTex.value : null,
);
const activeNormal = computed(() =>
    useNormalMap.value ? normalTex.value : null,
);
const activeAo = computed(() => (useAoMap.value ? aoTex.value : null));

// 启用 BaseColor 贴图时颜色用白（避免叠色偏差）
const effectiveColor = computed(() =>
    useBasecolorMap.value && basecolorTex.value ? "#ffffff" : color.value,
);

const effectiveEmissive = computed(() =>
    emissiveIntensity.value > 0 ? emissiveColor.value : "#000000",
);

const isGlass = computed(() => physicalPreset.value === "glass");

// ── 通道可视化贴图 ────────────────────────────────────────────
const channelTexture = computed<THREE.Texture | null>(() => {
    switch (channelView.value) {
        case "basecolor":
            return basecolorTex.value;
        case "roughness":
            return roughnessTex.value;
        case "normal":
            return normalTex.value;
        case "ao":
            return aoTex.value;
        default:
            return null;
    }
});

// ── AO uv1 setup（ref callback，适用于 v-for 和普通 ref）────────
function setupUv1(el: unknown) {
    const mesh = el as THREE.Mesh | null;
    if (mesh?.geometry && !mesh.geometry.attributes.uv1) {
        mesh.geometry.setAttribute("uv1", mesh.geometry.attributes.uv);
    }
}

// ── 展台模式：5 球定义 ────────────────────────────────────────
const showcaseBalls = [
    {
        label: "全金属·光滑",
        metalness: 1.0,
        roughness: 0.02,
        color: "#ffffff",
        x: -4.0,
    },
    {
        label: "全金属·粗糙",
        metalness: 1.0,
        roughness: 0.95,
        color: "#ffffff",
        x: -2.0,
    },
    {
        label: "非金属·光滑",
        metalness: 0.0,
        roughness: 0.02,
        color: "#42b883",
        x: 0.0,
    },
    {
        label: "非金属·粗糙",
        metalness: 0.0,
        roughness: 0.95,
        color: "#42b883",
        x: 2.0,
    },
    {
        label: "半金属",
        metalness: 0.5,
        roughness: 0.5,
        color: "#a78bfa",
        x: 4.0,
    },
] as const;
</script>

<template>
    <!-- ══ 展台模式：5 球 ══ -->
    <template v-if="viewMode === 'showcase'">
        <TresMesh
            v-for="(ball, i) in showcaseBalls"
            :key="i"
            :position="[ball.x, 0, 0]"
            :ref="(el) => setupUv1(el)"
        >
            <TresSphereGeometry :args="[0.78, 64, 64]" />

            <!-- 通道可视化模式 -->
            <TresMeshBasicMaterial
                v-if="channelView !== 'none'"
                :map="channelTexture"
            />

            <!-- 正常 PBR 渲染 -->
            <TresMeshStandardMaterial
                v-else
                :color="
                    useBasecolorMap && basecolorTex ? '#ffffff' : ball.color
                "
                :map="activeBasecolor"
                :roughness-map="activeRoughness"
                :metalness="ball.metalness"
                :roughness="ball.roughness"
                :normal-map="activeNormal"
                :normal-scale="[normalScale, normalScale]"
                :ao-map="activeAo"
                :ao-map-intensity="aoIntensity"
                :env-map-intensity="envMapIntensity"
            />
        </TresMesh>
    </template>

    <!-- ══ 对比模式：左 Standard / 右 Physical ══ -->
    <template v-else>
        <!-- 左球：MeshStandardMaterial -->
        <TresMesh :position="[-2.2, 0, 0]" :ref="(el) => setupUv1(el)">
            <TresSphereGeometry :args="[1, 64, 64]" />

            <TresMeshBasicMaterial
                v-if="channelView !== 'none'"
                :map="channelTexture"
            />
            <TresMeshStandardMaterial
                v-else
                :color="effectiveColor"
                :map="activeBasecolor"
                :roughness-map="activeRoughness"
                :metalness="metalness"
                :roughness="roughness"
                :normal-map="activeNormal"
                :normal-scale="[normalScale, normalScale]"
                :ao-map="activeAo"
                :ao-map-intensity="aoIntensity"
                :emissive="effectiveEmissive"
                :emissive-intensity="emissiveIntensity"
                :env-map-intensity="envMapIntensity"
            />
        </TresMesh>

        <!-- 右球：MeshPhysicalMaterial -->
        <TresMesh :position="[2.2, 0, 0]" :ref="(el) => setupUv1(el)">
            <TresSphereGeometry :args="[1, 64, 64]" />

            <TresMeshBasicMaterial
                v-if="channelView !== 'none'"
                :map="channelTexture"
            />
            <TresMeshPhysicalMaterial
                v-else
                :color="effectiveColor"
                :map="activeBasecolor"
                :roughness-map="activeRoughness"
                :metalness="metalness"
                :roughness="roughness"
                :normal-map="activeNormal"
                :normal-scale="[normalScale, normalScale]"
                :ao-map="activeAo"
                :ao-map-intensity="aoIntensity"
                :clearcoat="clearcoat"
                :clearcoat-roughness="clearcoatRoughness"
                :transmission="transmission"
                :ior="ior"
                :sheen="sheenIntensity"
                :sheen-color="sheenColor"
                :iridescence="iridescence"
                :transparent="isGlass"
                :env-map-intensity="envMapIntensity"
            />
        </TresMesh>
    </template>
</template>
