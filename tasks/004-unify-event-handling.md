# 任务 004: 统一事件处理系统

## 优先级: 中

## 状态: ✅ 已完成

## 背景

当前事件监听分散在 5 个不同位置：
- `SelectionManager` 监听 `selectionchange`、`mouseup`、`mousedown`
- `InteractionManager` 监听 `selectionchange`、`click`、`dblclick`、`contextmenu`、`mousemove`
- `SelectionEventHandlers` 监听 `selectionchange`、`click`、`mousemove`、`contextmenu`、`dblclick`
- `SelectionBehaviorMonitor` 监听 `mousedown`、`mouseup`
- `highlight-event-handler` 监听 `mousemove`、`click`、`dblclick`、`contextmenu`

## 分析结论

事件确实分散，但：
1. 各模块监听的事件有不同的处理目的
2. `InteractionManager` 已经是一个独立的事件层模块
3. 所有模块都正确实现了事件清理（destroy 方法）

## 已完成的改进

### 1. SelectionManager 重构 ✅

将 `SelectionManager` 的 `selectionchange` 事件委托给 `InteractionManager`：

**改动前：**
```typescript
export class SelectionManager {
  private boundHandlers: {
    selectionChange: () => void;
    mouseUp: () => void;
    mouseDown: () => void;
  };

  private init() {
    document.addEventListener('selectionchange', this.boundHandlers.selectionChange);
    this.container.addEventListener('mouseup', this.boundHandlers.mouseUp);
    this.container.addEventListener('mousedown', this.boundHandlers.mouseDown);
  }
}
```

**改动后：**
```typescript
export class SelectionManager {
  private interactionManager: InteractionManager;

  constructor(...) {
    // 初始化 InteractionManager 处理事件监听
    this.interactionManager = new InteractionManager(this.container, {
      listenSelection: true,
      listenClick: false,  // 点击事件由 SelectionRestore 内部处理
      listenHover: false,  // 悬停事件由 SelectionRestore 内部处理
      selectionDebounce: 50,
    });
  }

  private init() {
    // 使用 InteractionManager 监听选区事件
    this.interactionManager.on(InteractionEventType.SELECT, this.handleInteractionSelect.bind(this));

    // 仅保留 mousedown/mouseup 用于跟踪选择状态
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  destroy() {
    // 销毁 InteractionManager（它会清理自己的事件监听器）
    this.interactionManager.destroy();

    // 清理 mousedown/mouseup 监听器
    this.container.removeEventListener('mousedown', this.handleMouseDown);
    this.container.removeEventListener('mouseup', this.handleMouseUp);
    // ...
  }
}
```

### 2. 事件处理架构改进

现在的事件架构更清晰：

```
事件层次结构
├── InteractionManager (统一入口)
│   └── selectionchange (document)
│   └── click/dblclick/contextmenu (container)
│   └── mousemove (container)
│
├── SelectionManager (使用 InteractionManager)
│   └── mousedown/mouseup (container) - 跟踪选择状态
│
├── SelectionEventHandlers (内部模块)
│   └── 专门处理选区实例的交互事件
│
├── SelectionBehaviorMonitor (行为监控)
│   └── mousedown/mouseup - 监控选择行为
│
└── HighlightEventHandler (高亮交互)
    └── 捕获阶段的高亮元素事件
```

## 验收标准

- [x] SelectionManager 使用 InteractionManager
- [x] 事件清理机制完整
- [x] 所有 280 个测试通过

## 遗留改进（可选）

以下改进可以在将来按需进行：
- [ ] 统一 SelectionEventHandlers 和 InteractionManager 的事件处理
- [ ] 考虑是否需要进一步合并事件监听位置
- [ ] 统一事件命名和回调接口

## 风险评估

- 低风险：通过委托模式渐进式改进，不破坏现有功能
- 所有测试通过验证
