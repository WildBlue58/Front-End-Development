/**
 * 路由配置
 *
 * 使用 Hash 模式（createWebHashHistory）
 * → 部署时不需要服务端配置 fallback，直接可用
 *
 * 路由结构：
 * /#/practice1 → Day1 基础几何体场景
 * /#/practice2 → Day2 模型加载与动画控制
 */

import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: "/",
            redirect: "/practice1",
        },
        {
            path: "/practice1",
            name: "Practice1",
            component: () => import("../pages/Practice1Page.vue"),
            meta: { title: "Day 1：基础3D场景" },
        },
        {
            path: "/practice2",
            name: "Practice2",
            component: () => import("../pages/Practice2Page.vue"),
            meta: { title: "Day 2：模型加载与动画" },
        },
        {
            path: "/practice3",
            name: "Practice3",
            component: () => import("../pages/Practice3Page.vue"),
            meta: { title: "Day 3：PBR 材质" },
        },
    ],
});

export default router;
