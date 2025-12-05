# 任务 006: 强化错误处理

## 优先级
🟠 架构重构 (Architectural)

## 描述
停止吞没错误，定义标准错误类，让应用层能够感知和处理失败。

## 问题现状

### 错误被吞没
`selection-manager.ts:181-183`:
```typescript
} catch (error) {
  console.error('处理选区时出错:', error);
  // 错误被吞没，调用者无法感知
}
```

### 缺乏标准错误类型
当前只有基础的错误类，缺少细粒度的错误分类。

## 执行步骤

### 6.1 定义标准错误基类
- [ ] 创建/更新 `core/src/common/errors.ts`
```typescript
export class RangeKitError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'RangeKitError';
    this.code = code;
    this.context = context;
  }
}

// 具体错误类型
export class ContainerNotFoundError extends RangeKitError {
  constructor(containerId: string) {
    super(`容器未找到: ${containerId}`, 'CONTAINER_NOT_FOUND', { containerId });
  }
}

export class InvalidRangeError extends RangeKitError {
  constructor(reason: string) {
    super(`无效的选区: ${reason}`, 'INVALID_RANGE', { reason });
  }
}

export class RestoreFailedError extends RangeKitError {
  constructor(reason: string, layer?: number) {
    super(`选区恢复失败: ${reason}`, 'RESTORE_FAILED', { reason, layer });
  }
}

export class SerializationError extends RangeKitError {
  constructor(reason: string) {
    super(`序列化失败: ${reason}`, 'SERIALIZATION_ERROR', { reason });
  }
}
```

### 6.2 移除错误吞没
- [ ] 审查 `SelectionManager` 中所有 try-catch
- [ ] 要么抛出错误，要么通过事件发射
```typescript
// 修改前
catch (error) {
  console.error('处理选区时出错:', error);
}

// 修改后（方案 A：抛出）
catch (error) {
  throw new RangeKitError('处理选区失败', 'PROCESS_SELECTION_ERROR', { originalError: error });
}

// 修改后（方案 B：事件发射）
catch (error) {
  this.emit('error', new RangeKitError('处理选区失败', 'PROCESS_SELECTION_ERROR'));
}
```

### 6.3 添加 onError 回调
- [ ] 在选项中添加 `onError?: (error: RangeKitError) => void`
- [ ] 让用户可以订阅错误事件

### 6.4 更新类型定义
- [ ] 在 `RangeSDKEvents` 中添加 `error` 事件类型

## 验收标准
- 不存在 `catch (e) { console.error(e) }` 模式
- 所有错误都有明确的类型和错误码
- 用户可以通过 `on('error', ...)` 或 `onError` 回调处理错误

## 预估工作量
约 2 小时

## 相关文件
- `core/src/selection-manager.ts`
- `core/src/types/index.ts`
- `core/src/common/errors.ts` (新建或更新)
