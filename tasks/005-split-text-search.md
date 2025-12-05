# 任务 005: 分离 TextSearch 模块

## 优先级
🟠 架构重构 (Architectural)

## 描述
将文本搜索功能 (`highlightTextInContainers`) 从选区恢复核心类中分离出来。

## 问题现状
`SelectionRestore` 和 `SelectionManager` 都包含 `highlightTextInContainers` 方法，这与选区恢复的核心职责无关。

## 执行步骤

### 5.1 创建独立的 TextSearcher 类
- [ ] 创建 `core/src/text-searcher/index.ts`
```typescript
export class TextSearcher {
  constructor(options?: TextSearcherOptions);

  // 在指定容器中搜索并高亮文本
  highlightText(
    text: string | string[],
    containers: string[],
    options?: HighlightOptions
  ): HighlightResult;

  // 清除高亮
  clearHighlights(text?: string, containers?: string[]): void;
}
```

### 5.2 从 SelectionRestore 中移除
- [ ] 移除 `SelectionRestore.highlightTextInContainers` 方法
- [ ] 移除 `SelectionRestore.clearTextHighlights` 方法
- [ ] 移除 `TextHighlightManager` 的内部依赖

### 5.3 从 SelectionManager 中移除
- [ ] 移除 `SelectionManager.highlightTextInContainers` 方法
- [ ] 移除 `SelectionManager.clearTextHighlights` 方法

### 5.4 更新导出
- [ ] 在 `core/src/index.ts` 中导出 `TextSearcher`

## 迁移指南
```typescript
// 旧方式
manager.highlightTextInContainers('keyword', 'highlight', ['#content']);

// 新方式
import { TextSearcher } from '@range-kit/core';
const searcher = new TextSearcher();
searcher.highlightText('keyword', ['#content'], { type: 'highlight' });
```

## 验收标准
- `TextSearcher` 可以独立使用
- `SelectionRestore` 不再包含文本搜索相关方法
- 提供清晰的迁移文档

## 预估工作量
约 3 小时

## 相关文件
- `core/src/selection-restore/index.ts`
- `core/src/selection-manager.ts`
- `core/src/selection-restore/helpers/text-highlight-manager.ts`
- `core/src/text-searcher/index.ts` (新建)
