# 任务 002: 彻底移除 Storage 模块

## 优先级
🔴 紧急 (Critical)

## 描述
SDK 已采用无状态设计，但 Storage 模块代码仍然存在，需要彻底清理。

## 问题现状
1. `core/src/selection-restore/storage/` 目录仍存在 4 个文件：
   - `index.ts`
   - `storage-factory.ts`
   - `memory-storage.ts`
   - `api-storage.ts`
2. `core/src/selection-restore/index.ts:476` 仍导出 `export * from './storage'`

## 执行步骤

### 2.1 检查依赖
- [ ] 搜索代码库，确认没有其他地方引用 storage 模块
  ```bash
  grep -r "from.*storage" core/src --include="*.ts" | grep -v "__test__"
  ```

### 2.2 移除代码
- [ ] 删除整个 `core/src/selection-restore/storage/` 目录
- [ ] 编辑 `core/src/selection-restore/index.ts`
  - 删除第 476 行: `export * from './storage'`

### 2.3 清理类型
- [ ] 检查 `types/` 中是否有 Storage 相关的类型定义需要移除

## 验收标准
- `storage/` 目录不存在
- `pnpm build` 无错误
- `pnpm test` 通过

## 预估工作量
约 30 分钟

## 相关文件
- `core/src/selection-restore/storage/` (待删除)
- `core/src/selection-restore/index.ts`
