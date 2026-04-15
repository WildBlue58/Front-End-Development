<!-- ============================================================
     StatusSummary.vue — 状态汇总组件
     
     职责：实时显示当前所有场景配置的汇总信息
     
     单一职责：只负责展示状态，不修改任何数据
     → 这是一个"只读"组件
     
     TDesign 组件：
     - 自定义卡片样式
============================================================ -->

<script setup lang="ts">
import { useSceneState } from '../composables/useSceneState'

// 导入 TDesign 图标
import { 
  ChartIcon, 
  CircleIcon, 
  LayersIcon, 
  PlayCircleIcon, 
  LightbulbIcon, 
  ViewListIcon 
} from 'tdesign-icons-vue-next'

/** 获取所有需要展示的状态 */
const {
  geometryLabel,
  showMultiple,
  isAnimating,
  materialLabel,
  cameraFov,
} = useSceneState()
</script>

<template>
  <section class="status-card">
    <!-- 区块标题 -->
    <h3 class="section-title">
      <ChartIcon class="title-icon" />
      当前状态
    </h3>
    
    <!--
      状态列表
      使用 flex 布局展示各项状态
    -->
    <div class="status-list">
      <!-- 几何体类型 -->
      <div class="status-item">
        <div class="item-icon">
          <CircleIcon />
        </div>
        <div class="item-content">
          <span class="item-label">几何体</span>
          <span class="item-value">{{ geometryLabel }}</span>
        </div>
      </div>
      
      <!-- 物体数量 -->
      <div class="status-item">
        <div class="item-icon">
          <LayersIcon />
        </div>
        <div class="item-content">
          <span class="item-label">物体数</span>
          <span class="item-value">{{ showMultiple ? 3 : 1 }}</span>
        </div>
      </div>
      
      <!-- 动画状态 -->
      <div class="status-item">
        <div class="item-icon" :class="{ active: isAnimating }">
          <PlayCircleIcon />
        </div>
        <div class="item-content">
          <span class="item-label">动画</span>
          <span class="item-value" :class="{ active: isAnimating }">
            {{ isAnimating ? '旋转中' : '静止' }}
          </span>
        </div>
      </div>
      
      <!-- 材质类型 -->
      <div class="status-item">
        <div class="item-icon">
          <LightbulbIcon />
        </div>
        <div class="item-content">
          <span class="item-label">材质</span>
          <span class="item-value">{{ materialLabel }}</span>
        </div>
      </div>
      
      <!-- FOV 值 -->
      <div class="status-item">
        <div class="item-icon">
          <ViewListIcon />
        </div>
        <div class="item-content">
          <span class="item-label">FOV</span>
          <span class="item-value">{{ cameraFov }}°</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.status-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: #a78bfa;
}

.title-icon {
  font-size: 16px;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  transition: background 0.2s ease;
}

.status-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  font-size: 14px;
}

.item-icon.active {
  background: rgba(66, 184, 131, 0.2);
  color: #42b883;
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.item-label {
  font-size: 12px;
  color: #94a3b8;
}

.item-value {
  font-size: 12px;
  font-weight: 500;
  color: #e2e8f0;
}

.item-value.active {
  color: #42b883;
}
</style>
