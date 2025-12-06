# 任务 001: 将 facade 目录重命名为 services

## 优先级: 中

## 状态: ✅ 已完成

## 背景

当前 `facade` 目录名不副实：
- 经典 Facade 模式应该只有一个简单的入口类
- 实际包含了 api/factories/helpers/wrappers 等子目录
- 更像是一个**应用服务层** (Application Service Layer)

## 目标

将 `core/src/facade` 重命名为 `core/src/services`，更准确地反映其职责。

## 已完成步骤

### 阶段 1: 重命名目录 ✅
- [x] 将 `facade/` 重命名为 `services/`

### 阶段 2: 更新导出 ✅
- [x] 更新 `index.ts` 中的导出路径
  - `./facade` → `./services`
  - `./facade/selection-restore` → `./services/selection-restore`
  - `./facade/helpers/text-highlight-manager` → `./services/helpers/text-highlight-manager`
  - `./facade/wrappers` → `./services/wrappers`
- [x] 更新注释

### 阶段 3: 验证 ✅
- [x] 所有 280 个测试通过

## 影响范围

- `core/src/facade/` → `core/src/services/`
- `core/src/index.ts` 中 5 处 import 路径更新
- 测试路径自动变更为 `src/services/__test__/`

## 验收标准

- [x] 目录重命名完成
- [x] 编译通过
- [x] 测试通过 (280/280)
