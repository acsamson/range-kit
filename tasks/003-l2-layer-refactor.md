# 任务 003: L2 层级职责单一化重构

## 优先级
中

## 状态
待开始

## 问题描述
当前 L2 层（DOM路径恢复）在失败后会直接调用文本匹配函数作为降级策略，这实际上是 L3/L4 的工作职责，违反了单一职责原则。

## 当前代码问题
`layer2-original-paths.ts` 第 112 行:
```typescript
// L2 失败后直接调用文本匹配 (这实际上是 L3/L4 的工作)
return attemptSingleElementTextMatching(startElement, text);
```

以及第 158 行:
```typescript
return attemptCrossElementTextMatching(startElement, endElement, expectedText);
```

## 改造方案

### 方案 A: 简单改造（推荐）
L2 专注于 DOM 路径恢复，失败时直接返回 `{ success: false }`，让主流程的级联逻辑来决定下沉到 L3/L4。

```typescript
// 改造后的 restoreByOriginalPaths
export function restoreByOriginalPaths(
  data: SerializedSelection,
  containerConfig?: ContainerConfig
): LayerRestoreResult {
  // ... 路径解析和元素查找逻辑 ...

  // 原始偏移量恢复成功
  if (offsetRestoreSuccess) {
    return { success: true, range };
  }

  // L2 专注于精确路径恢复，不做文本匹配降级
  logWarn('L2', 'L2失败：原始偏移量恢复未成功，下沉到L3/L4');
  return { success: false };
}
```

### 方案 B: 保留降级但标记
保留文本匹配作为降级策略，但在返回结果中标记这是降级匹配，让调用方知道匹配质量。

```typescript
interface LayerRestoreResult {
  success: boolean;
  range?: Range;
  degraded?: boolean;  // 是否为降级匹配
  degradeReason?: string;
}
```

## 涉及文件
- `src/selection-restore/restorer/layers/layer2-original-paths.ts`
- `src/selection-restore/restorer/restorer.ts` (可能需要调整级联逻辑)

## 可能的影响
- 某些原本在 L2 通过文本匹配恢复的场景，会下沉到 L3/L4 处理
- 需要确保 L3/L4 有足够的能力处理这些场景
- 可能会稍微增加恢复时间（需要经过更多层级）

## 验收标准
- [ ] L2 层只负责精确的 DOM 路径恢复
- [ ] 移除或重构 `attemptSingleElementTextMatching` 和 `attemptCrossElementTextMatching`
- [ ] 所有现有测试用例仍然通过（可能需要调整预期的层级）
- [ ] 添加新的测试用例验证级联下沉行为
