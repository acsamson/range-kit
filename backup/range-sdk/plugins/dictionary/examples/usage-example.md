# 词典插件使用示例

本文档展示了如何使用词典插件的各种功能，包括自定义组件、mock 数据和禁用默认请求等高级用法。

## 基础使用

### 1. 简单初始化

```typescript
import { useDictionary } from '../hooks/use-dictionary'

// 最简单的使用方式
const dictionary = useDictionary({
  appid: 1000,
  container: '#my-container'
})

// 初始化词典
await dictionary.initDictionary({
  words: [
    { word: 'Vue', appid: 1000 },
    { word: 'React', appid: 1000 },
    { word: 'TypeScript', appid: 1000 }
  ]
})
```

### 2. 使用 Mock 数据

```typescript
// 使用预定义的 mock 词汇列表
const mockDictionary = useDictionary({
  appid: 1001,
  container: '#mock-container',
  useMock: ['JavaScript', 'TypeScript', 'Vue', 'React'],
  highlightStyle: {
    color: '#ff5722',
    backgroundColor: 'rgba(255, 87, 34, 0.1)'
  }
})
```

## 自定义组件示例

### 3. 最简单的自定义卡片

```typescript
import { defineComponent } from 'vue'

// 最简单的自定义组件
const MinimalCustomCard = defineComponent({
  name: 'MinimalCustomCard',
  props: {
    keywords: {
      type: Array as () => string[],
      required: true
    },
    dataLoader: {
      type: Function,
      required: false
    }
  },
  emits: ['close'],
  template: `
    <div class="minimal-card">
      <div class="header">
        <h3>🎯 最简自定义卡片</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      <div class="body">
        <p><strong>关键词：</strong>{{ keywords.join('、') }}</p>
        <p>这是一个最简单的自定义组件实现！</p>
      </div>
    </div>
  `,
  style: `
    .minimal-card {
      background: linear-gradient(135deg, #ff7043 0%, #ff5722 100%);
      color: white;
      border-radius: 8px;
      overflow: hidden;
      min-width: 280px;
      max-width: 360px;
      box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);
    }
    .header {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.1);
    }
    .header h3 {
      margin: 0;
      font-size: 16px;
    }
    .close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
    }
    .body {
      padding: 20px;
    }
    .body p {
      margin: 0 0 8px 0;
      line-height: 1.5;
    }
  `
})

// 使用自定义组件
const customDictionary = useDictionary({
  appid: 1002,
  container: '#custom-container',
  customCardComponent: MinimalCustomCard,
  useMock: ['JavaScript', 'TypeScript', 'Vue', 'React']
})
```

### 4. 动态主题组件

```typescript
// 创建动态主题组件的工厂函数
const createDynamicCard = (theme: 'blue' | 'purple' | 'green' = 'blue') => {
  const themes = {
    blue: { bg: '#2196f3', accent: '#1976d2' },
    purple: { bg: '#9c27b0', accent: '#7b1fa2' },
    green: { bg: '#4caf50', accent: '#388e3c' }
  }

  return defineComponent({
    name: `DynamicCard-${theme}`,
    props: {
      keywords: {
        type: Array as () => string[],
        required: true
      },
      dataLoader: {
        type: Function,
        required: false
      }
    },
    emits: ['close'],
    setup(props, { emit }) {
      return () => h('div', {
        style: {
          background: `linear-gradient(135deg, ${themes[theme].bg} 0%, ${themes[theme].accent} 100%)`,
          color: 'white',
          borderRadius: '12px',
          padding: '20px',
          minWidth: '300px',
          boxShadow: `0 6px 20px ${themes[theme].bg}40`
        }
      }, [
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }
        }, [
          h('h3', {
            style: { margin: '0', fontSize: '16px' }
          }, `🎨 ${theme.toUpperCase()} 主题卡片`),
          h('button', {
            onClick: () => emit('close'),
            style: {
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer'
            }
          }, '×')
        ]),
        h('div', {}, [
          h('p', { style: { margin: '0 0 12px 0' } }, `关键词数量: ${props.keywords.length}`),
          h('div', {
            style: {
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px'
            }
          }, props.keywords.map((keyword, index) =>
            h('span', {
              key: keyword,
              style: {
                background: 'rgba(255,255,255,0.2)',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }
            }, `${index + 1}. ${keyword}`)
          ))
        ])
      ])
    }
  })
}

// 使用动态主题
const blueDictionary = useDictionary({
  appid: 1003,
  container: '#blue-container',
  customCardComponent: createDynamicCard('blue')
})

const purpleDictionary = useDictionary({
  appid: 1004,
  container: '#purple-container',
  customCardComponent: createDynamicCard('purple')
})
```

