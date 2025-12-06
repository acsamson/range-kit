# Core 包架构优化任务

基于代码审查，以下是需要改进的项目：

---

## 任务 1: 重命名 SelectionInstanceManager ✅

**优先级**: 高
**状态**: 已完成

### 问题
`SelectionInstanceManager` 与 `SelectionManager` 名称过于接近，需要写注释解释区别，增加心智负担。

### 方案
将 `SelectionInstanceManager` 重命名为 `SelectionSession`

### 完成内容
- `packages/core/src/manager/selection-instance-manager.ts` → 重命名为 `selection-session.ts`
- 更新类名为 `SelectionSession`
- 保留向后兼容别名 `SelectionInstanceManager`（带 @deprecated 标记）
- 更新所有引用文件（10+ 文件）
- 测试文件同步更新

---

## 任务 2: 清理兼容性导出 ✅

**优先级**: 中
**状态**: 已完成

### 问题
`index.ts` 中存在大量"兼容性导出"，作为 0.x 版本不应背负历史包袱。

### 完成内容
已将以下导出标记为 `@deprecated`：
- `SelectionHighlighter` / `createHighlighter` / `HighlighterOptions`
- `CSSBasedHighlighter`
- `SelectionText` / `TextSearchOptions`

标记格式：`@deprecated 请使用 XXX 替代。将在 1.0 版本移除。`

---

## 任务 3: overlap-detector 位置调整 ✅

**优先级**: 低
**状态**: 无需调整

### 评估结论
经过代码审查，发现当前结构是合理的：

- `common/overlap-detector.ts` — 核心纯函数（无副作用），包含 `detectRangeOverlap` 等核心逻辑
- `services/overlap-detector.ts` — 封装服务层，与 `SelectionRestore` 集成，提供高级 API

这种分层设计符合职责分离原则，无需调整。

---

## 不执行的建议

以下审查建议**不采纳**：

1. **废弃 services 目录** — 当前结构可接受，不需要大改
2. **合并 Registry/Coordinator** — 拆分是合理的，有助于单元测试和职责分离
