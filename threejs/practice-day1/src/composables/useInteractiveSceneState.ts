import { computed, reactive, ref, watch } from "vue";
import {
    applyMaterialPreset,
    createDefaultShaderState,
    createSceneObjectDefaults,
    interactiveObjectOrder,
    materialPresetDefinitions,
    resolvePorschePart,
    type InteractiveObjectId,
    type InteractiveSceneObjectState,
    type InteractiveShaderState,
    type MaterialPresetKey,
} from "./practice5SceneCatalog";

const STORAGE_KEY = "practice5-interactive-scene-v2";
const MAX_TIMELINE_ENTRIES = 48;

export interface InteractiveTimelineEntry {
    id: string;
    type: string;
    message: string;
    timestamp: number;
    objectId?: InteractiveObjectId | null;
    tone: "info" | "accent" | "warning";
}

export interface ActivePartHint {
    objectId: InteractiveObjectId;
    label: string;
    hint: string;
    rawName: string;
    timestamp: number;
}

export interface DragState {
    active: boolean;
    candidateId: InteractiveObjectId | null;
    objectId: InteractiveObjectId | null;
    offsetX: number;
    offsetZ: number;
    startedAt: number | null;
}

interface PersistedSceneSnapshot {
    version: 2;
    activeObjectId: InteractiveObjectId | null;
    autoRotateSelected: boolean;
    objects: Record<InteractiveObjectId, Pick<InteractiveSceneObjectState, "position" | "rotation" | "scale" | "material">>;
    shader: InteractiveShaderState;
}

const sceneObjects = reactive(createSceneObjectDefaults());
const activeObjectId = ref<InteractiveObjectId | null>("hero-box");
const hoveredObjectId = ref<InteractiveObjectId | null>(null);
const autoRotateSelected = ref(true);
const interactionCount = ref(0);
const timeline = ref<InteractiveTimelineEntry[]>([]);
const activePartHint = ref<ActivePartHint | null>(null);
const restoredFromStorage = ref(false);
const hasPersistedState = ref(false);
const hydrated = ref(false);
const lastSavedAt = ref<number | null>(null);
const lastDragEndedAt = ref(0);
const shaderState = reactive(createDefaultShaderState());
const dragState = reactive<DragState>({ active: false, candidateId: null, objectId: null, offsetX: 0, offsetZ: 0, startedAt: null });

let applyingSnapshot = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const activeObject = computed(() => (activeObjectId.value ? sceneObjects[activeObjectId.value] : null));
const selectedCount = computed(() => (activeObjectId.value ? 1 : 0));
const objectEntries = computed(() => interactiveObjectOrder.map((id) => sceneObjects[id]));

const statusBadge = computed(() => {
    if (dragState.active) return "Dragging";
    if (activePartHint.value) return "Part Hit";
    if (activeObjectId.value) return "Selected";
    if (hoveredObjectId.value) return "Hovered";
    return "Idle";
});

const statusText = computed(() => {
    if (dragState.active && dragState.objectId) return `正在拖拽 ${sceneObjects[dragState.objectId].label}，释放鼠标即可完成落位。`;
    if (activePartHint.value) return `${activePartHint.value.label} 已被命中：${activePartHint.value.hint}`;
    if (activeObject.value) return `当前编辑对象：${activeObject.value.label}。右侧控制台会同步显示它的独立参数与 Shader 联动。`;
    if (hoveredObjectId.value) return `悬停 ${sceneObjects[hoveredObjectId.value].label}，点击即可切换为当前编辑目标。`;
    return "空闲中：尝试点击不同对象、拖拽移动，或打开 Shader 联动观察工作台反馈。";
});

const storageLabel = computed(() => {
    if (restoredFromStorage.value) return "已从本地恢复上次编辑现场";
    if (lastSavedAt.value) return "编辑状态已自动写入本地存储";
    return "尚未写入本地存储";
});

const shaderPreviewState = computed(() => {
    const objectColor = shaderState.syncActiveColor && activeObject.value ? activeObject.value.material.color : shaderState.colorA;
    const accentColor = activeObject.value?.accent ?? shaderState.colorB;
    return {
        ...shaderState,
        colorA: objectColor,
        colorB: shaderState.syncActiveColor ? accentColor : shaderState.colorB,
        amplitude: Math.min(0.7, shaderState.amplitude + (hoveredObjectId.value ? 0.03 : 0) + (dragState.active && shaderState.respondToDrag ? 0.08 : 0)),
        speed: shaderState.speed + (dragState.active && shaderState.respondToDrag ? 0.35 : 0) + (activePartHint.value ? 0.12 : 0),
        rippleStrength: Math.min(0.82, shaderState.rippleStrength + Math.min(interactionCount.value, 24) * 0.006),
        hudIntensity: Math.min(0.96, shaderState.hudIntensity + (activeObjectId.value ? 0.08 : 0)),
    };
});

