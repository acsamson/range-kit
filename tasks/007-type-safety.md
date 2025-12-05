# 任务 007: 增强类型安全

## 优先级
🟢 代码质量 (Code Quality)

## 描述
移除代码中的 `any` 类型，增强 TypeScript 类型安全。

## 问题现状

### 事件处理中的 any
`selection-manager.ts:357`:
```typescript
eventListeners.forEach(listener => {
  try {
    (listener as any)(...args);  // 类型不安全
  } catch (error) {
    console.error(`Error in ${event} listener:`, error);
  }
});
```

### 其他潜在的 any 使用
需要全面扫描代码库，找出所有 `any` 的使用。

## 执行步骤

### 7.1 扫描 any 使用
- [ ] 运行扫描命令
```bash
grep -r "as any" core/src --include="*.ts" | grep -v "__test__"
grep -r ": any" core/src --include="*.ts" | grep -v "__test__"
```

### 7.2 修复事件系统类型
- [ ] 使用泛型改进事件监听器类型
```typescript
// 修改前
private emit<K extends keyof RangeSDKEvents>(event: K, ...args: Parameters<RangeSDKEvents[K]>) {
  eventListeners.forEach(listener => {
    (listener as any)(...args);
  });
}

// 修改后
private emit<K extends keyof RangeSDKEvents>(event: K, ...args: Parameters<RangeSDKEvents[K]>) {
  const listeners = this.listeners.get(event) as Array<RangeSDKEvents[K]> | undefined;
  listeners?.forEach(listener => {
    listener(...args);
  });
}
```

### 7.3 添加运行时验证（可选）
- [ ] 考虑引入 Zod 进行运行时数据验证
```typescript
import { z } from 'zod';

const SerializedSelectionSchema = z.object({
  id: z.string(),
  text: z.string(),
  pageUrl: z.string(),
  timestamp: z.number(),
  // ...
});

// 在 restore 入口处验证
function restore(data: unknown): RestoreResult {
  const parsed = SerializedSelectionSchema.safeParse(data);
  if (!parsed.success) {
    throw new InvalidDataError(parsed.error);
  }
  // ...
}
```

### 7.4 启用更严格的 TypeScript 配置
- [ ] 检查 `tsconfig.json` 是否启用了 `strict` 模式
- [ ] 考虑启用 `noImplicitAny`

## 验收标准
- `grep -r "as any" core/src` 返回空结果（测试文件除外）
- TypeScript 编译无 `any` 相关警告
- 关键 API 入口有运行时验证

## 预估工作量
约 2.5 小时

## 相关文件
- `core/src/selection-manager.ts`
- `core/src/selection-restore/index.ts`
- `core/tsconfig.json`