## 高级功能：禁用默认请求

### 5. 完全自定义数据获取

当你需要完全控制数据的获取和展示时，可以使用 `disableDefaultRequest` 选项：

```typescript
// 禁用默认请求，自定义组件自行处理数据
const customDataDictionary = useDictionary({
  appid: 1005,
  container: '#custom-data-container',
  customCardComponent: MyCustomDataCard,
  disableDefaultRequest: true, // 禁用默认的数据请求
  debug: true
})

// 初始化时只设置关键词，不会发起默认的词典数据请求
await customDataDictionary.initDictionary({
  words: [
    { word: 'Vue' },
    { word: 'React' },
    { word: 'TypeScript' }
  ]
})
```

### 6. 自定义数据获取组件示例

```vue
<template>
  <div class="custom-data-card">
    <div class="header">
      <h3>🚀 自定义数据获取</h3>
      <button @click="$emit('close')" class="close-btn">×</button>
    </div>

    <div class="content">
      <h4>📝 关键词</h4>
      <div class="keywords">
        <span v-for="keyword in keywords" :key="keyword" class="keyword">
          {{ keyword }}
        </span>
      </div>

      <h4>📊 自定义数据</h4>
      <div v-if="loading" class="loading">
        🔄 正在获取自定义数据...
      </div>
      <div v-else class="data-display">
        <pre>{{ JSON.stringify(customData, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  keywords: string[]
  // 注意：当 disableDefaultRequest: true 时，不会收到 dataLoader 参数
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const loading = ref(false)
const customData = ref<any[]>([])

// 自定义的数据获取函数
const fetchCustomData = async () => {
  loading.value = true

  try {
    // 这里可以调用你自己的 API
    const results = await Promise.all(
      props.keywords.map(async (keyword) => {
        // 模拟自定义 API 调用
        const response = await fetch(`/api/my-custom-dictionary?word=${keyword}`)
        const data = await response.json()

        return {
          keyword,
          customField: `自定义数据 for ${keyword}`,
          timestamp: Date.now(),
          ...data
        }
      })
    )

    customData.value = results
  } catch (error) {
    console.error('获取自定义数据失败:', error)
    customData.value = props.keywords.map(keyword => ({
      keyword,
      error: '获取失败',
      fallbackData: `${keyword} 的备用数据`
    }))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCustomData()
})
</script>

<style scoped>
.custom-data-card {
  background: linear-gradient(145deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  overflow: hidden;
  min-width: 400px;
  max-width: 600px;
}

.header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.1);
}

.header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
}

.content {
  padding: 20px;
}

.content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.keywords {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.keyword {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.loading {
  text-align: center;
  padding: 20px;
  font-size: 14px;
}

.data-display {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.data-display pre {
  margin: 0;
  font-size: 12px;
  font-family: 'SF Mono', Monaco, monospace;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
```

## Vue 组件中的完整示例

### 7. 组件切换演示页面

