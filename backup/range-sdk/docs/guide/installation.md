# 安装指南

本指南将帮助您在项目中安装和配置 Range SDK。

## 系统要求

### 浏览器支持

Range SDK 支持以下现代浏览器：

- Chrome 80+
- Firefox 78+
- Safari 13+
- Edge 80+

### 技术栈要求

- **Node.js**: 16.0+
- **TypeScript**: 4.5+ (可选，但强烈推荐)
- **Vue.js**: 3.3+ (如果使用官方插件)

## 安装方式

### NPM 安装 (推荐)

```bash
# 安装核心包
npm install @ad-audit/range-sdk

# 如果需要使用官方插件
npm install @ad-audit/range-sdk-plugin-dictionary
npm install @ad-audit/range-sdk-plugin-comment
```

### Yarn 安装

```bash
# 安装核心包
yarn add @ad-audit/range-sdk

# 如果需要使用官方插件
yarn add @ad-audit/range-sdk-plugin-dictionary
yarn add @ad-audit/range-sdk-plugin-comment
```

### PNPM 安装

```bash
# 安装核心包
pnpm add @ad-audit/range-sdk

# 如果需要使用官方插件
pnpm add @ad-audit/range-sdk-plugin-dictionary
pnpm add @ad-audit/range-sdk-plugin-comment
```

## TypeScript 配置

如果您使用 TypeScript，请确保您的 `tsconfig.json` 包含以下配置：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

## 基本配置

### 1. ES Module 引入

```typescript
// 引入核心 SDK
import { RangeSDK } from '@ad-audit/range-sdk'

// 引入插件
import { createDictionaryPlugin } from '@ad-audit/range-sdk-plugin-dictionary'
import { createCommentPlugin } from '@ad-audit/range-sdk-plugin-comment'
```

### 2. CommonJS 引入

```javascript
// 引入核心 SDK
const { RangeSDK } = require('@ad-audit/range-sdk')

// 引入插件
const { createDictionaryPlugin } = require('@ad-audit/range-sdk-plugin-dictionary')
```

### 3. CDN 引入

```html
<!-- 开发环境 -->
<script src="https://unpkg.com/@ad-audit/range-sdk@latest/dist/index.js"></script>

<!-- 生产环境 (压缩版) -->
<script src="https://unpkg.com/@ad-audit/range-sdk@latest/dist/index.min.js"></script>
```

## 框架集成

### Vue 3 项目集成

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// 全局配置 Range SDK (可选)
app.config.globalProperties.$rangeSDK = null

app.mount('#app')
```

```vue
<!-- App.vue -->
<template>
  <div class="app-container">
    <div ref="contentContainer" class="content">
      <p>这里是可选择的文本内容...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RangeSDK } from '@ad-audit/range-sdk'
import { createDictionaryPlugin } from '@ad-audit/range-sdk-plugin-dictionary'

const contentContainer = ref<HTMLElement>()
let rangeSDK: RangeSDK | null = null

onMounted(async () => {
  if (contentContainer.value) {
    // 初始化 Range SDK
    rangeSDK = new RangeSDK({
      container: contentContainer.value,
      debug: import.meta.env.DEV
    })

    // 注册插件
    const dictionaryPlugin = createDictionaryPlugin({
      // 插件配置
    })
    
    await rangeSDK.registerPlugin(dictionaryPlugin)

    // 监听事件
    rangeSDK.on('range-selected', (rangeData) => {
      console.log('选择了文本：', rangeData.selectedText)
    })
  }
})

onUnmounted(() => {
  // 清理资源
  rangeSDK?.destroy()
})
</script>
```

### React 项目集成

```tsx
// App.tsx
import React, { useRef, useEffect } from 'react'
import { RangeSDK } from '@ad-audit/range-sdk'
import { createDictionaryPlugin } from '@ad-audit/range-sdk-plugin-dictionary'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rangeSdkRef = useRef<RangeSDK | null>(null)

  useEffect(() => {
    if (containerRef.current) {
      // 初始化 Range SDK
      rangeSdkRef.current = new RangeSDK({
        container: containerRef.current,
        debug: process.env.NODE_ENV === 'development'
      })

      // 注册插件
      const initializePlugins = async () => {
        const dictionaryPlugin = createDictionaryPlugin({
          // 插件配置
        })
        
        await rangeSdkRef.current?.registerPlugin(dictionaryPlugin)

        // 监听事件
        rangeSdkRef.current?.on('range-selected', (rangeData) => {
          console.log('选择了文本：', rangeData.selectedText)
        })
      }

      initializePlugins()
    }

    // 清理资源
    return () => {
      rangeSdkRef.current?.destroy()
    }
  }, [])

  return (
    <div className="app-container">
      <div ref={containerRef} className="content">
        <p>这里是可选择的文本内容...</p>
      </div>
    </div>
  )
}

