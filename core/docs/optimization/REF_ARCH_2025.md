# 🚀 RangeKit Core 重构蓝图 (Refactoring Blueprint 2025)

> 本文档旨在将 `range-kit/core` 从一个“试图做所有事的框架”转变为一个“精简、高性能的底层工具库”。

## 1. 核心设计哲学 (Core Philosophy)

*   **Pure Logic over State**: 核心库只负责计算（Selector <-> Range），不持有业务状态。
*   **Composition over Inheritance**: 废除庞大的 God Object，改为功能模块组合。
*   **Explicit over Implicit**: 错误显式抛出，日志显式配置，依赖显式注入。

## 2. 架构拆解方案 (Architecture Decomposition)

我们将打散目前的 `SelectionRestore` 上帝对象，重组为三个独立的、松耦合的模块。

### 2.1 模块划分

| 模块名 (新) | 职责 (Responsibility) | 对应旧代码 | 依赖关系 |
| :--- | :--- | :--- | :--- |
| **`@core/locator`** | **定位器**。负责 Range 和 JSON (Selector) 之间的相互转换。纯计算，无副作用，不操作 DOM 样式。 | `serializer`, `restorer` | 无依赖 |
| **`@core/highlighter`** | **渲染器**。负责在 DOM 上绘制高亮、管理 CSS 类名。只接收 Range，不关心它是怎么算出来的。 | `highlighter` | 依赖 DOM |
| **`@core/interaction`** | **交互层**。负责监听 SelectionChange, Click, Hover 等事件，并归一化为 SDK 事件。 | `manager`, `events` | 依赖 DOM |

### 2.2 移除与清理
*   🗑️ **删除 `Storage` 模块**: 彻底移除。数据持久化完全交给应用层（Vue/React Store 或 IndexDB）。
*   🗑️ **删除外层 `SelectionManager`**: 现在的外层代理纯属多余。
*   🗑️ **重命名内层 `SelectionManager`**: 改为 `SelectionRegistry`，仅用于内部追踪高亮元素的引用（如果 Highlighter 需要的话）。

## 3. API 演进对比 (API Evolution)

### 🔴 Before (现状)
*隐式状态、混合职责、错误吞没*

```typescript
// 这是一个黑盒，你不知道它内部存了什么
const manager = new SelectionManager('container');

// 错误被吞没，返回 null
// 数据被内部存储，外部无法控制
await manager.highlightSelection(); 

// 甚至还管搜索？
manager.highlightTextInContainers('foo'); 
```

### 🟢 After (优化后)
*函数式、显式流程、组合式 API*

```typescript
import { RangeLocator, Highlighter, Interaction } from '@range-kit/core';

// 1. Locator: 只负责计算，绝对纯粹
const locator = new RangeLocator({ rootId: 'article-content' });

// 序列化
const selectionJson = locator.serialize(window.getSelection());

// 反序列化 (如果出错，显式 catch)
try {
  const range = locator.restore(selectionJson);
  
  // 2. Highlighter: 拿到 range 再决定怎么渲染
  const highlighter = new Highlighter();
  const id = highlighter.draw(range, { style: 'comment-underline' });
  
} catch (err) {
  if (err instanceof ContainerNotFoundError) {
    // 处理容器丢失
  }
}
```

## 4. 代码质量与工程化规范 (Code Quality)

### 4.1 严格的错误处理 (No More Silent Failures)
定义标准错误基类 `RangeKitError`。

```typescript
// 严禁这种写法
try { ... } catch (e) { console.error(e); return null; }

// 必须改为
if (!element) throw new ContainerNotFoundError(id);
if (!isValidRange(range)) throw new InvalidRangeError();
```

### 4.2 日志系统 (Logger Interface)
移除所有硬编码的 `console.log`。提供一个接口，由使用者注入 logger。

```typescript
interface Logger {
  debug(msg: string, ...args: any[]): void;
  warn(msg: string, ...args: any[]): void;
}

// 默认实现：空操作 (No-op)，生产环境 0 噪音
const defaultLogger = { debug: () => {}, warn: () => {} };
```

### 4.3 TypeScript 类型强化
*   严禁使用 `any`，特别是在事件总线中。
*   使用 Zod 或 Valibot 在运行时验证 `SerializedSelection` JSON 数据的完整性，防止脏数据导致崩溃。

## 5. 目录结构重组 (Directory Structure)

```text
core/
├── src/
│   ├── locator/          # 核心算法层 (Range <-> JSON)
│   │   ├── strategies/   # 不同的定位策略 (XPath, Offset, TextMatch)
│   │   └── index.ts
│   ├── highlighter/      # 渲染层 (DOM Painting)
│   │   ├── painters/     # 不同的绘制策略 (Span, Canvas, SVG)
│   │   └── index.ts
│   ├── interaction/      # 事件层
│   ├── common/           # 共享工具 (Error, Types, Logger)
│   └── index.ts          # 统一导出
```
