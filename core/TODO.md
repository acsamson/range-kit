# 🚀 RangeKit Core 优化待办事项 (Refactoring Roadmap)

## 🔴 紧急修复 (Critical Fixes)

### 1. 命名冲突与混淆 (Naming & Confusion)
- [ ] **重命名内部 Manager**: `core/src/selection-restore/manager/selection-instance-manager.ts` 虽然类名已改，但 `index.ts` 中仍保留了 `export { SelectionInstanceManager as SelectionManager }` 的别名导出。
    - **Action**: 彻底移除 `SelectionManager` 别名，强制下游调用者使用 `SelectionInstanceManager` 或新名称 `SelectionRegistry`。
- [ ] **统一入口**: `core/src/index.ts` 导出了外层 `SelectionManager`，又导出了内层 `SelectionRestore`。
    - **Action**: 明确库的唯一入口。如果 `SelectionManager` 是主要 API，则 `SelectionRestore` 应作为内部实现细节隐藏，或重命名为 `SelectionEngine` 以体现其底层属性。

### 2. 彻底移除 Storage 模块 (Remove Dead Code)
- [ ] `core/src/selection-restore/storage` 目录依然存在。
- [ ] `core/src/selection-restore/index.ts` 依然包含 `export * from './storage';`。
    - **Action**: 物理删除 `storage` 目录，并移除所有相关导出语句。

### 3. 移除生产环境日志 (No Console Logs)
- [ ] `core/src/selection-manager.ts` 中依然充斥着 `console.log('[SelectionManager] ...')`。
    - **Action**: 引入轻量级 Logger 接口 (e.g. `ILogger`)，默认实现为 no-op（空操作）。只在用户显式开启 debug 模式时注入 `console`。
    - **Pattern**:
      ```typescript
      // Before
      console.log('...');
      // After
      this.options.logger?.debug('...');
      ```

---

## 🟠 架构重构 (Architectural Improvements)

### 4. 拆解上帝对象 (Deconstruct God Object)
`SelectionRestore` 类依然过于庞大，不仅负责恢复，还负责高亮、搜索、监控。
- [ ] **分离 Highlighter**: 将高亮逻辑完全剥离到 `SelectionHighlighter`，`SelectionRestore` 只负责返回 `Range` 对象。
    - **Goal**: `restore(data) -> Range` (纯计算)，然后 `highlighter.highlight(range)` (纯渲染)。
- [ ] **分离 TextSearch**: 文本搜索 (`highlightTextInContainers`) 不应耦合在选区恢复的核心类中。应作为独立的 `TextSearcher` 工具类提供。

### 5. 强化错误处理 (Robust Error Handling)
- [ ] **停止吞没错误**: `SelectionManager.processSelection` 中的 `try-catch` 依然只是打印错误。
    - **Action**: 移除这些 catch 块，或者将错误包装后通过事件 (`onError`) 发射出去，让应用层感知失败。
- [ ] **定义标准错误**: 创建 `errors.ts`，定义 `RangeNotFoundError`, `ContainerNotFoundError` 等特定错误类。

### 6. 严格模式 (Strict Mode)
- [ ] **强制 Container ID**: `SelectionManager` 的构造函数虽然有了 `containerId`，但仍需确保所有内部逻辑都强依赖此 ID 进行相对定位，而非偶尔回退到 `document.body`。

---

## 🟢 代码质量 (Code Quality)

### 7. 类型安全 (Type Safety)
- [ ] **移除 `any`**: 扫描代码库，特别是事件处理部分 `(listener as any)(...args)`，替换为泛型或具体的函数签名。
- [ ] **Zod 验证**: 引入 Zod 或类似库，在 `restore()` 入口处校验 JSON 数据的结构合法性。

### 8. 测试覆盖 (Testing)
- [ ] **单元测试**: 为拆分后的 `Locator` (Serializer/Restorer) 和 `Highlighter` 编写独立的单元测试。
- [ ] **集成测试**: 模拟真实 DOM 环境（使用 Vitest browser mode 或 Playwright）测试跨标签页的选区恢复。
