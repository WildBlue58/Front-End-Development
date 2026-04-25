---
name: generate-practice7-practice8-docs
overview: 基于现有 `practice5.md`、`practice6.md` 的文档结构，整理 `8-day-frontend-techart-guide.md` 中 Day 7 / Day 8 的内容，生成 `practice7.md` 与 `practice8.md` 两份练习文档。
todos:
  - id: map-day7-day8-source
    content: 梳理 practice5/6 模板与 Day7/8 内容映射
    status: completed
  - id: write-practice7-doc
    content: 编写 practice7.md 资产管线教学文档
    status: completed
    dependencies:
      - map-day7-day8-source
  - id: write-practice8-doc
    content: 编写 practice8.md 综合项目教学文档
    status: completed
    dependencies:
      - map-day7-day8-source
  - id: polish-doc-consistency
    content: 统一两份文档结构衔接与验收清单
    status: completed
    dependencies:
      - write-practice7-doc
      - write-practice8-doc
---

## User Requirements

- 在 `d:/lesson_zp/threejs/practice-day1/src/docs` 下新增两份练习文档：`practice7.md`、`practice8.md`。
- 内容分别对应第 7 天“资产管线与加载规范”和第 8 天“方案预研与综合展示”主题。
- 写法要参照现有 `practice5.md`、`practice6.md` 的模板风格：标题清晰、章节完整、讲解式展开、带验证清单与常见问题。
- 内容来源要基于 `d:/lesson_zp/threejs/8-day-frontend-techart-guide.md` 中 Day 7、Day 8 部分，但不能只是摘抄，需要整理成适合当前练习仓库的教学文档。
- 范围仅限文档新增，不涉及页面、路由、组件或运行逻辑修改。

## Product Overview

- 产出两份与现有练习文档连续衔接的中文教程文档。
- 文档呈现效果应与 `practice5.md`、`practice6.md` 保持统一：有明确标题、目标摘要、分节讲解、代码示例、检查清单和扩展练习，阅读体验稳定、完整、可直接用于后续学习或实现。

## Core Features

- `practice7.md`：围绕资产准备、导出规范、压缩与加载流程，形成完整教学链路。
- `practice8.md`：围绕方案比较、综合展示页练习、模块组织与最终验收，形成收束型教程。
- 两份文档之间要有自然承接关系，结尾与下一节提示风格保持一致。

## Tech Stack Selection

- 文档载体：Markdown
- 目标目录：`d:/lesson_zp/threejs/practice-day1/src/docs`
- 已确认模板参考：
- `d:/lesson_zp/threejs/practice-day1/src/docs/practice5.md`
- `d:/lesson_zp/threejs/practice-day1/src/docs/practice6.md`
- 已确认内容来源：
- `d:/lesson_zp/threejs/8-day-frontend-techart-guide.md`

## Implementation Approach

- 采用“现有模板结构复用 + Day 7 / Day 8 内容重写扩展”的方式生成两份新文档，而不是直接复制原始指南。
- `practice7.md` 将围绕 `Blender → glTF → Web` 资产管线展开，补齐项目准备、目录建议、导出清单解读、压缩工具链、前端加载示例、验证清单、排错与扩展练习。
- `practice8.md` 将围绕引擎方案预研与综合项目展开，把方案对比表、综合展示页示例、页面分层、联动逻辑、验收清单与延伸方向整理成与 `practice5.md` / `practice6.md` 一致的教学结构。
- 质量重点不是算法复杂度，而是文档的一致性与可执行性：每个来源章节都要映射到清晰的目标、示例、验证和排错，避免信息缺段、风格跳变或上下文断裂。
- 为避免技术债，严格沿用现有练习文档的组织顺序与语气，不引入全新文档范式；仅在 Day 7 / Day 8 内容需要时扩展表格、检查清单和代码讲解深度。

## Implementation Notes

- 复用 `practice5.md`、`practice6.md` 已验证的写法：标题摘要、理论目标、项目准备、核心示例、概念讲解、运行验证、常见问题、扩展练习、下一步提示。
- Day 7 需要把指南中的导出清单、压缩命令、加载示例转成“为什么这样做”的解释性内容，避免仅罗列命令。
- Day 8 需要把方案对比与综合项目示例转成可落地的练习说明，强调与前 1 到 7 天能力的串联关系。
- 控制影响范围：仅新增两个 Markdown 文件，不触碰现有页面与代码；如需引用现有章节，只做文内说明，不改旧文档。

## Architecture Design

- 现有文档结构提供统一模板。
- 总攻略文档提供 Day 7 / Day 8 的原始知识骨架。
- 新生成的 `practice7.md`、`practice8.md` 作为练习仓库中的连续教程落地文件，分别承接 Day 6，并为后续学习形成闭环。

## Directory Structure

### Directory Structure Summary

本次仅新增两份文档文件，保持 `src/docs` 目录的连续编号与既有风格，不涉及组件或源码目录调整。

`d:/lesson_zp/threejs/practice-day1/src/docs/`

- `practice7.md`  [NEW] 第 7 天练习文档。负责把资产管线主题整理为完整教程，包含理论目标、准备步骤、导出与压缩规范、前端加载示例、验证清单、排错与扩展练习。需与 `practice5.md`、`practice6.md` 保持相同章节层次和教学语气。
- `practice8.md`  [NEW] 第 8 天练习文档。负责把方案预研与综合项目主题整理为收束型教程，包含方案比较、综合项目结构、关键交互说明、验收清单、排错与扩展练习。需形成整个 8 天路线的总结与延续。