# 任务 001: 更新测试文件移除全局变量依赖

## 优先级
高

## 状态
待开始

## 问题描述
虽然核心恢复代码已经改为返回 `{ success: boolean; range?: Range }` 类型，不再使用 `window.__lastRestoredRange`，但测试文件中仍存在大量对该全局变量的断言。

## 涉及文件
- `src/selection-restore/__test__/layer/layer1-id-anchors.test.ts` (~80处引用)
- `src/selection-restore/__test__/layer/layer2-original-paths.test.ts` (~50处引用)
- `src/selection-restore/__test__/layer/layer3-multiple-anchors.test.ts` (~5处引用)
- `src/selection-restore/__test__/layer/layer4-structural-fingerprint.test.ts` (待确认)
- `src/selection-restore/__test__/algorithm-layers/algorithm-layers.test.ts` (~4处引用)

## 改造方案
1. 将 `expect(window.__lastRestoredRange).toBeDefined()` 改为检查返回结果的 `range` 属性
2. 将 `window.__lastRestoredRange.toString()` 改为 `result.range?.toString()`
3. 移除 `beforeEach`/`afterEach` 中对 `window.__lastRestoredRange` 的 delete 操作
4. 更新相关的类型声明

## 示例改造
```typescript
// 改造前
const result = restoreByIdAnchors(data, config);
expect(result.success).toBe(true);
expect(window.__lastRestoredRange).toBeDefined();
if (window.__lastRestoredRange) {
  const rangeText = window.__lastRestoredRange.toString();
  expect(rangeText).toBe('测试文本');
}

// 改造后
const result = restoreByIdAnchors(data, config);
expect(result.success).toBe(true);
expect(result.range).toBeDefined();
if (result.range) {
  const rangeText = result.range.toString();
  expect(rangeText).toBe('测试文本');
}
```

## 验收标准
- [ ] 所有测试文件中不再引用 `window.__lastRestoredRange`
- [ ] 所有测试用例正常通过
- [ ] 移除 `global.d.ts` 中的 `__lastRestoredRange` 类型声明（如果有）
