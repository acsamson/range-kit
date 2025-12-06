# Core 包命名重构任务

## 状态: ✅ 已完成

---

## 完成的改动

### 1. ✅ 重命名 src/manager → src/session

解决命名歧义问题：
- 原来 `src/manager` 存放的是 `SelectionSession` (内部状态管理)
- `src/services` 存放的是 `SelectionManager` (外部入口)
- 现在 `src/session` 更准确地描述了其职责

**更新的 import 路径**:
- `services/helpers/text-highlight-manager.ts`
- `services/selection-restore.ts`
- `services/api/core-api.ts`
- `services/api/selection-api.ts`
- `services/api/batch-api.ts`
- `services/factories/component-factory.ts`
- `index.ts`

---

### 2. ✅ SelectionRestore 复杂度评估

**结论**: 当前设计**不是 God Class**，是合理的 Facade/Coordinator 模式

**已有的职责分离**:
1. 工厂模式 - `createCoreComponents()` 负责组件创建
2. 助手模块分离:
   - `ConfigManager` - 配置管理
   - `TextHighlightManager` - 文本高亮
   - `SelectionBehaviorMonitor` - 行为监控
3. API 子模块分离:
   - `CoreAPI` - 核心序列化/恢复
   - `BatchAPI` - 批量操作
   - `SelectionAPI` - 选区操作

**当前角色**: 协调器 (Coordinator) + 统一入口 (Facade)

**建议**: 保持现状，但需注意:
- 新功能应优先添加到对应的子模块
- 避免在 SelectionRestore 中直接实现业务逻辑

---

## 验证结果

- ✅ `pnpm tsc --noEmit` - 类型检查通过
- ✅ `pnpm test` - 280 个测试全部通过
- ✅ `pnpm build` - 构建成功