const persistedSnapshot = computed<PersistedSceneSnapshot>(() => ({
    version: 2,
    activeObjectId: activeObjectId.value,
    autoRotateSelected: autoRotateSelected.value,
    objects: interactiveObjectOrder.reduce((acc, id) => {
        const object = sceneObjects[id];
        acc[id] = { position: { ...object.position }, rotation: { ...object.rotation }, scale: object.scale, material: { ...object.material } };
        return acc;
    }, {} as PersistedSceneSnapshot["objects"]),
    shader: { ...shaderState },
}));

function syncCursor(cursor: "default" | "pointer" | "grab" | "grabbing") {
    if (typeof document === "undefined") return;
    document.body.style.cursor = cursor;
}

function refreshCursor() {
    if (dragState.active) syncCursor("grabbing");
    else if (dragState.candidateId) syncCursor("grab");
    else if (hoveredObjectId.value) syncCursor("pointer");
    else syncCursor("default");
}

function touchInteraction() {
    interactionCount.value += 1;
}

function pushTimeline(type: string, message: string, objectId?: InteractiveObjectId | null, tone: InteractiveTimelineEntry["tone"] = "info") {
    timeline.value = [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type, message, timestamp: Date.now(), objectId, tone }, ...timeline.value].slice(0, MAX_TIMELINE_ENTRIES);
}

function applySceneDefaults() {
    const defaults = createSceneObjectDefaults();
    interactiveObjectOrder.forEach((id) => {
        const source = defaults[id];
        const target = sceneObjects[id];
        Object.assign(target.position, source.position);
        Object.assign(target.rotation, source.rotation);
        target.scale = source.scale;
        Object.assign(target.material, source.material);
    });
    Object.assign(shaderState, createDefaultShaderState());
    activeObjectId.value = "hero-box";
    hoveredObjectId.value = null;
    autoRotateSelected.value = true;
    activePartHint.value = null;
    interactionCount.value = 0;
    timeline.value = [];
    Object.assign(dragState, { active: false, candidateId: null, objectId: null, offsetX: 0, offsetZ: 0, startedAt: null });
    restoredFromStorage.value = false;
}

function readPersistedSnapshot() {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSceneSnapshot;
    hasPersistedState.value = true;
    return parsed.version === 2 ? parsed : null;
}

function persistNow(snapshot = persistedSnapshot.value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    hasPersistedState.value = true;
    lastSavedAt.value = Date.now();
}

function applyPersistedSnapshot(snapshot: PersistedSceneSnapshot) {
    applyingSnapshot = true;
    interactiveObjectOrder.forEach((id) => {
        const saved = snapshot.objects[id];
        if (!saved) return;
        const target = sceneObjects[id];
        Object.assign(target.position, saved.position);
        Object.assign(target.rotation, saved.rotation);
        target.scale = saved.scale;
        Object.assign(target.material, saved.material);
    });
    activeObjectId.value = snapshot.activeObjectId;
    autoRotateSelected.value = snapshot.autoRotateSelected;
    Object.assign(shaderState, snapshot.shader);
    Object.assign(dragState, { active: false, candidateId: null, objectId: null, offsetX: 0, offsetZ: 0, startedAt: null });
    hoveredObjectId.value = null;
    activePartHint.value = null;
    applyingSnapshot = false;
}

function initializeInteractiveSceneState() {
    if (hydrated.value) return;
    const snapshot = readPersistedSnapshot();
    if (snapshot) {
        applyPersistedSnapshot(snapshot);
        restoredFromStorage.value = true;
        pushTimeline("restore-from-storage", "已恢复上次保存的多对象交互工作台", snapshot.activeObjectId, "accent");
    } else {
        applySceneDefaults();
    }
    hydrated.value = true;
    persistNow();
    refreshCursor();
}

function restorePersistedSceneState() {
    const snapshot = readPersistedSnapshot();
    if (!snapshot) return false;
    applyPersistedSnapshot(snapshot);
    restoredFromStorage.value = true;
    pushTimeline("restore-from-storage", "手动恢复本地存档完成", snapshot.activeObjectId, "accent");
    touchInteraction();
    refreshCursor();
    return true;
}

function clearPersistedSceneState() {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    hasPersistedState.value = false;
    lastSavedAt.value = null;
    pushTimeline("storage-cleared", "已清除本地存档，下次刷新将从默认状态开始", activeObjectId.value, "warning");
}

function resetInteractiveSceneState(options: { silent?: boolean } = {}) {
    applyingSnapshot = true;
    applySceneDefaults();
    applyingSnapshot = false;
    if (!options.silent) pushTimeline("scene-reset", "已恢复 Day 5 默认工作台布局与参数", "hero-box", "warning");
    if (hydrated.value) persistNow();
    refreshCursor();
}

