# 快速开始

本指南将在 5 分钟内帮您上手 Range SDK，体验选区管理和插件系统的强大功能。

## 1. 创建项目并安装

```bash
# 创建新项目（以 Vite + Vue 为例）
npm create vue@latest my-range-sdk-app
cd my-range-sdk-app

# 安装 Range SDK
npm install @ad-audit/range-sdk
npm install @ad-audit/range-sdk-plugin-dictionary

# 启动开发服务器
npm run dev
```

## 2. 基础使用示例

### 第一步：初始化 SDK

创建 `src/components/RangeSDKDemo.vue`：

```vue
<template>
  <div class="demo-container">
    <h2>Range SDK 快速演示</h2>
    
    <!-- 内容区域 -->
    <div ref="contentRef" class="content-area">
      <h3>可选择文本区域</h3>
      <p>
        这是一段包含 <strong>API</strong> 和 <strong>SDK</strong> 等技术术语的文本。
        您可以选择这些词汇来体验 Range SDK 的强大功能。
      </p>
      <p>
        Range SDK 提供了选区管理、高亮显示、插件扩展等功能，
        是企业级应用的理想选择。尝试选择一些文本吧！
      </p>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <button @click="highlightKeywords">高亮关键词</button>
      <button @click="clearHighlights">清除高亮</button>
      <button @click="showCurrentSelection">显示当前选区</button>
    </div>

    <!-- 信息显示 -->
    <div v-if="currentSelection" class="selection-info">
      <h4>当前选区信息：</h4>
      <pre>{{ JSON.stringify(currentSelection, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RangeSDK } from '@ad-audit/range-sdk'
import { createDictionaryPlugin } from '@ad-audit/range-sdk-plugin-dictionary'
import type { RangeData } from '@ad-audit/range-sdk'

// 响应式数据
const contentRef = ref<HTMLElement>()
const currentSelection = ref<RangeData | null>(null)

// SDK 实例
let rangeSDK: RangeSDK | null = null

onMounted(async () => {
  if (!contentRef.value) return

  // 1. 创建 Range SDK 实例
  rangeSDK = new RangeSDK({
    container: contentRef.value,
    debug: true,
    performance: true
  })

  // 2. 创建词典插件
  const dictionaryPlugin = createDictionaryPlugin({
    // 模拟词典数据
    mockData: {
      'API': {
        id: 1,
        word: 'API',
        en_word: 'Application Programming Interface',
        content: '应用程序编程接口（API）是一组预定义的函数和协议，用于构建应用程序软件。它定义了软件组件之间的交互方式。',
        tags: ['技术', '编程', '接口'],
        owners: ['tech@company.com']
      },
      'SDK': {
        id: 2,
        word: 'SDK',
        en_word: 'Software Development Kit',
        content: '软件开发工具包（SDK）是一组软件开发工具的集合，包括库、文档、代码示例、指南等，用于帮助开发人员创建特定平台或框架的应用程序。',
        tags: ['开发工具', '软件', '工具包'],
        owners: ['dev@company.com']
      },
      'Range SDK': {
        id: 3,
        word: 'Range SDK',
        content: '一个强大的文档选区管理 SDK，专为企业级应用设计，提供选区管理、插件系统和高亮功能。',
        tags: ['选区管理', '企业级', '插件系统'],
        owners: ['range-team@company.com']
      }
    },
    // 高亮样式配置
    highlightStyle: {
      backgroundColor: 'rgba(24, 144, 255, 0.1)',
      borderBottom: '2px solid #1890ff',
      cursor: 'pointer',
      borderRadius: '2px',
      padding: '1px 2px'
    }
  })

  // 3. 注册插件
  await rangeSDK.registerPlugin(dictionaryPlugin)

  // 4. 监听选区事件
  rangeSDK.on('range-selected', (rangeData) => {
    console.log('📍 选中文本：', rangeData.selectedText)
    currentSelection.value = rangeData
  })

  rangeSDK.on('mark-clicked', (markData) => {
    console.log('🖱️ 点击高亮：', markData)
  })

  console.log('✅ Range SDK 初始化完成！')
})

onUnmounted(() => {
  rangeSDK?.destroy()
})

// 高亮关键词
const highlightKeywords = async () => {
  if (!rangeSDK) return
  
  console.log('🎯 开始高亮关键词...')
  
  // 搜索并高亮词典中的词汇
  const result = await (rangeSDK as any).dictionary.search({
    words: ['API', 'SDK', 'Range SDK'],
    container: contentRef.value
  })
  
  console.log('✨ 高亮完成：', result)
}

// 清除高亮
const clearHighlights = () => {
  if (!rangeSDK) return
  
  console.log('🧹 清除所有高亮...')
  ;(rangeSDK as any).dictionary.clearHighlights()
}

// 显示当前选区
const showCurrentSelection = async () => {
  if (!rangeSDK) return
  
  const selection = await rangeSDK.getCurrentSelection()
  currentSelection.value = selection
  
  if (selection) {
    console.log('📋 当前选区：', selection)
  } else {
    console.log('❌ 没有选区')
  }
}
</script>

<style scoped>
.demo-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.content-area {
  border: 2px dashed #e1e5e9;
  border-radius: 8px;
  padding: 24px;
  margin: 20px 0;
  background: #fafbfc;
  user-select: text;
  line-height: 1.6;
}

.content-area h3 {
  color: #333;
  margin-top: 0;
}

.content-area p {
  color: #555;
  margin-bottom: 16px;
}

.content-area strong {
  color: #1890ff;
  font-weight: 600;
}

.control-panel {
  display: flex;
  gap: 12px;
  margin: 20px 0;
}

.control-panel button {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.control-panel button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.selection-info {
  background: #f6f8fa;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 16px;
  margin-top: 20px;
}

.selection-info h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.selection-info pre {
  background: #fff;
  border: 1px solid #e1e5e9;
  border-radius: 4px;
  padding: 12px;
  margin: 0;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}
</style>
```

