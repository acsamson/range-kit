之后都用中文回答我

### 命名规范
- 文件和文件夹：小写加破折号（kebab-case），如 `block-editor`
### 代码组织

每个包应遵循以下结构：
```
packages/[package-name]/
├── src/
│   ├── components/       # React 组件
│   ├── stores/          # MobX 状态管理
│   ├── hooks/           # React Hooks
│   ├── utils/           # 工具函数（无副作用）
│   ├── helpers/         # 辅助函数（有副作用）
│   ├── types/           # 类型定义
│   ├── constants/       # 常量
│   ├── configs/         # 配置文件
│   └── index.ts         # 入口文件
```

### 代码风格
- 使用 TypeScript，严格模式
- 单文件不超过 700 行
- 遵循 ESLint 规则
- 使用 Prettier 格式化（配置：无分号、单引号、2 空格缩进）
- 所有代码必须有中文注释
- 避免使用 Tailwind 的 indigo 系列颜色（bg-indigo-500 等）

### Git 规范
- 遵循 Conventional Commits
- 常用前缀：feat, fix, docs, style, refactor, test, chore
- **重要**: 不允许自动提交代码，Git 操作仅限读取