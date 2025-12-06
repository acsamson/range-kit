# Core 模块重构任务总览

## 重构目标

简化 `core` 模块设计，提高代码质量和可维护性。

## 任务列表

| 任务 | 标题 | 优先级 | 状态 |
|------|------|--------|------|
| [001](./001-rename-facade-to-services.md) | 将 facade 改名为 services | 中 | ✅ 已完成 |
| [002](./002-split-selection-instance-manager.md) | 拆分 SelectionInstanceManager | 高 | ✅ 已完成 |
| [003](./003-add-manager-facade-tests.md) | 补全 manager/services 测试 | 高 | ✅ 已完成 |
| [004](./004-unify-event-handling.md) | 统一事件处理系统 | 中 | ✅ 已完成 |
| [005](./005-improve-error-handling.md) | 改进错误处理 | 中 | ✅ 已完成 |
| [006](./006-eliminate-any-types.md) | 消除 any 类型 | 中 | 🔄 部分完成 |

## 已完成的改进

### 1. 解耦 DOM 依赖 ✅
- `SelectionManager` 构造函数现在支持 `string | HTMLElement`
- 新增 `ContainerInput` 类型导出
- 兼容 React Ref、Shadow DOM 等场景

### 2. 消除 any 类型（部分）✅
- 修复了 `types/core.ts` 中的 `data?: any` → `data?: unknown`
- 修复了 `types/index.ts` 中的 `contextFingerprint?: any`
- 修复了 `types/api.ts` 中的回调参数类型
- 剩余约 37 处 `any`，主要在调试工具和辅助模块

### 3. 架构评估 ✅
- 确认三层架构 (SelectionManager → SelectionRestore → SelectionInstanceManager) 是合理的 Facade 模式
- `SelectionRestore` 作为内部引擎保留
- `SelectionInstanceManager` 已有良好的子模块拆分（但职责仍可进一步分离）

### 4. manager/facade 测试 ✅
- 新增 74 个测试用例
- manager 模块：cache-manager, interaction-detector, content-monitor, selection-instance-manager
- facade 模块：selection-manager
- 总计 280 个测试全部通过

### 5. 拆分 SelectionInstanceManager ✅
- 创建 `SelectionRegistry` - 纯数据存储（选区实例、Range、高亮ID）
- 创建 `StyleRegistry` - 样式/类型配置管理
- 创建 `SelectionCoordinator` - 业务流程协调
- `SelectionInstanceManager` 现在使用组合模式委托给上述三个类
- 所有 280 个测试通过

### 6. facade 重命名为 services ✅
- 将 `core/src/facade/` 重命名为 `core/src/services/`
- 更新 `index.ts` 中的 5 处导出路径
- 所有 280 个测试通过

### 7. 统一事件处理系统 ✅
- `SelectionManager` 现在使用 `InteractionManager` 处理 selectionchange 事件
- 事件监听从直接 `document.addEventListener` 改为委托给 `InteractionManager`
- 清晰的事件层次架构
- 所有 280 个测试通过

### 8. 改进错误处理机制 ✅
- 添加 `SDKErrorEvent` 类型定义和 `'error'` 事件
- 实现 `emitError` 方法统一发射错误事件
- 改进 `restoreSelection`、`highlightRange` 等方法的错误处理
- 错误同时支持事件监听 (`on('error')`) 和 `try-catch` 捕获
- 所有 280 个测试通过

## 推荐执行顺序

1. ~~**003** (补测试) → 为后续重构提供安全网~~ ✅ 已完成
2. ~~**002** (拆分 Manager) → 降低复杂度~~ ✅ 已完成
3. ~~**001** (重命名) → 低风险，可随时做~~ ✅ 已完成
4. ~~**004** (统一事件) → 现在有测试覆盖了~~ ✅ 已完成
5. ~~**005** (错误处理) → 改善用户体验~~ ✅ 已完成
6. **006** (消灭 any) → 持续进行

## 待解决问题汇总

| 问题 | 来源 | 对应任务 |
|------|------|----------|
| facade 目录名不副实 | TODO.md 分析 | 001 |
| SelectionInstanceManager 职责过重 | TODO.md 分析 | 002 |
| manager/facade 测试覆盖为 0 | TODO.md 分析 | 003 |
| 事件监听分散在 5 个位置 | 代码分析 | 004 |
| 错误被 catch 后仅 logger 打印 | 代码分析 | 005 |
| 剩余 37 处 any 类型 | 代码分析 | 006 |
