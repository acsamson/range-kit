# 任务 006: 消除剩余 any 类型

## 优先级: 中

## 背景

项目 CLAUDE.md 明确要求禁止使用 `any`。

当前状态：
- 已修复核心类型文件中的 `any`：`types/core.ts`、`types/index.ts`、`types/api.ts`
- 剩余约 37 处 `any`，主要在调试工具和辅助模块

## 目标

消除 `core/src/` 下所有 `any` 类型，使用 `unknown` 或泛型替代。

## 具体步骤

### 阶段 1: 扫描现有 any

- [x] 运行 `grep -r ": any" core/src/` 统计
- [ ] 分类：显式 any vs 隐式 any
- [ ] 列出需要修复的文件清单

### 阶段 2: 逐个修复

优先级排序：
1. **高优先级**: Public API 相关的类型
2. **中优先级**: 业务逻辑中的 any
3. **低优先级**: 调试工具和日志模块

修复策略：
- 对于事件回调，使用泛型或 `unknown` + 类型守卫
- 对于第三方库兼容，添加 `eslint-disable` 注释并说明理由

### 阶段 3: 强化类型检查

- [ ] 确保 `tsconfig.json` 中 `strict: true`
- [ ] 添加 `noImplicitAny: true`（如未开启）
- [ ] CI 中增加类型检查步骤

## 已完成

- [x] `types/core.ts`: `data?: any` → `data?: unknown`
- [x] `types/index.ts`: `contextFingerprint?: any` → `Record<string, unknown>`
- [x] `types/api.ts`: 回调参数类型修复

## 验收标准

- [ ] `grep ": any" core/src/` 输出为空（或仅有带 eslint-disable 的注释）
- [ ] TypeScript 编译无错误
- [ ] 公开 API 类型完整、可推导
