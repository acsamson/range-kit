# 任务 003: 补全 manager/facade 测试

## 优先级: 高

## 状态: ✅ 已完成

## 背景

当前测试覆盖不平衡：
- `locator/__test__/` - 有详细的分层降级测试、边缘场景测试
- `manager/__test__/` - 0 个测试文件
- `facade/__test__/` - 0 个测试文件

这导致业务编排逻辑可能存在回归风险。

## 目标

为 `manager` 和 `facade`(services) 模块补充单元测试，达到与 `locator` 同等的测试覆盖。

## 已完成的测试文件

### manager 模块测试

- [x] `manager/__test__/cache-manager.test.ts` - 12 个测试
- [x] `manager/__test__/interaction-detector.test.ts` - 11 个测试
- [x] `manager/__test__/content-monitor.test.ts` - 13 个测试
- [x] `manager/__test__/selection-instance-manager.test.ts` - 22 个测试

### facade 模块测试

- [x] `facade/__test__/selection-manager.test.ts` - 16 个测试

## 测试覆盖

新增 74 个测试用例，总计 280 个测试全部通过。

## 测试工具

使用现有的 vitest + jsdom 环境，参考 `locator/__test__/test-helpers.ts`

## 验收标准

- [x] manager 模块有测试覆盖
- [x] facade 模块有测试覆盖
- [x] 所有测试通过