### 第二步：集成到主应用

修改 `src/App.vue`：

```vue
<template>
  <div id="app">
    <RangeSDKDemo />
  </div>
</template>

<script setup lang="ts">
import RangeSDKDemo from './components/RangeSDKDemo.vue'
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

#app {
  padding: 20px;
}
</style>
```

## 3. 运行和测试

启动开发服务器：

```bash
npm run dev
```

打开浏览器访问 `http://localhost:5173`，您将看到：

1. **可选择的文本区域** - 包含一些示例文本
2. **控制按钮** - 用于触发不同功能
3. **选区信息面板** - 显示当前选区的详细信息

### 测试步骤

1. **测试选区功能**：
   - 用鼠标选择任意文本
   - 查看控制台输出和选区信息面板

2. **测试词典高亮**：
   - 点击"高亮关键词"按钮
   - 观察 API、SDK 等词汇被高亮显示
   - 点击高亮的词汇，会显示词典卡片

3. **测试清除功能**：
   - 点击"清除高亮"按钮
   - 观察所有高亮被清除

## 4. 核心概念速览

通过这个示例，您已经体验了 Range SDK 的核心概念：

### 选区管理 (Selection Management)
```typescript
// 监听选区事件
rangeSDK.on('range-selected', (rangeData) => {
  console.log('用户选择了：', rangeData.selectedText)
})

// 获取当前选区
const selection = await rangeSDK.getCurrentSelection()
```

### 插件系统 (Plugin System)
```typescript
// 创建插件
const plugin = createDictionaryPlugin({
  mockData: { /* 词典数据 */ }
})

// 注册插件
await rangeSDK.registerPlugin(plugin)

// 使用插件 API
await rangeSDK.dictionary.search({ words: ['API'] })
```

### 高亮系统 (Highlight System)
```typescript
// 高亮文本
await rangeSDK.dictionary.highlightWords(['API', 'SDK'])

// 清除高亮
rangeSDK.dictionary.clearHighlights()
```

## 5. 进阶示例

### 自定义事件处理

```typescript
// 选区恢复示例
rangeSDK.on('range-selected', async (rangeData) => {
  // 保存选区数据
  localStorage.setItem('lastSelection', JSON.stringify(rangeData))
  
  // 稍后恢复选区
  setTimeout(async () => {
    await rangeSDK.restoreSelection(rangeData)
    console.log('选区已恢复')
  }, 2000)
})
```

### 批量高亮操作

```typescript
// 批量搜索和高亮
const keywords = ['API', 'SDK', 'JavaScript', 'TypeScript']
const results = []

for (const keyword of keywords) {
  const result = await rangeSDK.dictionary.search({
    words: [keyword],
    container: document.querySelector('.content')
  })
  results.push(result)
}

console.log('批量高亮完成：', results)
```

### 性能监控

```typescript
// 获取性能报告
const performanceReport = rangeSDK.getPerformanceReport()
console.log('性能报告：', performanceReport)

// 清理性能指标
rangeSDK.clearPerformanceMetrics()
```

## 6. 常见模式

### 模式 1：文档阅读增强

```typescript
// 自动扫描并高亮专业术语
const technicalTerms = ['API', 'SDK', 'HTTP', 'JSON', 'REST']

await rangeSDK.dictionary.search({
  words: technicalTerms,
  container: document.querySelector('.article-content')
})
```

### 模式 2：协作编辑

```typescript
// 结合评论插件实现协作功能
import { createCommentPlugin } from '@ad-audit/range-sdk-plugin-comment'

const commentPlugin = createCommentPlugin({
  onAddComment: (rangeData, comment) => {
    // 保存评论到后端
    saveComment(rangeData, comment)
  }
})

await rangeSDK.registerPlugin(commentPlugin)
```

### 模式 3：学习辅助

```typescript
// 实现学习模式：点击词汇显示解释
rangeSDK.on('mark-clicked', async (markData) => {
  const explanation = await fetchExplanation(markData.selectedText)
  showTooltip(markData.rect, explanation)
})
```

## 7. 下一步

现在您已经成功运行了第一个 Range SDK 应用！接下来建议您：

1. **深入学习**：阅读 [核心概念文档](./core-concepts.md)
2. **探索 API**：查看 [API 参考文档](../api/core-api.md)
3. **插件开发**：学习 [插件开发指南](../plugins/development-guide.md)
4. **最佳实践**：查看 [Dictionary 插件最佳实践](../best-practices/dictionary-plugin.md)
5. **在线体验**：访问 [Playground](../playground/index.md) 查看更多示例

## 8. 获取帮助

- 📖 查看完整文档：[Range SDK 文档](../index.md)
- 🔧 遇到问题：[故障排除指南](../troubleshooting.md)
- 💬 技术支持：联系内部技术团队
- 🎮 在线示例：[Playground](../playground/index.md)

---

恭喜您完成了 Range SDK 的快速入门！现在您可以开始构建强大的文档交互功能了。