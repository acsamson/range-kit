# 任务 003: 明确导出结构，区分公开 API 和内部 API

## 问题描述

`core/src/index.ts` 导出了大量 API，但没有明确区分哪些是面向用户的公开 API，哪些是内部实现。用户可能误用内部 API。

## 解决方案

1. 在 `index.ts` 中使用注释块明确分组
2. 为内部导出添加 `@internal` 标记
3. 考虑是否需要减少导出的内部 API

## 修改步骤

1. 重组 `core/src/index.ts`，按以下结构分组：
   - 公开 API（用户应该使用的）
   - 高级 API（有经验的用户可选使用）
   - 内部 API（仅供库内部使用，可能会变更）
   - 类型导出

2. 为每个分组添加清晰的注释说明

## 期望的导出结构

```typescript
// ============================================
// 公开 API - 推荐使用
// ============================================
export { SelectionManager } from './services'

// ============================================
// 核心模块 - 可独立使用
// ============================================
export { RangeLocator, createLocator } from './locator'
export { Highlighter, createHighlighter } from './highlighter'
export { InteractionManager, createInteractionManager } from './interaction'

// ============================================
// 高级 API - 需要了解内部机制
// ============================================
export { SelectionRestore, createSelectionRestore } from './services/selection-restore'

// ============================================
// 内部 API - 可能会变更，不建议直接使用
// @internal
// ============================================
export { SelectionInstanceManager } from './manager'

// ============================================
// 类型导出
// ============================================
export type { ... } from './types'
```

## 影响范围

- `core/src/index.ts`

## 验证方式

- 构建通过
- 导出结构清晰
