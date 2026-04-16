<!-- ============================================================
     ControlPanel.vue — 控制面板容器组件
     
     职责：作为所有控制组件的容器
     → 组合各个子控制组件
     → 管理面板的整体布局和样式
     → 不包含具体业务逻辑，只做组装
     
     组合模式（Composition）：
     → ControlPanel 不自己写按钮/滑块
     → 而是引入子组件，让每个子组件各自负责
     → 这样每个子组件可以独立开发、测试、复用
     
     设计风格：
     - 深色主题 + 毛玻璃效果
     - TDesign 组件库
     - TDesign Icons 图标
============================================================ -->

<script setup lang="ts">
/**
 * 导入所有子控制组件
 *
 * 每个子组件只负责一个功能：
 * - GeometrySelector: 切换几何体
 * - ObjectModeToggle: 切换单/多物体
 * - AnimationToggle: 动画开关
 * - MaterialSwitch: 材质切换
 * - FovSlider: FOV调整
 * - StatusSummary: 状态汇总
 */
import GeometrySelector from "./controls/GeometrySelector.vue";
import ObjectModeToggle from "./controls/ObjectModeToggle.vue";
import AnimationToggle from "./controls/AnimationToggle.vue";
import MaterialSwitch from "./controls/MaterialSwitch.vue";
import FovSlider from "./controls/FovSlider.vue";
import StatusSummary from "./controls/StatusSummary.vue";

// 导入 TDesign 图标
import { ControlPlatformIcon } from "tdesign-icons-vue-next";
</script>

<template>
    <!--
    右侧浮动控制面板
    position: fixed → 固定在屏幕上
    backdrop-filter: blur → 毛玻璃效果
  -->
    <div class="control-panel">
        <!-- 面板标题 -->
        <div class="panel-header">
            <ControlPlatformIcon class="header-icon" />
            <h2>进阶练习控制台</h2>
        </div>

        <!-- 每个子组件各自管理自己的交互逻辑 -->
        <div class="panel-content">
            <GeometrySelector />
            <ObjectModeToggle />
            <AnimationToggle />
            <MaterialSwitch />
            <FovSlider />
            <StatusSummary />
        </div>
    </div>
</template>

<style scoped>
/* 控制面板整体样式 */
.control-panel {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 100;
    width: 300px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;

    /* 深色半透明 + 毛玻璃 */
    background: rgba(15, 15, 30, 0.9);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 16px;
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.05) inset;

    color: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 14px;
}

/* 面板标题区域 */
.panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(99, 102, 241, 0.15);
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), transparent);
    border-radius: 16px 16px 0 0;
}

.header-icon {
    font-size: 22px;
    color: #6366f1;
}

.panel-header h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #e2e8f0;
    letter-spacing: 0.5px;
}

/* 内容区域 */
.panel-content {
    padding: 16px;
}

/* 滚动条 */
.control-panel::-webkit-scrollbar {
    width: 4px;
}

.control-panel::-webkit-scrollbar-track {
    background: transparent;
}

.control-panel::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 2px;
}

.control-panel::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.5);
}

/* TDesign 组件深色主题全局适配 */
:deep(.t-radio-group) {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    padding: 3px;
}

:deep(.t-radio-button) {
    border-radius: 6px;
    font-size: 12px;
}

:deep(.t-radio-button.t-is-checked) {
    background: linear-gradient(135deg, #42b883, #3aa876);
    box-shadow: 0 2px 8px rgba(66, 184, 131, 0.3);
}

:deep(.t-switch.t-is-checked) {
    background: #42b883;
}

:deep(.t-slider__bar) {
    background: rgba(255, 255, 255, 0.1);
}

:deep(.t-slider__track) {
    background: linear-gradient(90deg, #42b883, #6366f1);
}
</style>
