# 任务 010: 架构清理重构

## 背景

当前 `restore/` 模块是历史遗留的"大杂烩"，包含了本应分散到各个独立模块的功能。新的三层架构（locator/highlighter/interaction）已经建立，需要逐步将 `restore/` 的内容迁移到正确的位置。

## 目标架构

```
core/src/
├── common/           # 公共基础设施
│   ├── errors.ts     # 错误类
│   ├── logger.ts     # 日志
│   ├── debug/        # 调试工具（从 restore/debug 迁移）
│   └── types.ts      # 共享类型
│
├── constants/        # 常量（合并 restore/constants）
│
├── types/            # 统一类型定义（合并 restore/types）
│
├── locator/          # 定位器模块
│   ├── serializer/   # 序列化（从 restore/serializer 迁移）
│   ├── restorer/     # 恢复算法 L1-L4（从 restore/restorer 迁移）
│   └── ...
│
├── highlighter/      # 高亮器模块（合并 restore/highlighter）
│
├── interaction/      # 交互管理器
│
├── manager/          # 选区实例管理（从 restore/manager 迁移）
│
├── facade/           # 用户入口
│   ├── selection-manager.ts   # SelectionManager
│   ├── selection-restore.ts   # SelectionRestore（从 restore/index.ts 迁移）
│   └── ...
│
└── index.ts          # 主入口
```

## 分步骤任务

### 阶段 1: 准备工作
- [x] 010.1: 合并 constants（restore/constants → constants/）
- [x] 010.2: 移动 debug 模块（restore/debug → common/debug/）
- [x] 010.3: 合并 types（restore/types → types/）

### 阶段 2: 核心模块迁移
- [ ] 010.4: 迁移 restorer（restore/restorer → locator/restorer/）
- [ ] 010.5: 迁移 serializer（restore/serializer → locator/serializer/）
- [ ] 010.6: 合并 highlighter（restore/highlighter → highlighter/）

### 阶段 3: 管理模块迁移
- [ ] 010.7: 迁移 manager（restore/manager → manager/）
- [ ] 010.8: 迁移 facade（restore/facade + restore/core + restore/api → facade/）

### 阶段 4: 清理
- [ ] 010.9: 更新主入口文件导出
- [ ] 010.10: 删除 restore/ 目录
- [ ] 010.11: 更新文档和示例

## 执行原则

1. **每个子任务独立可测试** - 完成一个子任务后必须确保构建和测试通过
2. **渐进式迁移** - 先复制后删除，确保不丢失功能
3. **保持向后兼容** - 导出的 API 保持不变
4. **及时提交** - 每完成一个阶段就提交代码

## 风险和注意事项

- `restore/` 有 100+ 文件，内部依赖关系复杂
- 测试文件也依赖这些路径，需要同步更新
- 某些类型定义可能有循环依赖，需要仔细处理

## 验收标准

- [ ] 构建通过（pnpm build）
- [ ] 所有 206 个测试通过（pnpm test）
- [ ] restore/ 目录被删除
- [ ] 导出的公共 API 保持不变
