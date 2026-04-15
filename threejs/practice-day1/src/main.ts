/**
 * main.ts - Vue 应用入口
 * 
 * 配置全局插件和注册组件
 */

import { createApp } from 'vue'

// ========================================
// TDesign 组件库配置
// ========================================
import TDesign from 'tdesign-vue-next'
import 'tdesign-vue-next/es/style/index.css'

// TDesign 图标库
import * as Icons from 'tdesign-icons-vue-next'

// 路由
import router from './router'

import './style.css'
import App from './App.vue'

const app = createApp(App)

// 注册 TDesign 组件库
app.use(TDesign)

// 注册 vue-router
app.use(router)

// ========================================
// 全局注册所有 TDesign 图标组件
// ========================================
Object.keys(Icons).forEach((key) => {
  if (typeof Icons[key as keyof typeof Icons] === 'object' && 'name' in (Icons[key as keyof typeof Icons] as any)) {
    app.component(key, Icons[key as keyof typeof Icons])
  }
})

app.mount('#app')
