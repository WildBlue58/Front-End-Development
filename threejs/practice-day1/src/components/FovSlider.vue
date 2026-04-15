<!-- ============================================================
     FovSlider.vue — 相机 FOV 滑块组件
     
     职责：通过滑块调整相机视场角
     
     单一职责：只管 FOV 数值的调整
     
     TDesign 组件：
     - t-slider: 滑块组件
============================================================ -->

<script setup lang="ts">
import { useSceneState } from '../composables/useSceneState'

// 导入 TDesign 图标
import { ViewInArIcon } from 'tdesign-icons-vue-next'

/** 获取共享状态中的 cameraFov */
const { cameraFov } = useSceneState()

/**
 * FOV 预设标签
 * 用于在滑块上显示刻度标签
 */
const marks = {
  20: '20°',
  45: '45°',
  75: '75°',
  100: '100°',
  120: '120°',
}
</script>

<template>
  <section class="panel-section">
    <!-- 区块标题 -->
    <h3 class="section-title">
      <ViewInArIcon class="title-icon" />
      相机视场角 (FOV)
    </h3>
    
    <!--
      TDesign Slider 滑块组件
      
      Props:
      - v-model: 双向绑定当前值
      - min: 最小值
      - max: 最大值
      - step: 步长
      - marks: 刻度标签
      - show-step: 是否显示步长刻度
      
      Events:
      - @change: 值变化时触发
    -->
    <t-slider
      v-model="cameraFov"
      :min="20"
      :max="120"
      :step="1"
      :marks="marks"
      show-step
    />
    
    <!-- 当前 FOV 值显示 -->
    <div class="fov-display">
      <span class="fov-label">当前视场角</span>
      <span class="fov-value">{{ cameraFov }}°</span>
    </div>
    
    <!-- 提示文字 -->
    <p class="hint">20°=望远镜 75°=正常人眼 120°=鱼眼</p>
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
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 500;
  color: #a5b4fc;
}

.title-icon {
  font-size: 16px;
}

.fov-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 6px;
}

.fov-label {
  font-size: 12px;
  color: #94a3b8;
}

.fov-value {
  font-size: 16px;
  font-weight: 600;
  color: #6366f1;
}

.hint {
  margin: 8px 0 0 0;
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
}

/* TDesign Slider 深色主题适配 */
:deep(.t-slider) {
  --td-brand-color: #42b883;
}

:deep(.t-slider__mark-item) {
  color: #64748b;
  font-size: 10px;
}
</style>