export default App
```

### 原生 JavaScript 集成

```html
<!DOCTYPE html>
<html>
<head>
  <title>Range SDK 示例</title>
</head>
<body>
  <div id="content">
    <p>这里是可选择的文本内容...</p>
  </div>

  <script type="module">
    import { RangeSDK } from '@ad-audit/range-sdk'
    import { createDictionaryPlugin } from '@ad-audit/range-sdk-plugin-dictionary'

    // 初始化
    const contentContainer = document.getElementById('content')
    const rangeSDK = new RangeSDK({
      container: contentContainer,
      debug: true
    })

    // 注册插件
    const dictionaryPlugin = createDictionaryPlugin({
      // 插件配置
    })

    rangeSDK.registerPlugin(dictionaryPlugin).then(() => {
      console.log('Dictionary 插件已注册')
      
      // 监听事件
      rangeSDK.on('range-selected', (rangeData) => {
        console.log('选择了文本：', rangeData.selectedText)
      })
    })
  </script>
</body>
</html>
```

## 构建工具配置

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    include: [
      '@ad-audit/range-sdk',
      '@ad-audit/range-sdk-plugin-dictionary'
    ]
  },
  build: {
    rollupOptions: {
      external: [], // 根据需要配置外部依赖
    }
  }
})
```

### Webpack 配置

```javascript
// webpack.config.js
module.exports = {
  // ... 其他配置
  resolve: {
    alias: {
      '@ad-audit/range-sdk': require.resolve('@ad-audit/range-sdk')
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
}
```

## 样式配置

Range SDK 的部分插件（如 Dictionary Plugin）包含 CSS 样式，您需要确保这些样式被正确加载。

### 自动导入样式 (推荐)

大多数现代构建工具会自动处理 CSS 导入：

```typescript
// 样式会自动被导入，无需额外配置
import { createDictionaryPlugin } from '@ad-audit/range-sdk-plugin-dictionary'
```

### 手动导入样式

如果需要手动控制样式导入：

```typescript
// 只导入 JavaScript
import { createDictionaryPlugin } from '@ad-audit/range-sdk-plugin-dictionary/dist/index.js'

// 手动导入样式
import '@ad-audit/range-sdk-plugin-dictionary/dist/style.css'
```

### 自定义样式

您可以通过 CSS 变量自定义插件样式：

```css
/* 自定义字典插件样式 */
:root {
  --range-sdk-dictionary-bg: #ffffff;
  --range-sdk-dictionary-border: #e1e5e9;
  --range-sdk-dictionary-text: #333333;
  --range-sdk-dictionary-highlight: #1890ff;
}

/* 或直接覆盖样式类 */
.dictionary-card {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

## 环境变量配置

您可以通过环境变量控制 Range SDK 的行为：

```bash
# .env
# 启用调试模式
VITE_RANGE_SDK_DEBUG=true

# 设置性能监控
VITE_RANGE_SDK_PERFORMANCE=true

# 自定义 API 端点
VITE_RANGE_SDK_API_BASE_URL=https://api.example.com
```

在代码中使用：

```typescript
const rangeSDK = new RangeSDK({
  debug: import.meta.env.VITE_RANGE_SDK_DEBUG === 'true',
  performance: import.meta.env.VITE_RANGE_SDK_PERFORMANCE === 'true'
})
```

## 验证安装

创建一个简单的测试文件来验证安装是否成功：

```typescript
// test-installation.ts
import { RangeSDK } from '@ad-audit/range-sdk'

console.log('Range SDK version:', RangeSDK.version)

const sdk = new RangeSDK({
  debug: true
})

console.log('Range SDK initialized successfully!')

// 测试基本功能
sdk.on('range-selected', (rangeData) => {
  console.log('Selection test passed:', rangeData.selectedText)
})
```

## 常见安装问题

### 问题 1：TypeScript 类型错误

**错误信息**：
```
Cannot find module '@ad-audit/range-sdk' or its corresponding type declarations
```

**解决方案**：
确保安装了正确的包，并检查 `tsconfig.json` 配置。

### 问题 2：模块解析错误

**错误信息**：
```
Module not found: Can't resolve '@ad-audit/range-sdk'
```

**解决方案**：
检查构建工具配置，确保正确配置了模块解析路径。

### 问题 3：样式未正确加载

**症状**：
插件功能正常但样式缺失。

**解决方案**：
确保构建工具支持 CSS 模块导入，或手动导入样式文件。

## 下一步

安装完成后，建议您：

1. 阅读 [快速开始指南](./quick-start.md)
2. 了解 [核心概念](./core-concepts.md)
3. 查看 [API 参考文档](../api/core-api.md)
4. 体验 [在线示例](../playground/index.md)

---

如果您在安装过程中遇到其他问题，请查看 [故障排除文档](../troubleshooting.md) 或联系技术支持。