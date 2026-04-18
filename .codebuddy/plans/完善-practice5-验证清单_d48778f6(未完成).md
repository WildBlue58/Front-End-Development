---
name: 完善-practice5-验证清单
overview: 针对 `practice5.md` 的“验证清单”段落，先制定详细编辑计划，再在确认后把当前简略勾选项补成与文档内容一致、可操作、可验收的完整验证说明。
todos:
  - id: audit-practice5-checklist-scope
    content: 复核 `practice5.md` 示例、术语与交互目标映射
    status: pending
  - id: rewrite-day5-checklist
    content: 重写 `practice5.md` 验证清单为可操作验收项
    status: pending
    dependencies:
      - audit-practice5-checklist-scope
  - id: final-proofread-doc-consistency
    content: 校对与 `practice1-4.md` 风格及章节格式一致
    status: pending
    dependencies:
      - rewrite-day5-checklist
---

## User Requirements

用户希望基于 `d:/lesson_zp/threejs/practice-day1/src/docs/practice5.md` 现有正文内容，完善第 848-860 行所在的“验证清单”，先输出完整详尽的执行计划，再开始实际修改。范围仅聚焦该文档的验证清单，不扩展到无关章节，不提前执行落地变更。

## Product Overview

该文档是第 5 天练习讲义，主题围绕“响应式状态驱动的 3D 交互场景”。验证清单需要与正文示例保持一致，能指导读者逐项确认页面是否正常展示、控制面板是否生效、鼠标交互是否正确、状态反馈是否同步。视觉上应对应一个包含主物体、地面、参照物、右侧控制面板和左下角状态面板的交互场景。

## Core Features

- 将验证项与正文中的场景元素一一对齐，包括主物体、地面、参照球、控制面板和状态面板
- 将交互验收写具体，覆盖悬停高亮、点击选中、取消选中、自动旋转、状态同步等关键表现
- 将面板调参验收写完整，覆盖位置、缩放、颜色、金属度、粗糙度、线框模式等实际可操作项
- 保持与前四篇讲义一致的文档风格：简洁、可勾选、面向实际验收
- 控制修改边界，只增强“验证清单”的表达清晰度与可执行性，不改变整体章节结构