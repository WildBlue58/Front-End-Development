<script setup lang="ts">
import { useProductShowcaseState } from "../../composables/useProductShowcaseState";

const { costEntries } = useProductShowcaseState();
</script>

<template>
    <section class="solution-card">
        <div class="card-head">
            <div>
                <p class="eyebrow">Solution Research</p>
                <h3>方案切换成本表</h3>
            </div>
            <span class="badge">纯 Web 优先</span>
        </div>
        <p class="card-copy">当前页面把本地 Three.js 渲染作为主链路，因为它和业务 UI、埋点、响应式和资产热更新耦合更自然；同时保留 Sketchfab 作为备用外链方案，用于快速验证嵌入与兜底展示。</p>
        <div class="cost-grid">
            <div v-for="item in costEntries" :key="item.route" class="cost-card">
                <strong>{{ item.route }}</strong>
                <span>画质：{{ item.quality }}</span>
                <span>延迟：{{ item.latency }}</span>
                <span>运维：{{ item.ops }}</span>
                <span>适配：{{ item.fit }}</span>
                <small>{{ item.verdict }}</small>
            </div>
        </div>
    </section>
</template>

<style scoped>
.solution-card { padding: 18px 20px; border-radius: 24px; border: 1px solid rgba(148, 163, 184, 0.14); background: rgba(3, 7, 18, 0.72); backdrop-filter: blur(14px); box-shadow: 0 24px 80px rgba(2, 6, 23, 0.38); color: #dbeafe; display: grid; gap: 14px; }
.card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.eyebrow { margin: 0 0 6px; color: #7dd3fc; letter-spacing: 0.18em; text-transform: uppercase; font-size: 11px; }
.card-head h3 { margin: 0; font-size: 20px; color: #f8fafc; }
.badge { display: inline-flex; align-items: center; min-height: 28px; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(56, 189, 248, 0.24); background: rgba(56, 189, 248, 0.12); color: #a5f3fc; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
.card-copy { margin: 0; color: #cbd5e1; line-height: 1.72; font-size: 13px; }
.cost-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.cost-card { display: grid; gap: 6px; padding: 14px; border-radius: 18px; border: 1px solid rgba(148, 163, 184, 0.12); background: rgba(15, 23, 42, 0.52); }
.cost-card strong { color: #f8fafc; }
.cost-card span,.cost-card small { color: #94a3b8; font-size: 12px; line-height: 1.6; }
.cost-card small { color: #a5f3fc; }
@media (max-width: 980px) { .cost-grid { grid-template-columns: 1fr; } }
</style>
