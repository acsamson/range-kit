# 任务 004: 分离 Highlighter 模块

## 优先级
🟠 架构重构 (Architectural)

## 描述
将高亮逻辑从 `SelectionRestore` 中完全剥离，使其成为独立的渲染模块。

## 目标架构
```
SelectionRestore.restore(data) → Range  // 纯计算
Highlighter.highlight(range)           // 纯渲染
```

## 问题现状
`SelectionRestore` 类同时负责：
- 序列化/反序列化（应该是核心职责）
- 高亮渲染（应该分离）
- 文本搜索（应该分离）
- 配置管理
- 事件监控

## 执行步骤

### 4.1 重构 restore 方法
- [ ] 将 `restore()` 拆分为两个方法：
  - `restoreRange(data): Range` - 纯恢复，返回 Range
  - `restoreAndHighlight(data): RestoreResult` - 恢复 + 高亮（便捷方法）

### 4.2 创建独立的 Highlighter API
- [ ] 确保 `SelectionHighlighter` 可以独立使用
- [ ] 导出独立的 `createHighlighter()` 工厂函数
- [ ] 文档化 Highlighter 的独立用法

### 4.3 更新 API 设计
```typescript
// 新的使用方式
import { RangeLocator, Highlighter } from '@range-kit/core';

const locator = new RangeLocator({ rootId: 'content' });
const highlighter = new Highlighter();

// 纯恢复
const range = locator.restore(jsonData);

// 按需高亮
highlighter.highlight(range, { style: 'comment' });
```

## 验收标准
- 用户可以只使用 Locator 而不引入 Highlighter
- 高亮逻辑完全独立，不依赖恢复逻辑
- 现有 API 保持向后兼容

## 预估工作量
约 4 小时

## 相关文件
- `core/src/selection-restore/index.ts`
- `core/src/selection-restore/core/selection-highlighter.ts`
- `core/src/selection-restore/api/core-api.ts`
