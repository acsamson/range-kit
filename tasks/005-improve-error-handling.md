# 任务 005: 改进错误处理机制

## 优先级: 中

## 状态: ✅ 已完成

## 背景

当前问题：
- 部分错误被 `catch` 后仅通过 `logger` 打印，上层应用无法感知
- 错误被"吞掉"，调试困难
- 缺少统一的错误类型定义和错误码

## 目标

建立统一的错误处理机制，让上层应用能够正确感知和处理错误。

## 已完成步骤

### 阶段 1: 定义错误事件类型 ✅

在 `types/index.ts` 中添加了 `SDKErrorEvent` 接口：

```typescript
export interface SDKErrorEvent {
  /** 错误码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误发生的操作 */
  operation: 'serialize' | 'restore' | 'highlight' | 'interaction' | 'unknown';
  /** 原始错误对象 */
  originalError?: Error;
  /** 错误上下文 */
  context?: Record<string, unknown>;
  /** 时间戳 */
  timestamp: number;
}
```

在 `RangeSDKEvents` 中添加了 `'error'` 事件：

```typescript
export interface RangeSDKEvents {
  // ... 其他事件
  'error': (event: SDKErrorEvent) => void;
}
```

### 阶段 2: 实现错误发射机制 ✅

在 `SelectionManager` 中添加了 `emitError` 私有方法：

```typescript
private emitError(
  operation: SDKErrorEvent['operation'],
  error: Error,
  context?: Record<string, unknown>
): void {
  const errorEvent: SDKErrorEvent = {
    code: error instanceof RangeKitError ? error.code : 'UNKNOWN_ERROR',
    message: error.message,
    operation,
    originalError: error,
    context: { ...context, ...(error instanceof RangeKitError ? error.context : {}) },
    timestamp: Date.now(),
  };
  this.emit('error', errorEvent);
}
```

### 阶段 3: 改进各方法的错误处理 ✅

| 方法 | 错误处理策略 |
|------|-------------|
| `processSelection` | 发射 `serialize` 错误事件 |
| `restoreSelection` | 发射 `restore` 错误事件 + 抛出异常 |
| `highlightRange` | 发射 `highlight` 错误事件 + 抛出异常 |
| `highlightMultipleRanges` | 批量失败时发射事件（不中断流程） |
| `handleSelectionInteraction` | 发射 `interaction` 错误事件（不中断） |

## 使用示例

```typescript
const manager = new SelectionManager('container');

// 监听错误事件
manager.on('error', (event) => {
  console.error(`[${event.operation}] ${event.code}: ${event.message}`);

  // 可以根据错误码进行不同处理
  if (event.code === 'RESTORE_FAILED') {
    showToast('选区恢复失败，请重新选择');
  }

  // 上报错误监控
  Sentry.captureException(event.originalError, {
    extra: event.context
  });
});

// 也可以使用 try-catch 捕获致命错误
try {
  await manager.restoreSelection(rangeData);
} catch (error) {
  // 错误事件已经发射，这里可以做额外处理
}
```

## 错误处理策略

| 错误类型 | 处理方式 |
|---------|---------|
| 序列化错误 | 发射事件 + 日志（不中断） |
| 恢复错误 | 发射事件 + 抛出异常 |
| 高亮错误 | 发射事件 + 抛出异常 |
| 交互错误 | 发射事件 + 日志（不中断用户操作） |
| 批量操作部分失败 | 发射事件（不中断，返回失败列表） |

## 验收标准

- [x] 添加 `SDKErrorEvent` 类型定义
- [x] 添加 `'error'` 事件到 `RangeSDKEvents`
- [x] 实现 `emitError` 方法
- [x] 改进 `processSelection` 错误处理
- [x] 改进 `restoreSelection` 错误处理
- [x] 改进 `highlightRange` 错误处理
- [x] 改进 `highlightMultipleRanges` 错误处理
- [x] 改进 `handleSelectionInteraction` 错误处理
- [x] 所有 280 个测试通过
