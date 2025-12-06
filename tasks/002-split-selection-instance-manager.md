# 任务 002: 拆分 SelectionInstanceManager

## 优先级: 高

## 状态: ✅ 已完成

## 背景

`SelectionInstanceManager` 当前职责过重，同时负责：
- 生命周期管理 (addSelection/removeSelection)
- 样式管理 (registerType/getStyleForType)
- Range 缓存 (activeRanges)
- 交互检测 (interactionDetector)
- 内容监控 (contentMonitor)

虽然已拆分子模块，但 Manager 仍在协调太多事情，违反单一职责原则。

## 目标

将 `SelectionInstanceManager` 拆分为：
1. `SelectionRegistry` - 只负责选区实例的存取
2. `StyleRegistry` - 负责样式/类型配置管理
3. `SelectionCoordinator` - 负责业务流程协调

## 已完成的重构

### 阶段 1: 创建 SelectionRegistry ✅

```typescript
// manager/selection-registry.ts
export class SelectionRegistry {
  private selections: Map<string, SelectionInstanceImpl> = new Map();
  private activeRanges: Map<string, Range> = new Map();
  private selectionHighlights: Map<string, string> = new Map();

  // 选区实例管理
  add(instance: SelectionInstanceImpl): void;
  remove(id: string): SelectionInstanceImpl | undefined;
  get(id: string): SelectionInstanceImpl | undefined;
  has(id: string): boolean;
  getAll(): SelectionInstanceImpl[];
  getAllData(): SerializedSelection[];

  // Range 管理
  registerRange(selectionId: string, range: Range): boolean;
  unregisterRange(selectionId: string): boolean;
  getRange(selectionId: string): Range | undefined;
  hasRange(selectionId: string): boolean;
  getAllRangeIds(): string[];
  getAllRanges(): Map<string, Range>;
  clearAllRanges(): boolean;

  // 高亮 ID 管理
  setHighlightId(selectionId: string, highlightId: string): void;
  getHighlightId(selectionId: string): string | undefined;
  removeHighlightId(selectionId: string): string | undefined;
  getHighlightMap(): Map<string, string>;

  clear(): void;
}
```

### 阶段 2: 创建 StyleRegistry ✅

```typescript
// manager/style-registry.ts
export class StyleRegistry {
  private registeredTypes: Map<string, SelectionTypeConfig> = new Map();
  private defaultStyle: HighlightStyle;

  constructor(defaultStyle: HighlightStyle);
  initializeTypes(types: SelectionTypeConfig[] | undefined): void;
  registerType(config: SelectionTypeConfig): void;
  getType(type: SelectionType): SelectionTypeConfig | undefined;
  getAllTypes(): SelectionTypeConfig[];
  getStyleForType(type: SelectionType): HighlightStyle;
  hasType(type: SelectionType): boolean;
  getTypeMap(): Map<string, SelectionTypeConfig>;
  get size(): number;
  clear(): void;
}
```

### 阶段 3: 创建 SelectionCoordinator ✅

```typescript
// manager/selection-coordinator.ts
export class SelectionCoordinator {
  constructor(config: CoordinatorConfig);

  // 协调添加选区的完整流程
  addSelection(data: SerializedSelection): SelectionInstance;

  // 协调移除选区的完整流程
  removeSelection(id: string): void;

  // Range 管理（带回调通知）
  registerActiveRange(selectionId: string, range: Range): void;
  unregisterActiveRange(selectionId: string): void;
  clearAllActiveRanges(): void;

  // 高亮管理
  clearSelectionHighlight(id: string): void;

  // 创建临时实例
  createTempInstance(data: SerializedSelection): SelectionInstance;
}
```

### 阶段 4: 重构 SelectionInstanceManager ✅

- [x] `SelectionInstanceManager` 现在使用组合模式
- [x] 委托给 `SelectionRegistry` 处理数据存储
- [x] 委托给 `StyleRegistry` 处理样式配置
- [x] 委托给 `SelectionCoordinator` 处理业务流程
- [x] 更新 `manager/index.ts` 导出新类
- [x] 所有 280 个测试通过

## 架构设计

```
SelectionInstanceManager (门面)
├── SelectionRegistry (数据存储)
│   ├── selections: Map<id, SelectionInstanceImpl>
│   ├── activeRanges: Map<id, Range>
│   └── selectionHighlights: Map<id, highlightId>
├── StyleRegistry (样式配置)
│   ├── registeredTypes: Map<type, SelectionTypeConfig>
│   └── defaultStyle: HighlightStyle
├── SelectionCoordinator (业务协调)
│   └── 协调 Registry + Monitor + Highlighter
└── 子模块
    ├── RangeCacheManager
    ├── InteractionDetector
    ├── ContentMonitor
    └── SelectionEventHandlers
```

## 预期收益

1. ✅ 每个类职责单一，易于测试
2. ✅ 降低认知负荷
3. ✅ 便于后续扩展

## 验收标准

- [x] SelectionRegistry 只负责数据存取
- [x] StyleRegistry 只负责样式配置
- [x] SelectionCoordinator 只负责流程协调
- [x] 所有现有功能正常
- [x] 测试通过 (280/280)
