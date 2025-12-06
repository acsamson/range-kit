# 任务 001: 修复内部 API 暴露问题

## 问题描述

`SelectionManager` 类暴露了 `getSelectionRestoreInstance()` 方法，允许外部直接访问内部实现，打破了封装原则。

## 当前代码

文件: `packages/core/src/services/selection-manager.ts:614-617`

```typescript
getSelectionRestoreInstance(): SelectionRestore {
  return this.selectionRestore;
}
```

## 解决方案

1. 将 `getSelectionRestoreInstance()` 标记为 `@internal` 并添加废弃警告
2. 检查是否有外部代码依赖此方法
3. 如果有合理使用场景，提供替代的公开 API

## 修改步骤

1. 在方法上添加 `@internal` 和 `@deprecated` JSDoc 注释
2. 添加运行时警告（可选）
3. 更新 index.ts 的导出注释，明确区分公开 API 和内部 API

## 影响范围

- `packages/core/src/services/selection-manager.ts`
- `packages/core/src/index.ts`（导出注释）

## 验证方式

- 构建通过
- 现有测试通过
