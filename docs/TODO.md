# TODO（range-kit/core 架构与 API 收敛改造）

> 根据对 `packages/core` 的代码审阅整理，供后续重构与对外 API 稳定化使用。

## 1. 收紧根入口公共 API 暴露面（高优先级）

- [ ] 在 `src/index.ts` 收缩导出范围：
  - [ ] 不再从根入口导出 `SelectionSession`，仅在内部或 `internal` 子入口使用。
  - [ ] 不再从根入口直接导出 metrics 相关 API（`enableMetrics` / `getMetricsReport` / `getLayerDistribution` 等），考虑迁移到 `internal/metrics` 子入口。
  - [ ] 避免将纯内部使用的类型从根入口 re-export，只保留对普通用户和高级用户真正需要的最小类型集合（Locator / Highlighter / SelectionManager / SelectionRestore 相关）。

## 2. 提供“无 DOM 依赖”的纯算法子入口（高优先级）

- [ ] 在 core 包中增加纯算法入口（例如 `range-kit/locator` 或 `@range-kit/core/locator-only`）：
  - [ ] 仅导出 Locator 层相关能力：`createLocator`、`serializeRange` / `restoreRange`、序列化数据结构类型等。
  - [ ] 确保该入口不依赖 `window` / `document` / `HTMLElement`，可在 Node / SSR 环境中独立使用。
  - [ ] 更新文档，说明何时使用高阶 `SelectionManager`，何时使用 Locator 纯算法入口。

## 3. SelectionManager 职责瘦身与边界收敛（高优先级）

- [ ] 重新梳理 `SelectionManager` 职责（`src/services/selection-manager.ts`）：
  - [ ] 将其定位为“门面层（facade）”：负责 API 聚合与事件桥接，尽量减少具体业务逻辑（状态管理、重叠检测等）。
  - [ ] 将重叠检测、行为事件组装等能力下沉到 `SelectionSession` / `SelectionCoordinator` 等内部模块，避免职责重复。
  - [ ] 检查并减少对 `activeSelections` 等内部状态的重复管理，避免与 session 层逻辑重叠。

## 4. 注释与日志风格规范化（中高优先级）

- [ ] 规范核心库源码中的注释与日志：
  - [ ] 保留关键技术信息（算法前提、边界条件、复杂度、大致策略），减少长篇“故事化”文案。
  - [ ] 在核心逻辑中减少大量 emoji（🚀📍🛣️⚓🔍❌ 等），将“叙事型说明”迁移到 `docs/*.md` 文档中。
  - [ ] 为 debug/logger 输出设计统一格式（模块前缀、字段、错误码等），便于生产环境日志采集与过滤。

## 5. 命名与对外 API 的兼容策略（中优先级）

- [ ] 清理根入口导出的历史命名包袱（`src/index.ts`）：
  - [ ] 统一对外命名，只保留一套“推荐语义”：例如只暴露 `createHighlighter`，不再额外暴露 `createNewHighlighter` 这类别名。
  - [ ] 整理类似 `CommonSerializationError` 的命名，将其归类到更清晰的命名空间或统一前缀下（如 `errors.SerializationError`）。
  - [ ] 对必须兼容的旧命名，在单独的兼容入口（如 `range-kit/compat`）导出，并在 README 中标记“未来可能移除”。

## 6. package.json 元信息与 tree-shaking 友好性（中优先级）

- [ ] 在 `packages/core/package.json` 补充元信息：
  - [ ] 评估并明确 `sideEffects` 字段（如存在全局副作用就不要标为 `false`）。
  - [ ] 视情况补充 `engines` 字段（最低 Node 版本）以及对浏览器环境的大致支持说明（可放在 README 中）。

## 7. 纯算法测试集补充（中优先级）

- [ ] 为 Locator / Restorer 层增加“DOM 无关”的单元测试：
  - [ ] 构造纯数据输入（序列化结构）与期望输出，对算法逻辑做更细粒度验证。
  - [ ] 将当前依赖 jsdom / DOM 的测试与纯算法测试区分开，降低整体测试栈对浏览器环境的耦合度。
  - [ ] 为关键算法路径（特别是四层级降级策略）补充边界条件与错误分支的纯算法测试。

## 8. 文档与 API 分层说明（中优先级）

- [ ] 在 core README 与整体仓库文档中明确区分：
  - [ ] **推荐入口 API**：`SelectionManager`，面向绝大多数业务场景。
  - [ ] **高级 API**：`SelectionRestore` + Locator / Highlighter / Interaction 组合，用于需要精细控制的场景。
  - [ ] **内部 / 不稳定 API**：`SelectionSession`、metrics 等，仅在 `internal` / `compat` 子入口出现，并标明不承诺兼容性。
  - [ ] 补充“如何在 SSR / Node 环境下只使用 Locator 纯算法入口”的示例代码。
