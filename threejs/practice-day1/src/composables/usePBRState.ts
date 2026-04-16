/**
 * usePBRState — Practice3 PBR 材质场景共享状态
 *
 * 管理两个对比球体的所有材质参数：
 * - 左球：MeshStandardMaterial（基础 PBR）
 * - 右球：MeshPhysicalMaterial（扩展 PBR，按预设切换）
 */

import { ref } from "vue";

// ============================================================
//  两球共用的基础参数
// ============================================================

/** 基础颜色 */
const color = ref("#42b883");

/** 金属度：0 = 非金属，1 = 全金属 */
const metalness = ref(0.5);

/** 粗糙度：0 = 镜面光滑，1 = 完全哑光 */
const roughness = ref(0.3);

/** 环境贴图反射强度 */
const envMapIntensity = ref(1.0);

// ============================================================
//  左球（Standard）专属：自发光
// ============================================================

/** 自发光颜色 */
const emissiveColor = ref("#42b883");

/** 自发光强度（0 = 不发光） */
const emissiveIntensity = ref(0.0);

// ============================================================
//  右球（Physical）专属参数
// ============================================================

/** 清漆层强度（汽车漆效果）*/
const clearcoat = ref(0.8);

/** 清漆层粗糙度 */
const clearcoatRoughness = ref(0.05);

/** 透光率：1 = 完全透明（玻璃效果）*/
const transmission = ref(0.0);

/** 折射率（IOR）：玻璃约 1.45-1.6，水约 1.33）*/
const ior = ref(1.5);

/** 光泽强度（布料/天鹅绒效果）*/
const sheenIntensity = ref(0.0);

/** 光泽颜色 */
const sheenColor = ref("#a78bfa");

/** 虹彩效果强度（肥皂泡/蝴蝶翅膀）*/
const iridescence = ref(0.0);

// ============================================================
//  物理材质预设类型
// ============================================================

export type PhysicalPreset = "clearcoat" | "glass" | "velvet";

/** 当前激活的物理材质预设 */
const physicalPreset = ref<PhysicalPreset>("clearcoat");

// ============================================================
//  Composable 函数
// ============================================================

export function usePBRState() {
    /**
     * 应用物理材质预设
     * 同时更新颜色和相关 Physical 专属参数，方便直观对比
     */
    function applyPreset(preset: PhysicalPreset) {
        physicalPreset.value = preset;

        if (preset === "clearcoat") {
            // 汽车漆：深红 + 清漆层
            color.value = "#c0392b";
            metalness.value = 0.3;
            roughness.value = 0.2;
            clearcoat.value = 1.0;
            clearcoatRoughness.value = 0.05;
            transmission.value = 0;
            sheenIntensity.value = 0;
            iridescence.value = 0;
        } else if (preset === "glass") {
            // 玻璃：无色 + 全透射
            color.value = "#ffffff";
            metalness.value = 0;
            roughness.value = 0;
            clearcoat.value = 0;
            transmission.value = 1.0;
            ior.value = 1.5;
            sheenIntensity.value = 0;
            iridescence.value = 0;
        } else if (preset === "velvet") {
            // 天鹅绒：深紫 + 光泽层
            color.value = "#6d28d9";
            metalness.value = 0;
            roughness.value = 0.8;
            clearcoat.value = 0;
            transmission.value = 0;
            sheenIntensity.value = 1.0;
            sheenColor.value = "#a78bfa";
            iridescence.value = 0;
        }
    }

    return {
        // 共用基础参数
        color,
        metalness,
        roughness,
        envMapIntensity,
        // Standard 自发光
        emissiveColor,
        emissiveIntensity,
        // Physical 专属
        clearcoat,
        clearcoatRoughness,
        transmission,
        ior,
        sheenIntensity,
        sheenColor,
        iridescence,
        // 预设
        physicalPreset,
        applyPreset,
    };
}
