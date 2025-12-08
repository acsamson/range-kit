# Range Kit

[![npm version](https://img.shields.io/npm/v/range-kit.svg)](https://www.npmjs.com/package/range-kit) [![npm downloads](https://img.shields.io/npm/dm/range-kit.svg)](https://www.npmjs.com/package/range-kit) [![License](https://img.shields.io/npm/l/range-kit.svg)](https://www.npmjs.com/package/range-kit)

[English](./README.md)

一个强大、现代的 DOM Range 选区管理库。Range Kit 提供了强大的文本选择序列化、恢复和高亮功能，专为应对 DOM 结构变化而设计。

## 演示

<p align="center">
  <img src="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.gif" alt="Demo GIF" width="100%">
</p>

<p align="center">
  <a href="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.mp4">观看演示视频</a>
</p>

## 核心能力

Range Kit 解决了动态 Web 应用中与文本选择相关的复杂问题：

- 🛡️ **健壮的选区序列化与恢复**：
  - 将临时的 `Range` 对象转换为持久化的 JSON 格式。
  - 即使 DOM 结构发生变化（如虚拟 DOM 更新），也能使用多层策略（ID、路径、上下文、指纹）恢复选区。
  - 非常适合将评论、批注或阅读进度保存到数据库。

- 🎨 **高性能高亮**：
  - 使用 **CSS Custom Highlight API** (CSS `::highlight`) 实现零 DOM 影响的高亮。
  - 在旧版浏览器中优雅降级为优化的 DOM 包裹方案。
  - 支持自定义样式，不污染全局 CSS。

- 🖱️ **高级交互**：
  - 为高亮区域提供统一的 `click`、`hover` 和 `contextmenu` 事件。
  - 无论使用 CSS Highlight 还是 DOM 包裹，都能无缝工作。
  - 对非元素高亮进行精确的命中检测。

- 🔍 **搜索与导航**：
  - 内置搜索功能，提供一致的高亮效果。
  - 空间导航（上一个/下一个），可在高亮之间跳转。

- ⚠️ **重叠检测**：
  - 智能检测并处理重叠的选区。
  - 适用于复杂的批注系统。

## 包含的包

此 Monorepo 包含以下包：

- **[range-kit](https://github.com/acsamson/range-kit/tree/main/packages/core)**：核心库（框架无关）。处理选区序列化、恢复策略和 DOM 操作的复杂逻辑。
- **[range-kit-react](https://github.com/acsamson/range-kit/tree/main/packages/react)**：React 绑定，包含 Hooks 和组件。
- **[range-kit-vue](https://github.com/acsamson/range-kit/tree/main/packages/vue)**：Vue 绑定，包含 Composables 和组件。

## 快速开始

### 在 React 中使用

```bash
npm install range-kit-react range-kit
```

详见 [range-kit-react 文档](https://github.com/acsamson/range-kit/tree/main/packages/react/README_zh.md)。

### 在 Vue 中使用

```bash
npm install range-kit-vue range-kit
```

详见 [range-kit-vue 文档](https://github.com/acsamson/range-kit/tree/main/packages/vue/README_zh.md)。

### 使用原生 JS / Core

```bash
npm install range-kit
```

详见 [range-kit 文档](https://github.com/acsamson/range-kit/tree/main/packages/core/README_zh.md)。

## 开发

本项目使用 [pnpm](https://pnpm.io/) workspaces。

1. **安装依赖**：
   ```bash
   pnpm install
   ```

2. **启动开发服务器**（以监听模式启动所有包）：
   ```bash
   pnpm dev
   ```

3. **构建所有包**：
   ```bash
   pnpm build
   ```

4. **运行测试**：
   ```bash
   pnpm test
   ```

## 许可证

Apache-2.0
