# 任务 008: 强制容器 ID 模式

## 优先级
🟠 架构重构 (Architectural)

## 描述
确保所有内部逻辑都强依赖 `containerId` 进行相对定位，避免回退到 `document.body`。

## 问题现状
虽然 `SelectionManager` 构造函数要求传入 `containerId`，但内部逻辑可能在某些情况下回退到全局 DOM 操作。

## 执行步骤

### 8.1 审查容器使用
- [ ] 搜索所有 `document.body` 的使用
```bash
grep -r "document.body" core/src --include="*.ts"
```
- [ ] 搜索所有可能使用全局 DOM 的地方
```bash
grep -r "document.querySelector\|document.getElementById" core/src --include="*.ts"
```

### 8.2 强制容器范围
- [ ] 确保 `SelectionValidator` 严格验证选区在容器内
- [ ] 确保 `SelectionRestorer` 只在指定容器内查找元素
- [ ] 确保 `SelectionHighlighter` 只在指定容器内操作

### 8.3 添加严格模式选项
```typescript
interface SelectionManagerOptions {
  containerId: string;
  strictMode?: boolean; // 默认 true，禁止任何容器外操作
}
```

### 8.4 添加边界检查
- [ ] 在关键操作前添加容器包含检查
```typescript
private ensureInContainer(node: Node): void {
  if (!this.container.contains(node)) {
    throw new OutOfContainerError(this.containerId);
  }
}
```

## 验收标准
- 所有 DOM 操作都限制在指定容器内
- 尝试操作容器外元素时抛出明确错误
- 不存在 `document.body` 的回退逻辑

## 预估工作量
约 2 小时

## 相关文件
- `core/src/selection-manager.ts`
- `core/src/selection-restore/core/selection-validator.ts`
- `core/src/selection-restore/core/selection-restorer.ts`
