<!-- ============================================================
     GeometrySelector.vue — 几何体选择器组件
     
     职责：提供单选按钮组让用户切换4种几何体
     → 盒子 / 球体 / 圆锥 / 甜甜圈
     
     单一职责：只管几何体切换，不管其他功能
     
     TDesign 组件：
     - t-radio-group: 单选按钮组容器
     - t-radio-button: 单选按钮（按钮样式）
============================================================ -->

<script setup lang="ts">
import { useSceneState } from '../composables/useSceneState'

// 导入 TDesign 图标
import { ViewModuleIcon, CircleIcon } from 'tdesign-icons-vue-next'

/** 获取共享状态中的几何体相关数据 */
const { currentGeometry, geometryOptions } = useSceneState()

/**
 * 几何体选项配置（带图标）
 * 用于渲染 RadioGroup
 */
const optionsWithIcons = [
  { label: '盒子', value: 'box', icon: ViewModuleIcon },
  { label: '球体', value: 'sphere', icon: CircleIcon },
  { label: '圆锥', value: 'cone', icon: CircleIcon },
  { label: '甜甜圈', value: 'torus', icon: CircleIcon },
]
</script>

<template>
  <section class="panel-section">
    <!-- 区块标题 -->
    <h3 class="section-title">
      <CircleIcon class="title-icon" />
      切换几何体
    </h3>
    
    <!--
      TDesign RadioGroup 单选按钮组
      
      Props:
      - v-model: 双向绑定当前选中值
      - variant: 按钮样式变体（outline/primary-filled/default-filled）
      - size: 组件尺寸（small/medium/large）
      
      Events:
      - @change: 值变化时触发
    -->
    <t-radio-group
      v-model="currentGeometry"
      variant="default-filled"
      size="small"
    >
      <!--
        遍历渲染单选按钮
        t-radio-button 用于按钮样式的单选项
      -->
      <t-radio-button
        v-for="option in optionsWithIcons"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </t-radio-button>
    </t-radio-group>
    
    <!-- 提示文字 -->
    <p class="hint">点击切换不同的 3D 几何体形状</p>
  </section>
</template>

<style scoped>
.panel-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 500;
  color: #a5b4fc;
}

.title-icon {
  font-size: 16px;
}

.hint {
  margin: 8px 0 0 0;
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
}

/* TDesign 按钮组深色主题适配 */
:deep(.t-radio-group) {
  width: 100%;
}

:deep(.t-radio-button) {
  flex: 1;
}
</style>
