# Core 包优化任务清单

## 优先级 P0 - 高优先级

### 1. 拆分主入口文件 (index.ts) ✅
- [x] 将 `initializeSelectionBehaviorListeners` 方法抽取为独立的 `SelectionBehaviorMonitor` 类
- [x] 将选区行为监听相关逻辑移至 `helpers/selection-behavior-monitor.ts`
- [x] 简化主类，保持单一职责

### 2. 删除注释掉的代码块 ✅
- [x] 清理 `index.ts` 中被注释的重复检查逻辑
- [x] 清理 `css-highlighter.ts` 中废弃的测试代码注释
- [x] 清理 `constants/index.ts` 中的废弃样式注释

### 3. 统一错误处理策略 (跳过)
- [ ] 创建 `utils/error-handler.ts` 统一错误处理
- [ ] 定义标准错误类型和处理流程
- [ ] 统一 try-catch 的返回值策略
> 注：当前错误处理模式已经较为统一，暂不需要大规模重构

## 优先级 P1 - 中优先级

### 4. 抽取魔法数字为常量 ✅
- [x] `MAX_SELECTIONS_TO_CHECK = 10` 移至 `constants/index.ts`
- [x] `SCROLL_MARGIN = 100` 滚动相关常量已抽取
- [x] `SELECTION_BEHAVIOR_DEBOUNCE_MS = 10` 已抽取

### 5. 精简调试日志 ✅
- [x] 添加日志级别控制机制 (`setMinLevel`/`getMinLevel`)
- [x] 日志级别优先级：DEBUG < INFO/SUCCESS < WARN < ERROR
- [x] 生产环境已有空实现，自动静默

### 6. 代码简化 ✅
- [x] 简化 `getElementIdentifier` 返回逻辑（使用对象展开）
- [ ] 优化 TreeWalker 重复创建问题（待优化）
- [ ] 精简冗余的类型声明（待优化）

## 优先级 P2 - 低优先级

### 7. 补充 JSDoc 文档
- [ ] 为核心恢复方法添加完整 JSDoc
- [ ] 为公开 API 添加使用示例

### 8. 性能优化
- [ ] 缓存 TreeWalker 遍历结果
- [ ] 优化批量操作的性能

---

## 执行状态

| 任务 | 状态 | 完成时间 |
|------|------|----------|
| 1. 拆分主入口文件 | ✅ 已完成 | 2025-12-05 |
| 2. 删除注释代码 | ✅ 已完成 | 2025-12-05 |
| 3. 统一错误处理 | ⏭️ 跳过 | - |
| 4. 抽取魔法数字 | ✅ 已完成 | 2025-12-05 |
| 5. 精简调试日志 | ✅ 已完成 | 2025-12-05 |
| 6. 代码简化 | ✅ 部分完成 | 2025-12-05 |
| 7. 补充 JSDoc | 待开始 | - |
| 8. 性能优化 | 待开始 | - |

---

## 优化成果

### 新增文件
- `helpers/selection-behavior-monitor.ts` - 选区行为监控器（从主类抽取）

### 修改文件
- `index.ts` - 删除 ~180 行代码，使用 SelectionBehaviorMonitor
- `constants/index.ts` - 新增常量定义，删除废弃注释
- `helpers/overlap-detector.ts` - 使用常量替代魔法数字
- `highlighter/css-highlighter.ts` - 使用常量，删除废弃注释
- `serializer/serializer.ts` - 简化 getElementIdentifier 方法
- `debug/logger.ts` - 新增日志级别控制功能

### 代码体积变化
- 优化前：~361 KB (CJS)
- 优化后：~360 KB (CJS)
- 减少约 1 KB（约 0.3%）
