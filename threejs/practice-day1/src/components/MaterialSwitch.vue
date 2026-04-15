<!-- ============================================================
     MaterialSwitch.vue — 材质切换组件
     
     职责：让用户在 Standard 和 Basic 两种材质之间切换
     
     单一职责：只管材质类型切换
     
     TDesign 组件：
     - t-radio-group: 单选按钮组
     - t-radio-button: 单选按钮
============================================================ -->

<script setup lang="ts">
import { useSceneState } from '../composables/useSceneState'

// 导入 TDesign 图标
import { LightbulbIcon, LightbulbCircleIcon } from 'tdesign-icons-vue-next'

/** 获取共享状态中的材质相关数据 */
const { materialType, materialLabel } = useSceneState()
</script>

<template>
  <section class="panel-section">
    <!-- 区块标题 -->
    <h3 class="section-title">
      <LightbulbIcon class="title-icon" />
      切换材质
    </h3>
    
    <!--
      TDesign RadioGroup 单选按钮组
      用于切换材质类型
    -->
    <t-radio-group
      v-model="materialType"
      variant="default-filled"
      size="small"
    >
      <t-radio-button value="standard">
        Standard
      </t-radio-button>
      <t-radio-button value="basic">
        Basic
      </t-radio-button>
    </t-radio-group>
    
    <!-- 当前材质说明 -->
    <div class="material-info">
      <LightbulbIcon v-if="materialType === 'standard'" class="info-icon" />
      <LightbulbCircleIcon v-else class="info-icon off" />
      <span>{{ materialLabel }}</span>
    </div>
    
    <!-- 提示文字 -->
    <p class="hint">Standard 受光照有明暗，Basic 纯色无光影</p>
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

.material-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.info-icon {
  font-size: 14px;
  color: #fbbf24;
}

.info-icon.off {
  color: #64748b;
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
