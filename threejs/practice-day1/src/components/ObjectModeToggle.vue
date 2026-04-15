<!-- ============================================================
     ObjectModeToggle.vue — 单/多物体切换组件
     
     职责：让用户在"1个物体"和"3个物体"之间切换
     
     单一职责：只管物体数量模式
     
     TDesign 组件：
     - t-switch: 开关组件
============================================================ -->

<script setup lang="ts">
import { useSceneState } from '../composables/useSceneState'

// 导入 TDesign 图标
import { LayersIcon, AppIcon } from 'tdesign-icons-vue-next'

/** 获取共享状态中的 showMultiple */
const { showMultiple } = useSceneState()
</script>

<template>
  <section class="panel-section">
    <!-- 区块标题 -->
    <h3 class="section-title">
      <LayersIcon class="title-icon" />
      多个物体
    </h3>
    
    <!--
      TDesign Switch 开关组件
      用于切换单物体/多物体模式
    -->
    <div class="switch-container">
      <div class="switch-label">
        <AppIcon v-if="!showMultiple" class="status-icon single" />
        <LayersIcon v-else class="status-icon multiple" />
        <span>{{ showMultiple ? '3 个物体' : '单物体' }}</span>
      </div>
      <t-switch
        v-model="showMultiple"
        size="large"
      />
    </div>
    
    <!-- 提示文字 -->
    <p class="hint">开启后显示绿/紫/红三个不同位置的物体</p>
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

.switch-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e2e8f0;
  font-size: 13px;
}

.status-icon {
  font-size: 18px;
}

.status-icon.single {
  color: #64748b;
}

.status-icon.multiple {
  color: #6366f1;
}

.hint {
  margin: 8px 0 0 0;
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
}
</style>
