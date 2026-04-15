<!-- ============================================================
     AnimationToggle.vue — 动画开关组件
     
     职责：控制3D物体的自转动画开关
     
     单一职责：只管动画的开启/关闭
     
     TDesign 组件：
     - t-switch: 开关组件
     - LoadingIcon: 动画图标
============================================================ -->

<script setup lang="ts">
import { useSceneState } from '../composables/useSceneState'

// 导入 TDesign 图标
import { PlayCircleIcon, PauseCircleIcon } from 'tdesign-icons-vue-next'

/** 获取共享状态中的 isAnimating */
const { isAnimating } = useSceneState()
</script>

<template>
  <section class="panel-section">
    <!-- 区块标题 -->
    <h3 class="section-title">
      <PlayCircleIcon class="title-icon" />
      旋转动画
    </h3>
    
    <!--
      TDesign Switch 开关组件
      
      Props:
      - v-model: 双向绑定开关状态
      - size: 尺寸（small/medium/large）
      - loading: 加载状态
      
      Events:
      - @change: 状态变化时触发
    -->
    <div class="switch-container">
      <div class="switch-label">
        <PauseCircleIcon v-if="!isAnimating" class="status-icon paused" />
        <PlayCircleIcon v-else class="status-icon playing" />
        <span>{{ isAnimating ? '旋转中' : '已暂停' }}</span>
      </div>
      <t-switch
        v-model="isAnimating"
        size="large"
      />
    </div>
    
    <!-- 提示文字 -->
    <p class="hint">开启后物体将沿 Y 轴持续旋转</p>
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

.status-icon.paused {
  color: #64748b;
}

.status-icon.playing {
  color: #42b883;
}

.hint {
  margin: 8px 0 0 0;
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
}

/* TDesign Switch 深色主题适配 */
:deep(.t-switch) {
  --td-brand-color: #42b883;
}
</style>
