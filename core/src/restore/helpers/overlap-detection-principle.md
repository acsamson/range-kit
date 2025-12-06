# 重叠检测算法原理文档

## 概述

Range SDK 中重叠检测算法的工作原理，包括核心算法、边界比较逻辑、重叠类型判断以及常见问题的解决方案。

## 核心算法

### 1. 基础原理

重叠检测基于 DOM Range API 的 `compareBoundaryPoints` 方法，这是最准确和标准的方法，适用于所有情况（同一文本节点或跨节点）。

### 2. 重叠判断条件

两个 Range 存在重叠的充分必要条件是：
```
existing.start < current.end && existing.end > current.start
```

用 `compareBoundaryPoints` 表示为：
```typescript
const hasOverlap = startToEnd > 0 && endToStart < 0;
```

其中：
- `startToEnd = currentRange.compareBoundaryPoints(Range.START_TO_END, existingRange)`
- `endToStart = currentRange.compareBoundaryPoints(Range.END_TO_START, existingRange)`

## 边界比较详解

### compareBoundaryPoints 方法说明

`Range.compareBoundaryPoints(how, sourceRange)` 方法的返回值：
- `-1`: 当前 Range 的边界点在 sourceRange 的边界点之前
- `0`: 两个边界点相等
- `1`: 当前 Range 的边界点在 sourceRange 的边界点之后

### 四种比较类型

1. **START_TO_END**: 比较 `existingRange.start` 与 `currentRange.end`
2. **END_TO_START**: 比较 `existingRange.end` 与 `currentRange.start`
3. **START_TO_START**: 比较 `existingRange.start` 与 `currentRange.start`
4. **END_TO_END**: 比较 `existingRange.end` 与 `currentRange.end`

### 重叠条件分析

```typescript
// startToEnd > 0 表示 existing.start < current.end
// endToStart < 0 表示 existing.end > current.start
const hasOverlap = startToEnd > 0 && endToStart < 0;
```

## 重叠类型分类

### 1. NO_OVERLAP (无重叠)
```
existing: [----]
current:         [----]
```
条件: `startToEnd <= 0 || endToStart >= 0`

### 2. EXISTING_CONTAINS_CURRENT (已存在选区包含当前选区)
```
existing: [----------]
current:    [----]
```
条件: `startToStart >= 0 && endToEnd <= 0`

### 3. CURRENT_CONTAINS_EXISTING (当前选区包含已存在选区)
```
existing:   [----]
current:  [----------]
```
条件: `startToStart <= 0 && endToEnd >= 0`

### 4. PARTIAL_OVERLAP (部分重叠)
```
existing: [------]
current:     [------]
```
条件: 有重叠但不满足包含关系

## 实现示例

### 核心检测函数

```typescript
export function detectRangeOverlap(currentRange: Range, existingRange: Range): CoreOverlapResult {
  // 边界比较
  const startToEnd = currentRange.compareBoundaryPoints(Range.START_TO_END, existingRange);
  const endToStart = currentRange.compareBoundaryPoints(Range.END_TO_START, existingRange);
  const startToStart = currentRange.compareBoundaryPoints(Range.START_TO_START, existingRange);
  const endToEnd = currentRange.compareBoundaryPoints(Range.END_TO_END, existingRange);

  // 重叠判断
  const hasOverlap = startToEnd > 0 && endToStart < 0;

  if (!hasOverlap) {
    return {
      hasOverlap: false,
      overlapType: 'NO_OVERLAP',
      boundaryComparisons: { startToEnd, endToStart, startToStart, endToEnd }
    };
  }

  // 确定重叠类型
  let overlapType: OverlapType;
  if (startToStart >= 0 && endToEnd <= 0) {
    overlapType = 'EXISTING_CONTAINS_CURRENT';
  } else if (startToStart <= 0 && endToEnd >= 0) {
    overlapType = 'CURRENT_CONTAINS_EXISTING';
  } else {
    overlapType = 'PARTIAL_OVERLAP';
  }

  return {
    hasOverlap: true,
    overlapType,
    boundaryComparisons: { startToEnd, endToStart, startToStart, endToEnd }
  };
}
```

## 常见问题与解决方案

### 1. 边界比较逻辑错误

**错误示例**:
```typescript
// 错误的重叠条件
const hasOverlap = startToEnd < 0 && endToStart > 0;
```

**正确做法**:
```typescript
// 正确的重叠条件
const hasOverlap = startToEnd > 0 && endToStart < 0;
```

### 2. 字段映射错误

在调试信息中，确保字段映射正确：
```typescript
// 正确的字段映射
{
  aEndVsBStart: boundaryComparisons.endToStart,  // existing.end vs current.start
  aStartVsBEnd: boundaryComparisons.startToEnd   // existing.start vs current.end
}
```

### 3. 跨节点重叠检测

使用 `compareBoundaryPoints` 方法可以正确处理跨节点的重叠检测，无需特殊处理。

## 测试用例

### 基本重叠测试

```typescript
// 测试数据
const currentSelection = {
  text: "，益州疲弊，此诚危急存亡之秋",
  startOffset: 22,
  endOffset: 36
};

const existingSelection = {
  text: "弊，此诚危急存",
  startOffset: 26,
  endOffset: 33
};

// 预期结果: hasOverlap = true, overlapType = 'EXISTING_CONTAINS_CURRENT'
```

### 边界情况测试

1. **相邻但不重叠**:
   ```
   existing: [----]
   current:        [----]
   ```
   预期: `NO_OVERLAP`

2. **边界相接**:
   ```
   existing: [----]
   current:       [----]
   ```
   预期: `NO_OVERLAP`

3. **完全相同**:
   ```
   existing: [----]
   current:  [----]
   ```
   预期: `EXISTING_CONTAINS_CURRENT` 或 `CURRENT_CONTAINS_EXISTING`

## 性能优化

### 1. 早期退出

在检测到无重叠时立即返回，避免不必要的计算：

```typescript
const hasOverlap = startToEnd > 0 && endToStart < 0;
if (!hasOverlap) {
  return { hasOverlap: false, overlapType: 'NO_OVERLAP', ... };
}
```

### 2. 批量检测优化

对于大量选区的重叠检测，可以考虑使用空间索引（如 R-tree）来优化性能。