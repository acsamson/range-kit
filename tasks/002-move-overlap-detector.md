# 任务 002: 将 overlap-detector 从 common 移到正确位置

## 问题描述

`common/overlap-detector.ts` 包含业务逻辑（选区重叠检测），不符合 common 目录的定位（应只存放纯工具函数和基础设施代码）。

## 当前结构

```
common/
├── convert.ts           # ✓ 纯工具函数
├── logger.ts            # ✓ 基础设施
├── errors.ts            # ✓ 基础设施
├── types.ts             # ✓ 共享类型
├── overlap-detector.ts  # ✗ 业务逻辑，不应在此
└── debug/               # ✓ 调试系统
```

## 解决方案

1. 将 `overlap-detector.ts` 移动到 `services/` 目录
2. 更新所有导入路径
3. 更新 `common/index.ts` 的导出

## 修改步骤

1. 移动文件: `common/overlap-detector.ts` → `services/overlap-detector.ts`
2. 更新 `common/index.ts`，移除 overlap-detector 相关导出
3. 更新 `services/index.ts`，添加 overlap-detector 导出
4. 搜索并更新所有引用该模块的文件

## 影响范围

- `packages/core/src/common/overlap-detector.ts` → 移动
- `packages/core/src/common/index.ts` → 移除导出
- `packages/core/src/services/index.ts` → 添加导出
- 所有引用 `common/overlap-detector` 的文件

## 验证方式

- 构建通过
- 现有测试通过
