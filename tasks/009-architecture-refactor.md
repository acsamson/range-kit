# 任务 009: 架构重构 - 三层模块化

## 优先级
🟠 架构重构 (Architectural)

## 描述
按照 `REF_ARCH_2025.md` 蓝图，将 SDK 拆分为三个独立的松耦合模块。

## 目标架构

```
core/
├── src/
│   ├── locator/          # 核心算法层 (Range <-> JSON)
│   │   ├── strategies/   # 定位策略 (XPath, Offset, TextMatch)
│   │   └── index.ts
│   ├── highlighter/      # 渲染层 (DOM Painting)
│   │   ├── painters/     # 绘制策略 (Span, CSS, SVG)
│   │   └── index.ts
│   ├── interaction/      # 事件层
│   │   └── index.ts
│   ├── common/           # 共享工具 (Error, Types, Logger)
│   └── index.ts          # 统一导出
```

## 模块职责

| 模块 | 职责 | 特性 |
|-----|------|------|
| `@core/locator` | Range ↔ JSON 转换 | 纯计算，无副作用，不操作 DOM 样式 |
| `@core/highlighter` | DOM 高亮绘制 | 只接收 Range，不关心来源 |
| `@core/interaction` | 事件监听与归一化 | 监听 SelectionChange, Click, Hover |

## 执行步骤

### 9.1 创建 Locator 模块
- [ ] 创建 `core/src/locator/` 目录
- [ ] 迁移 `serializer/` 到 `locator/strategies/`
- [ ] 迁移 `restorer/` 到 `locator/strategies/`
- [ ] 创建统一的 `RangeLocator` 类
```typescript
export class RangeLocator {
  constructor(options: LocatorOptions);
  serialize(selection: Selection): SerializedSelection;
  restore(data: SerializedSelection): Range;
}
```

### 9.2 重构 Highlighter 模块
- [ ] 创建 `core/src/highlighter/` 目录（或重用现有）
- [ ] 确保 Highlighter 完全独立，不依赖 Locator
- [ ] 支持多种绘制策略（CSS、Span、SVG）
```typescript
export class Highlighter {
  constructor(options?: HighlighterOptions);
  draw(range: Range, style?: HighlightStyle): string;
  clear(id?: string): void;
}
```

### 9.3 创建 Interaction 模块
- [ ] 创建 `core/src/interaction/` 目录
- [ ] 迁移事件监听逻辑
- [ ] 归一化为 SDK 事件
```typescript
export class InteractionManager {
  constructor(container: HTMLElement);
  on(event: 'select' | 'click' | 'hover', handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  destroy(): void;
}
```

### 9.4 创建 Common 模块
- [ ] 创建 `core/src/common/` 目录
- [ ] 迁移 `errors.ts`
- [ ] 迁移 `logger.ts`
- [ ] 迁移共享类型

### 9.5 更新入口文件
- [ ] 更新 `core/src/index.ts` 导出新的模块结构
- [ ] 保持向后兼容的别名导出

### 9.6 清理旧代码
- [ ] 删除 `selection-restore/` 中的冗余代码
- [ ] 删除 `selection-manager/` 中的冗余代码

## 新 API 示例

```typescript
import { RangeLocator, Highlighter, InteractionManager } from '@range-kit/core';

// 1. Locator: 纯计算
const locator = new RangeLocator({ rootId: 'article-content' });
const json = locator.serialize(window.getSelection());

// 2. 应用层存储
await myDatabase.save(json);

// 3. 恢复并高亮
const range = locator.restore(json);
const highlighter = new Highlighter();
highlighter.draw(range, { style: 'comment' });

// 4. 交互监听
const interaction = new InteractionManager(container);
interaction.on('click', (event) => {
  console.log('点击了选区:', event.selectionId);
});
```

## 验收标准
- 三个模块可以独立使用
- 模块间无循环依赖
- 现有 API 保持向后兼容
- 所有测试通过

## 预估工作量
约 2-3 天

## 相关文件
- `core/src/` (全部)
- `core/docs/optimization/REF_ARCH_2025.md` (参考)
