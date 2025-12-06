# Core 包类型安全重构任务

## 状态: ✅ 已完成

---

## 完成的改动

### 1. ✅ 修复 event-handlers.ts 中不必要的 `as any`

**文件**: `packages/core/src/manager/event-handlers.ts`

移除了 5 处不必要的 `as any`，改为直接使用 `SelectionInstance` 接口：
- L137, L186, L221, L275: `(instance as any).data` → `instance.data`
- L303: `(instance as any).type` → `instance.type`

---

### 2. ✅ 修复 core-api.ts 中的 any 类型定义

**文件**: `packages/core/src/services/api/core-api.ts`

```typescript
// 修改前
getRegisteredType: (type: string) => any;

// 修改后
getRegisteredType: (type: string) => SelectionTypeConfig | undefined;
```

---

### 3. ✅ 修复其他非测试文件中的 `as any`

**restorer.ts**:
- 用正确的 `SerializedSelection` 类型替代 `as any`

**structure-matcher.ts**:
- 将 `elements` 类型从 `NodeListOf<Element>` 改为 `Element[]`，避免类型转换

**candidate-finder.ts** (额外发现):
- 添加 `siblingInfo` 的空值检查

---

### 4. ✅ 删除 deprecated 导出

**文件**: `packages/core/src/index.ts`

删除的导出：
- `SelectionInstanceManager` (deprecated 别名)
- `SelectionHighlighter`, `createHighlighter`, `HighlighterOptions` (旧 wrapper)
- `CSSBasedHighlighter` (旧别名)
- `SelectionText`, `TextSearchOptions` (旧 wrapper)

---

### 5. ⏭️ services/wrappers 目录保留

**结论**: wrappers 目录内部还在被广泛使用，只是对外导出是 deprecated 的。
已从 index.ts 移除对外导出，内部实现保持不变。

---

## 验证结果

- ✅ `pnpm tsc --noEmit` - 类型检查通过
- ✅ `pnpm test` - 280 个测试全部通过
- ✅ `pnpm build` - 构建成功
