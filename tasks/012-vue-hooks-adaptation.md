# 任务 012: Vue Hooks 适配改造

## 优先级
🟠 架构重构 (Architectural)

## 描述
Core 包重构后，Vue hooks 需要同步适配新的 API 结构。

## 依赖
- 必须在 009（三层架构重构）完成后执行
- 必须在 011（Core 单测通过）确认后执行

## 当前 Vue Hooks 结构

```
vue/src/hooks/
├── index.ts                          # 统一导出
├── common/                           # 通用工具
│   ├── types.ts                      # 交互类型定义
│   └── interaction-handler.ts        # 交互事件处理器
├── use-selection-restore/            # 选区恢复 hook (619行)
│   ├── index.ts
│   ├── types.ts
│   ├── constants.ts
│   └── utils/
├── use-search-highlight/             # 搜索高亮 hook (214行)
│   ├── index.ts
│   ├── types.ts
│   └── constants.ts
└── use-highlight-navigation/         # 高亮导航 hook (373行)
    ├── index.ts
    ├── types.ts
    └── constants.ts
```

## 当前对 Core 的依赖

| Hook | 依赖的 Core API |
|------|----------------|
| `useSelectionRestore` | `SelectionRestore`, `SerializedSelection`, `SelectionTypeConfig`, `SelectionRestoreOptions`, `SelectionBehaviorEvent`, `SelectionInteractionEvent` |
| `useSearchHighlight` | `SelectionRestore.registerSelectionType()`, `highlightTextInContainers()`, `clearTextHighlights()`, `SearchMatchItem`, `SearchMatchFilter` |
| `useHighlightNavigation` | `SelectionRestore.getAllActiveSelectionIds()`, `getActiveRange()` |

## 执行步骤

### 12.1 分析 API 变更影响

根据 009 架构重构后的新 API：

```typescript
// 旧 API
import { SelectionRestore } from '@range-kit/core';
const sdk = new SelectionRestore(options);
sdk.serialize();
sdk.restore(data);
sdk.highlightTextInContainers(...);

// 新 API（预期）
import { RangeLocator, Highlighter, TextSearcher } from '@range-kit/core';
const locator = new RangeLocator(options);
const highlighter = new Highlighter();
const searcher = new TextSearcher();
```

### 12.2 改造 useSelectionRestore

**文件**: `vue/src/hooks/use-selection-restore/index.ts`

- [ ] 更新导入语句
```typescript
// Before
import { SelectionRestore, ... } from '@life2code/range-kit-core';

// After
import {
  RangeLocator,
  Highlighter,
  InteractionManager,
  // 保留类型导入
  SerializedSelection,
  SelectionTypeConfig,
  ...
} from '@life2code/range-kit-core';
```

- [ ] 重构 SDK 实例管理
```typescript
// Before
const sdk = new SelectionRestore(options);

// After
const locator = new RangeLocator({ rootId: options.rootNodeId });
const highlighter = new Highlighter(options.highlightStyle);
const interaction = new InteractionManager(container);
```

- [ ] 适配序列化/恢复调用
```typescript
// Before
const json = await sdk.serialize();
const result = await sdk.restore(json);

// After
const json = locator.serialize(selection);
const range = locator.restore(json);
highlighter.draw(range, style);
```

- [ ] 更新事件监听
```typescript
// Before
options.onSelectionBehavior = (event) => { ... };

// After
interaction.on('select', (event) => { ... });
interaction.on('click', (event) => { ... });
```

### 12.3 改造 useSearchHighlight

**文件**: `vue/src/hooks/use-search-highlight/index.ts`

- [ ] 替换 SDK 依赖为 TextSearcher
```typescript
// Before
sdk.highlightTextInContainers(keyword, type, containers, options);
sdk.clearTextHighlights(keyword, containers);

// After
const searcher = new TextSearcher();
searcher.highlightText(keyword, containers, { type, ...options });
searcher.clearHighlights(keyword, containers);
```

- [ ] 更新类型引用
- [ ] 更新选项接口

### 12.4 改造 useHighlightNavigation

**文件**: `vue/src/hooks/use-highlight-navigation/index.ts`

- [ ] 适配新的 Highlighter API
```typescript
// Before
sdk.getAllActiveSelectionIds();
sdk.getActiveRange(id);

// After
highlighter.getAllHighlightIds();
highlighter.getRange(id);
```

### 12.5 更新通用模块

**文件**: `vue/src/hooks/common/`

- [ ] 更新 `types.ts` 中的类型引用
- [ ] 更新 `interaction-handler.ts` 适配新的事件类型

### 12.6 更新导出和类型

**文件**: `vue/src/hooks/index.ts`

- [ ] 确保所有 hook 正确导出
- [ ] 更新 re-export 的 core 类型

### 12.7 编写/更新 Vue Hooks 测试

- [ ] `use-selection-restore.test.ts`
- [ ] `use-search-highlight.test.ts`
- [ ] `use-highlight-navigation.test.ts`

## 迁移指南（给 Vue 用户）

```typescript
// 旧用法
const { saveCurrentSelection, restoreSelections } = useSelectionRestore({
  getSDKInstance: () => sdk,
  // ...
});

// 新用法（如果 API 有变化）
const { saveCurrentSelection, restoreSelections } = useSelectionRestore({
  containerId: 'article-content',
  // SDK 内部管理，不再需要外部传入
  // ...
});
```

## 验收标准
- Vue hooks 能正常工作
- 所有 hook 的测试通过
- TypeScript 编译无错误
- 提供迁移文档（如有 breaking changes）

## 预估工作量
约 1-2 天

## 相关文件
- `vue/src/hooks/**/*`
- `vue/package.json`
- `core/src/index.ts` (导出的 API)
