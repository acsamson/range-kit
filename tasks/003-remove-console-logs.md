# 任务 003: 移除生产环境日志

## 优先级
🔴 紧急 (Critical)

## 描述
`SelectionManager` 中充斥着硬编码的 `console.log`，需要替换为可配置的 Logger 接口。

## 问题现状
`core/src/selection-manager.ts` 中存在大量 console.log：
- 第 123 行: `console.log('[SelectionManager] 鼠标按下，开始选择')`
- 第 128 行: `console.log('[SelectionManager] 鼠标松开...')`
- 第 134 行: `console.log('[SelectionManager] 没有有效的选区...')`
- 第 139 行: `console.log('[SelectionManager] 延迟后开始处理选区')`
- 第 154 行: `console.log('[SelectionManager] 开始处理拖拽选区')`
- 第 158 行: `console.log('[SelectionManager] 没有有效的拖拽选区')`
- 第 165 行: `console.log('[SelectionManager] 选区无效')`
- 第 169 行: `console.log('[SelectionManager] 选区不在容器内')`
- 第 182 行: `console.error('处理选区时出错:', error)`
- 第 359 行: `console.error(...)`
- 第 380 行: `console.log('🎯 选区点击事件...')`
- 第 391 行: `console.warn(...)`

## 执行步骤

### 3.1 定义 Logger 接口
- [ ] 创建 `core/src/common/logger.ts`
```typescript
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

// 默认实现：空操作（生产环境零噪音）
export const noopLogger: ILogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// 开发环境实现
export const consoleLogger: ILogger = {
  debug: (msg, ...args) => console.debug(`[RangeKit] ${msg}`, ...args),
  info: (msg, ...args) => console.info(`[RangeKit] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[RangeKit] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[RangeKit] ${msg}`, ...args),
};
```

### 3.2 修改 SelectionManager
- [ ] 在构造函数中接受 `logger?: ILogger` 参数
- [ ] 替换所有 `console.log` 为 `this.logger.debug(...)`
- [ ] 替换所有 `console.error` 为 `this.logger.error(...)`
- [ ] 替换所有 `console.warn` 为 `this.logger.warn(...)`

### 3.3 更新选项类型
- [ ] 在 `SelectionManagerOptions` 中添加 `logger?: ILogger`

## 验收标准
- 代码中不存在硬编码的 `console.log/warn/error`
- 默认情况下（生产环境）无日志输出
- 用户可以通过传入 `logger` 选项启用日志

## 预估工作量
约 1.5 小时

## 相关文件
- `core/src/selection-manager.ts`
- `core/src/common/logger.ts` (新建)
- `core/src/types/index.ts`
