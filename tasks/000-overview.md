# range-kit 架构改进任务总览

## 背景

根据代码评审意见，识别出以下需要改进的问题：

| 问题 | 严重程度 | 任务编号 | 状态 |
|------|----------|----------|------|
| getSelectionRestoreInstance 暴露内部实现 | 中等 | 001 | ✅ 已完成 |
| overlap-detector 类型定义重复 | 轻微 | 002 | ✅ 已完成 |
| 导出结构不清晰 | 轻微 | 003 | ✅ 已完成 |

## 任务列表

1. [001-fix-internal-api-exposure.md](./001-fix-internal-api-exposure.md) - 修复内部 API 暴露问题
2. [002-move-overlap-detector.md](./002-move-overlap-detector.md) - 整理 overlap-detector 类型定义
3. [003-clarify-export-structure.md](./003-clarify-export-structure.md) - 明确导出结构

## 已完成的改进

### 任务 001: 修复内部 API 暴露

**修改文件：** `packages/core/src/services/selection-manager.ts`

- 为 `getSelectionRestoreInstance()` 添加 `@internal` 和 `@deprecated` JSDoc 注释
- 在开发环境下输出警告信息，提示用户不应直接使用此方法
- 为 `getContainerSelectorString()` 添加 `@internal` 标记

### 任务 002: 整理 overlap-detector 类型定义

**修改文件：**
- `packages/core/src/common/index.ts`
- `packages/core/src/common/overlap-detector.ts`

**改进内容：**
- 移除 `common/overlap-detector.ts` 中重复的 `OverlappedRange` 接口定义
- 统一从 `types/core.ts` 导入和导出 `OverlappedRange` 类型
- 在 `common/index.ts` 添加清晰的注释，说明 overlap-detector 的设计意图

### 任务 003: 明确导出结构

**修改文件：** `packages/core/src/index.ts`

**改进内容：**
- 重新组织导出分组，明确区分：
  - 用户侧 API（推荐使用）
  - 高级 API（需要了解内部机制）
  - 内部 API（可能会变更，不建议直接使用）
- 为 `SelectionManager` 添加 JSDoc 示例
- 为 `SelectionInstanceManager` 添加 `@internal` 标记

## 不采纳的建议

以下评审意见经过分析后认为**不需要修改**：

### 1. "services 和 manager 职责崩塌"

**分析结果：** 职责实际上是清晰的
- `services/SelectionManager` → 用户侧 Facade，提供简洁的 API
- `manager/SelectionInstanceManager` → 内部状态管理，管理选区实例生命周期

两者职责不同，只是命名相似容易混淆。但大规模重命名会破坏向后兼容性，成本大于收益。

### 2. "convert.ts 和 data-converter.ts 重复"

**分析结果：** 职责不同，不是重复
- `common/convert.ts` → 内部格式简化转换
- `services/data-converter.ts` → 用户格式与内部格式的桥接

### 3. "类型系统妥协"

**分析结果：** 事件系统已使用泛型约束，类型安全性良好。emit 中的类型断言是 TypeScript 处理 Map 泛型的固有限制，不是设计问题。

## 验证结果

- 我们修改的文件通过 TypeScript 类型检查
- 原有的构建错误（`highlightSelections` 类型不匹配）与本次修改无关

## 总结

本次改进主要聚焦于：
1. 通过注释和警告减少内部 API 的误用风险
2. 消除类型定义重复
3. 提升代码可读性和可维护性

这些改动都是非破坏性的，保持了向后兼容性。
