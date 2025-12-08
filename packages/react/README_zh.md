# Range Kit React

[![npm version](https://img.shields.io/npm/v/range-kit-react.svg)](https://www.npmjs.com/package/range-kit-react) [![npm downloads](https://img.shields.io/npm/dm/range-kit-react.svg)](https://www.npmjs.com/package/range-kit-react) [![License](https://img.shields.io/npm/l/range-kit-react.svg)](https://www.npmjs.com/package/range-kit-react)

[GitHub](https://github.com/acsamson/range-kit/tree/main/packages/react) | [English](./README.md)

[`range-kit`](https://github.com/acsamson/range-kit/tree/main/packages/core) 的 React 绑定库，提供 Hooks 和组件，方便在 React 应用中集成强大的范围选择和高亮功能。

## 演示

<p align="center">
  <img src="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.gif" alt="Demo GIF" width="100%">
</p>

<p align="center">
  <a href="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.mp4">观看演示视频</a>
</p>

## 特性

- **React Hooks**:
  - `useSelectionRestore`: 管理选区的持久化和恢复。
  - `useSearchHighlight`: 实现带有高亮功能的搜索。
  - `useSelectionCallbacks`: 处理选区事件。
- **组件**:
  - `SelectionPopover`: 开箱即用的选区操作气泡组件。

## 安装

```bash
npm install range-kit-react range-kit
# 或
pnpm add range-kit-react range-kit
# 或
yarn add range-kit-react range-kit
```

## 使用方法

### 基本示例

```tsx
import { useRef } from 'react';
import { useSearchHighlight, SelectionPopover } from 'range-kit-react';
import 'range-kit-react/styles';

function App() {
  const containerRef = useRef(null);
  
  // 初始化搜索高亮
  const {
    searchKeywords,
    searchResults,
    addSearchKeyword,
    clearSearchHighlights
  } = useSearchHighlight({
    getInstance: () => null, // 如果需要，提供 SelectionManager 实例
    containers: ['#content-area'],
    selectionStyles: {
      default: { backgroundColor: 'yellow' }
    }
  });

  return (
    <div>
      <div id="content-area">
        <p>在这里选择一些文本以查看 range-kit 的效果。</p>
      </div>
      
      {/* 气泡组件集成 */}
      <SelectionPopover 
        // ... 属性配置
      />
    </div>
  );
}
```

## 许可证

Apache-2.0