function setHoveredObject(id: InteractiveObjectId | null) {
    if (hoveredObjectId.value === id) return;
    const previous = hoveredObjectId.value;
    hoveredObjectId.value = id;
    if (id) pushTimeline("hover-start", `悬停 ${sceneObjects[id].label}`, id);
    else if (previous) pushTimeline("hover-end", `离开 ${sceneObjects[previous].label}`, previous);
    refreshCursor();
}

function setActiveObject(id: InteractiveObjectId | null) {
    if (activeObjectId.value === id) return;
    activeObjectId.value = id;
    if (!id) {
        activePartHint.value = null;
        pushTimeline("deselect", "当前没有对象处于编辑状态", null, "warning");
    } else {
        if (id !== "porsche-911") activePartHint.value = null;
        pushTimeline("select", `切换当前编辑对象为 ${sceneObjects[id].label}`, id, "accent");
    }
    touchInteraction();
}

function toggleSelectedObject(id: InteractiveObjectId) {
    setActiveObject(activeObjectId.value === id ? null : id);
}

function armDrag(objectId: InteractiveObjectId) {
    dragState.candidateId = objectId;
    refreshCursor();
}

function updateDraggedObjectPosition(x: number, z: number) {
    const nextObjectId = dragState.objectId ?? dragState.candidateId;
    if (!nextObjectId) return;
    const target = sceneObjects[nextObjectId];
    if (!dragState.active) {
        dragState.active = true;
        dragState.objectId = nextObjectId;
        dragState.candidateId = null;
        dragState.offsetX = target.position.x - x;
        dragState.offsetZ = target.position.z - z;
        dragState.startedAt = Date.now();
        activeObjectId.value = nextObjectId;
        pushTimeline("drag-start", `开始拖拽 ${target.label}`, nextObjectId, "accent");
        touchInteraction();
    }
    target.position.x = Number((x + dragState.offsetX).toFixed(2));
    target.position.z = Number((z + dragState.offsetZ).toFixed(2));
    refreshCursor();
}

function releaseDrag() {
    if (dragState.active && dragState.objectId) {
        const target = sceneObjects[dragState.objectId];
        lastDragEndedAt.value = Date.now();
        pushTimeline("drag-end", `${target.label} 已落位到 (${target.position.x.toFixed(2)}, ${target.position.z.toFixed(2)})`, dragState.objectId, "accent");
    }
    Object.assign(dragState, { active: false, candidateId: null, objectId: null, offsetX: 0, offsetZ: 0, startedAt: null });
    refreshCursor();
}

function shouldIgnoreSelectionClick() {
    return Date.now() - lastDragEndedAt.value < 180;
}

function applyMaterialPresetToObject(objectId: InteractiveObjectId, preset: MaterialPresetKey) {
    applyMaterialPreset(sceneObjects[objectId].material, preset);
    const label = materialPresetDefinitions.find((item) => item.key === preset)?.label ?? preset;
    pushTimeline("preset-change", `${sceneObjects[objectId].label} 切换到 ${label} 预设`, objectId, "accent");
    touchInteraction();
}

function applyMaterialPresetToActiveObject(preset: MaterialPresetKey) {
    if (!activeObjectId.value) return;
    applyMaterialPresetToObject(activeObjectId.value, preset);
}

function setActiveModelPart(objectId: InteractiveObjectId, rawName: string) {
    const part = resolvePorschePart(rawName);
    activePartHint.value = { objectId, rawName, label: part.label, hint: part.hint, timestamp: Date.now() };
    pushTimeline("part-hit", `${sceneObjects[objectId].label} 命中：${part.label}`, objectId, "accent");
    touchInteraction();
}

watch(
    persistedSnapshot,
    (snapshot) => {
        if (!hydrated.value || applyingSnapshot) return;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => persistNow(snapshot), 180);
    },
    { deep: true },
);

export function useInteractiveSceneState() {
    return {
        sceneObjects,
        objectEntries,
        activeObjectId,
        activeObject,
        hoveredObjectId,
        selectedCount,
        autoRotateSelected,
        interactionCount,
        timeline,
        activePartHint,
        dragState,
        shaderState,
        shaderPreviewState,
        statusBadge,
        statusText,
        storageLabel,
        restoredFromStorage,
        hasPersistedState,
        materialPresetDefinitions,
        initializeInteractiveSceneState,
        restorePersistedSceneState,
        clearPersistedSceneState,
        resetInteractiveSceneState,
        setHoveredObject,
        setActiveObject,
        toggleSelectedObject,
        armDrag,
        updateDraggedObjectPosition,
        releaseDrag,
        shouldIgnoreSelectionClick,
        applyMaterialPresetToObject,
        applyMaterialPresetToActiveObject,
        setActiveModelPart,
    };
}
