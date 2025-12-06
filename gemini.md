之后都用中文回答我

### 技术栈与工具链 (Tech Stack)
- **包管理器**: `pnpm` (利用 workspace 协议管理 Monorepo 依赖)
- **构建工具**: `Vite` (应用构建) / `tsup` (库文件打包)
- **测试框架**: `Vitest` (单元测试), `Playwright` (E2E 测试)
- **文档工具**: `VitePress` (生成静态文档站)

### 命名规范
- **所有文件和文件夹**：必须使用小写加破折号（kebab-case），如 `block-editor.tsx`, `app.vue`
- 变量与函数：小驼峰（camelCase）
- 常量：全大写下划线（UPPER_SNAKE_CASE）

### 代码组织

根据包的职责类型，选择以下适用的目录结构：

#### 1. 核心逻辑/SDK 模式 (Logic/SDK Library)
**适用场景：** `core`, 工具库, 纯 JS/TS SDK。
**特点：** 领域驱动 (DDD) 或 模块化设计，强调逻辑分层。

```text
packages/[core-package]/
├── src/
│   ├── [domain-module]/      # 领域模块 (如: manager, locator)
│   │   ├── index.ts          # 模块统一出口
│   │   ├── [feature].ts      # 具体逻辑实现
│   │   ├── strategies/       # 策略模式实现 (如不同序列化方式)
│   │   └── types.ts          # 模块内部类型
│   ├── common/               # 通用基础设施 (Logger, Errors)
│   ├── services/             # 服务层 (业务逻辑封装与统一接口)
│   ├── types/                # 全局对外类型定义 (Public API Types)
│   ├── constants/            # 全局常量
│   └── index.ts              # 库入口 (仅导出 Public API)
```

#### 2. UI 组件库模式 (UI Component Library)
**适用场景：** `_react`, `vue`, `design-system`。
**特点：** 以组件和 Hooks 为核心，强调复用性和视觉呈现。

```text
packages/[ui-package]/
├── src/
│   ├── components/           # UI 组件
│   │   └── [Component]/      # 单个组件文件夹
│   │       ├── index.ts      # 导出
│   │       ├── [Name].tsx    # 组件代码 (React/Vue)
│   │       └── [Name].scss   # 独享样式 (可选)
│   ├── hooks/                # 逻辑复用 (useSelection, useHighlight)
│   ├── contexts/             # 跨组件状态 (React Context / Vue Provide)
│   ├── styles/               # 全局样式/主题变量
│   ├── utils/                # 视图层工具函数 (DOM 操作等)
│   ├── types/                # 组件 Props 定义
│   └── index.ts              # 库入口
```

#### 3. 应用/演示模式 (Application / Example)
**适用场景：** `examples`, 文档站, 完整 Web 应用。
**特点：** 以页面和功能特性为核心，包含路由和全局状态。

```text
examples/[app-name]/
├── src/
│   ├── assets/               # 静态资源 (图片, 字体)
│   ├── layouts/              # 全局布局 (Header, Sidebar)
│   ├── pages/                # 页面/路由入口
│   ├── features/             # 业务功能模块 (含特定 UI 和逻辑)
│   ├── services/             # API 请求与模拟数据 (Mock)
│   ├── store/                # 全局状态管理 (Redux/Pinia/Zustand)
│   ├── App.tsx               # 根组件
│   └── main.tsx              # 应用挂载点
```

### 代码风格 (Code Style)
- **TypeScript**:
  - 开启 `strict: true`
  - **禁止使用 `any`** (必须用 `unknown` 或泛型代替，特殊情况需 eslint-disable 说明理由)
  - 优先使用 `interface` 定义对象结构 (便于扩展)，`type` 定义联合类型/元组
- **注释规范**:
  - **Public API**: 必须使用 **TSDoc** 格式 (支持 IDE 悬浮提示)
  - **业务逻辑**: 复杂处需配中文注释，解释 "Why" (设计意图) 而非 "What" (代码字面意思)
- **格式化**:
  - Prettier: 无分号, 单引号, 2 空格
  - Import 排序: 推荐使用 `trivago/prettier-plugin-sort-imports` 自动排序
  - 单文件建议不超过 400 行 (逻辑复杂除外)

### 最佳实践 (Best Practices)
- **状态管理**:
  - 避免全局状态滥用，优先使用 `Context` + `Hooks` (React) 或 `Composables` (Vue) 实现局部状态闭环
  - 复杂状态使用 `Zustand` (React) 或 `Pinia` (Vue)
- **样式方案**:
  - 推荐: `Tailwind CSS` (Utility-first) 或 `CSS Modules` (Scoped CSS)
  - **禁止**: 在库文件 (`packages/*`) 中使用运行时 CSS-in-JS (如 styled-components)，以减小 Bundle 体积和避免样式冲突
  - 避免使用 Tailwind 的 indigo 系列颜色（bg-indigo-500 等）
- **副作用管理**:
  - 所有的事件监听 (`addEventListener`)、定时器 (`setInterval`) 必须在组件卸载或对象销毁 (`destroy`) 时被清除。

### Git 工作流 (Workflow)
- **提交规范**: 遵循 Conventional Commits
  - `feat`: 新功能
  - `fix`: 修复 Bug
  - `docs`: 文档变更
  - `style`: 格式调整 (不影响代码运行)
  - `refactor`: 重构 (无新功能/无 Bug 修复)
  - `test`: 测试相关
  - `chore`: 构建/工具链变动
- **分支策略**: Trunk Based Development (主干开发) 或 Github Flow
- **Pre-commit**: 使用 `husky` + `lint-staged` 确保提交前通过 Lint 和 Type Check
- **重要**: 不允许自动提交代码，Git 操作仅限读取