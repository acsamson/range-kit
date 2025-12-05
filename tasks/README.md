# RangeKit Core 重构任务列表

> 基于 `docs/optimization/REF_ARCH_2025.md` 架构蓝图和 `TODO.md` 待办事项整理

## 任务概览

| 编号 | 任务 | 优先级 | 预估工时 | 状态 |
|-----|------|--------|---------|------|
| 001 | [移除命名冲突](./001-remove-naming-conflicts.md) | 🔴 紧急 | 1h | ⬜ 待开始 |
| 002 | [移除 Storage 模块](./002-remove-storage-module.md) | 🔴 紧急 | 0.5h | ⬜ 待开始 |
| 003 | [移除 console.log](./003-remove-console-logs.md) | 🔴 紧急 | 1.5h | ⬜ 待开始 |
| 004 | [分离 Highlighter](./004-split-highlighter.md) | 🟠 架构 | 4h | ⬜ 待开始 |
| 005 | [分离 TextSearch](./005-split-text-search.md) | 🟠 架构 | 3h | ⬜ 待开始 |
| 006 | [强化错误处理](./006-robust-error-handling.md) | 🟠 架构 | 2h | ⬜ 待开始 |
| 007 | [增强类型安全](./007-type-safety.md) | 🟢 质量 | 2.5h | ⬜ 待开始 |
| 008 | [强制容器模式](./008-strict-container-mode.md) | 🟠 架构 | 2h | ⬜ 待开始 |
| 009 | [三层架构重构](./009-architecture-refactor.md) | 🟠 架构 | 2-3d | ⬜ 待开始 |
| 010 | [完善测试覆盖](./010-testing.md) | 🟢 质量 | 1-2d | ⬜ 待开始 |
| 011 | [确保 Core 单测通过](./011-ensure-core-tests-pass.md) | 🔴 紧急 | 持续 | ⬜ 持续 |
| 012 | [Vue Hooks 适配改造](./012-vue-hooks-adaptation.md) | 🟠 架构 | 1-2d | ⬜ 待开始 |

## 优先级说明

- 🔴 **紧急 (Critical)**: 影响代码质量和使用体验，应立即修复
- 🟠 **架构 (Architectural)**: 架构层面的改进，中期完成
- 🟢 **质量 (Code Quality)**: 代码质量提升，持续进行

## 推荐执行顺序

### 第一阶段：紧急修复（约 3 小时）
1. 001 - 移除命名冲突
2. 002 - 移除 Storage 模块
3. 003 - 移除 console.log
4. **011 - 运行单测确认无回归** ⚠️

### 第二阶段：架构优化（约 2-3 天）
5. 006 - 强化错误处理
6. 004 - 分离 Highlighter
7. 005 - 分离 TextSearch
8. 008 - 强制容器模式
9. **011 - 运行单测确认无回归** ⚠️

### 第三阶段：全面重构（约 3-5 天）
10. 009 - 三层架构重构
11. 007 - 增强类型安全
12. 010 - 完善测试覆盖
13. **011 - 运行单测确认无回归** ⚠️

### 第四阶段：上游适配（约 1-2 天）
14. **012 - Vue Hooks 适配改造**（依赖 009 完成）

## 依赖关系图

```
001 ─┬─► 011 (测试检查点)
002 ─┤
003 ─┘
      │
      ▼
006 ─┬─► 011 (测试检查点)
004 ─┤
005 ─┤
008 ─┘
      │
      ▼
009 ───► 011 (测试检查点) ───► 012 (Vue Hooks)
007 ─┤
010 ─┘
```

## 参考文档

- [架构蓝图](../core/docs/optimization/REF_ARCH_2025.md)
- [原始 TODO](../core/TODO.md)
