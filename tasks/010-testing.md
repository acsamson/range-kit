# 任务 010: 完善测试覆盖

## 优先级
🟢 代码质量 (Code Quality)

## 描述
为重构后的模块编写独立的单元测试和集成测试。

## 执行步骤

### 10.1 单元测试

#### Locator 模块测试
- [ ] `locator/serializer.test.ts`
  - 测试各种选区类型的序列化
  - 测试边界情况（空选区、跨元素选区）
  - 测试自定义 ID 配置

- [ ] `locator/restorer.test.ts`
  - 测试四层恢复算法
  - 测试 DOM 变化后的恢复
  - 测试恢复失败的错误处理

#### Highlighter 模块测试
- [ ] `highlighter/highlighter.test.ts`
  - 测试各种高亮样式
  - 测试高亮清除
  - 测试重叠高亮

#### Interaction 模块测试
- [ ] `interaction/interaction.test.ts`
  - 测试事件监听
  - 测试事件归一化
  - 测试销毁清理

### 10.2 集成测试

- [ ] `integration/selection-flow.test.ts`
  - 测试完整的选区 → 序列化 → 存储 → 恢复 → 高亮流程
  - 使用 Vitest browser mode 或 JSDOM

- [ ] `integration/cross-dom.test.ts`
  - 测试跨标签页的选区恢复
  - 测试动态 DOM 变化场景

### 10.3 测试配置
- [ ] 确保 `vitest.config.ts` 配置正确
- [ ] 添加测试覆盖率报告
- [ ] 配置 CI 自动运行测试

## 测试目标
- 单元测试覆盖率 > 80%
- 核心恢复算法覆盖率 > 95%
- 所有公共 API 有对应测试

## 预估工作量
约 1-2 天

## 相关文件
- `core/src/**/__test__/`
- `core/vitest.config.ts`
