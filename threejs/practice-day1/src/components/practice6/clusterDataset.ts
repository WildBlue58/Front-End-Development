import * as THREE from "three";

export interface ClusterDatum {
    matrix: THREE.Matrix4;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: number;
    color: THREE.Color;
    sphere: THREE.Sphere;
}

const datasetCache = new Map<number, ClusterDatum[]>();

export function getClusterDataset(count: number): ClusterDatum[] {
    const safeCount = Math.max(0, Math.floor(count));
    const cached = datasetCache.get(safeCount);

    if (cached) {
        return cached;
    }

    const columns = Math.max(1, Math.ceil(Math.sqrt(safeCount)));
    const spacing = 0.84;
    const data: ClusterDatum[] = [];

    for (let index = 0; index < safeCount; index += 1) {
        const x = (index % columns) - columns / 2;
        const z = Math.floor(index / columns) - columns / 2;
        const wave = Math.sin(index * 0.31) * 0.22;
        const ripple = Math.cos(index * 0.13) * 0.12;
        const lift = ((index % 9) - 4) * 0.045;
        const scale = 0.72 + ((index % 6) * 0.055);

        const position = new THREE.Vector3(x * spacing, wave + ripple + lift, z * spacing * 0.88);
        const rotation = new THREE.Euler(wave * 0.55, index * 0.057, ripple * 0.34);
        const matrix = new THREE.Matrix4().compose(
            position,
            new THREE.Quaternion().setFromEuler(rotation),
            new THREE.Vector3(scale, scale, scale),
        );
        const color = new THREE.Color("#38bdf8").lerp(new THREE.Color("#42b883"), (index % 11) / 10);
        const sphere = new THREE.Sphere(position.clone(), 0.44 + scale * 0.42);

        data.push({
            matrix,
            position,
            rotation,
            scale,
            color,
            sphere,
        });
    }

    datasetCache.set(safeCount, data);
    return data;
}
