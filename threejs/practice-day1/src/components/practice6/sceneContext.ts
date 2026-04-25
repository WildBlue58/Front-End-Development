import type { InjectionKey, ShallowRef } from "vue";
import type { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import * as THREE from "three";

export interface PerformanceSceneContext {
    scene: ShallowRef<THREE.Scene | null>;
    camera: ShallowRef<THREE.PerspectiveCamera | null>;
    renderer: ShallowRef<THREE.WebGLRenderer | null>;
    composer: ShallowRef<EffectComposer | null>;
    registerFrameHandler: (handler: (delta: number, elapsed: number) => void) => () => void;
}

export const performanceSceneContextKey: InjectionKey<PerformanceSceneContext> = Symbol("performance-scene-context");
