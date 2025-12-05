# Range SDK Vue Demo

这是一个基于 Vue 3 + TypeScript 的 Range SDK 演示项目，展示了如何通过包引入的方式使用 Range SDK 的文本选区功能。

## 功能特性

- ✅ 文本选区检测和保存
- ✅ 多种选区类型支持（高亮、重要、笔记、疑问）
- ✅ 选区恢复功能
- ✅ 选区管理（查看、删除、清空）
- ✅ 响应式UI界面

## 技术栈

- Vue 3 + TypeScript
- Element Plus UI组件库
- Vite 构建工具
- @ad-audit/range-sdk 文本选区SDK

## 安装依赖

```bash
# 使用 emo（等同于 pnpm）
emo install
```

## 启动开发服务器

```bash
emo run dev
```

启动后访问 http://localhost:3001 查看演示效果。

## 使用说明

1. **选择文本**: 在演示文本区域中用鼠标选择任意文本
2. **选择类型**: 在弹出的对话框中选择标注类型
3. **保存选区**: 点击"保存"按钮保存选区
4. **管理选区**: 可以恢复、删除单个选区，或清空所有选区
5. **恢复功能**: 页面刷新后选区会自动恢复

## 包引入方式

本示例展示了如何通过 npm 包的方式使用 Range SDK：

```typescript
// 引入 Vue hooks
import { useSelectionRestore } from '@ad-audit/range-sdk/vue'

// 引入类型定义
import type { SerializedSelection } from '@ad-audit/range-sdk'
```

## 项目结构

```
examples/
├── package.json          # 项目依赖配置
├── vite.config.ts        # Vite 构建配置
├── tsconfig.json         # TypeScript 配置
├── index.html            # HTML 入口文件
├── src/
│   ├── main.ts           # 应用入口
│   ├── app.vue           # 根组件
│   └── selection-demo.vue # 选区演示组件
└── README.md             # 使用说明
```

## 与文档示例的区别

- 使用真实的 npm 包引入方式，而非源码引入
- 简化了 UI 界面，专注于核心功能演示
- 可独立运行，适合作为开发者的快速上手示例