```vue
<template>
  <div class="dictionary-demo-page">
    <h1>🎯 词典插件演示</h1>

    <!-- 功能切换器 -->
    <div class="mode-switcher">
      <button
        v-for="mode in modes"
        :key="mode.key"
        @click="switchMode(mode.key)"
        :class="{ active: currentMode === mode.key }"
      >
        {{ mode.label }}
      </button>
    </div>

    <!-- 演示内容 -->
    <div ref="contentRef" class="demo-content">
      <h2>技术文档示例</h2>
      <p>现代前端开发主要使用 <strong>Vue</strong>、<strong>React</strong> 等框架。</p>
      <p><strong>TypeScript</strong> 为 JavaScript 添加了静态类型检查。</p>
      <p><strong>JavaScript</strong> 是 Web 开发的基础语言。</p>
      <p>点击高亮的词汇查看不同的卡片效果！</p>
    </div>

    <!-- 当前状态 -->
    <div class="status">
      <p>当前模式: <strong>{{ currentModeLabel }}</strong></p>
      <p>就绪状态: {{ currentDictionary?.isReady.value ? '✅' : '❌' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDictionary } from '../hooks/use-dictionary'
import CustomCardExample from './custom-card-example.vue'

const contentRef = ref<HTMLElement>()
const currentMode = ref<string>('default')

const modes = [
  { key: 'default', label: '默认卡片' },
  { key: 'custom', label: '自定义卡片' },
  { key: 'minimal', label: '最简卡片' },
  { key: 'custom-data', label: '自定义数据' }
]

const currentModeLabel = computed(() => {
  return modes.find(m => m.key === currentMode.value)?.label || '未知'
})

// 创建多个词典实例
const dictionaries = {
  default: useDictionary({
    appid: 1000,
    container: contentRef,
  }),
  custom: useDictionary({
    appid: 1001,
    container: contentRef,
    customCardComponent: CustomCardExample,
  }),
  minimal: useDictionary({
    appid: 1002,
    container: contentRef,
    customCardComponent: MinimalCustomCard,
  }),
  'custom-data': useDictionary({
    appid: 1003,
    container: contentRef,
    customCardComponent: MyCustomDataCard,
    disableDefaultRequest: true, // 关键：禁用默认请求
  })
}

const currentDictionary = computed(() => {
  return dictionaries[currentMode.value as keyof typeof dictionaries]
})

// 切换模式
const switchMode = async (mode: string) => {
  // 清除所有高亮
  Object.values(dictionaries).forEach(dict => dict.clearHighlights())

  currentMode.value = mode

  // 根据模式使用不同的初始化方式
  const testWords = [
    { word: 'Vue', appid: 1000 + Object.keys(dictionaries).indexOf(mode) },
    { word: 'React', appid: 1000 + Object.keys(dictionaries).indexOf(mode) },
    { word: 'TypeScript', appid: 1000 + Object.keys(dictionaries).indexOf(mode) },
    { word: 'JavaScript', appid: 1000 + Object.keys(dictionaries).indexOf(mode) }
  ]

  // 初始化新的词典
  await currentDictionary.value.initDictionary({ words: testWords })
}

// 初始化默认模式
switchMode('default')
</script>

<style scoped>
.dictionary-demo-page {
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.mode-switcher {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.mode-switcher button {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-switcher button:hover {
  border-color: #007bff;
}

.mode-switcher button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.demo-content {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  line-height: 1.6;
}

.status {
  background: #e9ecef;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
}
</style>
```

## 核心特性总结

### disableDefaultRequest 的优势

1. **完全的数据控制**: 自定义组件可以调用任何 API，使用任何数据格式
2. **减少不必要的请求**: 当你不需要默认的词典 API 时，可以避免发起无用的请求
3. **灵活的数据源**: 可以从数据库、缓存、其他微服务等任何地方获取数据
4. **自定义错误处理**: 实现自己的加载状态、错误处理和重试逻辑

### 使用场景

- 集成自己的词典 API
- 使用不同的数据格式或结构
- 需要特殊的认证或权限控制
- 实现离线或缓存功能
- 与现有系统的数据源集成

### 注意事项

- 当 `disableDefaultRequest: true` 时，自定义组件不会收到 `dataLoader` 参数
- 需要在自定义组件内部实现所有的数据获取和状态管理逻辑
- 仍然可以使用 `useMock` 或传入 `words` 来设置关键词列表用于高亮显示