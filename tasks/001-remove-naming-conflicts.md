# 任务 001: 移除命名冲突与混淆

## 优先级
🔴 紧急 (Critical)

## 描述
清理 `SelectionManager` 命名冲突，统一 API 入口。

## 问题现状
1. `core/src/selection-restore/manager/index.ts` 中保留了 `export { SelectionInstanceManager as SelectionManager }` 别名
2. `core/src/selection-restore/index.ts:473` 同样导出了这个别名
3. `core/src/index.ts` 导出外层 `SelectionManager`，又导出内层 `SelectionRestore`，造成 API 入口混乱

## 执行步骤

### 1.1 移除内层 SelectionManager 别名
- [ ] 编辑 `core/src/selection-restore/manager/index.ts`
  - 删除第 11 行: `export { SelectionInstanceManager as SelectionManager }`
- [ ] 编辑 `core/src/selection-restore/index.ts`
  - 删除第 473 行: `export { SelectionInstanceManager as SelectionManager }`

### 1.2 统一主入口
- [ ] 编辑 `core/src/index.ts`
  - 明确 `SelectionManager` 为唯一的用户侧 API
  - `SelectionRestore` 作为内部实现，考虑重命名为 `SelectionEngine`
  - 只导出必要的类型，隐藏内部实现细节

### 1.3 更新文档
- [ ] 更新 README，说明推荐的 API 使用方式

## 验收标准
- 运行 `pnpm build` 无错误
- 下游代码只需使用 `SelectionManager` 一个入口
- 不存在 `SelectionManager` 的重复导出

## 预估工作量
约 1 小时

## 相关文件
- `core/src/selection-restore/manager/index.ts`
- `core/src/selection-restore/index.ts`
- `core/src/index.ts`
