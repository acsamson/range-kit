# 原生支持 customCardComponentProps 使用示例

## ✅ 新功能：原生支持自定义组件属性

现在 `use-dictionary.ts` 原生支持 `customCardComponentProps`，外部无需再进行 Enhanced 封装！

## 📖 使用方法

### 1. 基础使用示例

```typescript
import { useDictionary } from '@ad-audit/range-sdk-plugin-dictionary';
import MyCustomCard from './my-custom-card.vue';

const dictionaryHook = useDictionary({
  appid: 5,
  container: containerElement,

  // ✅ 直接传入自定义组件
  customCardComponent: MyCustomCard,

  // ✅ 原生支持自定义属性传递
  customCardComponentProps: {
    theme: 'dark',
    size: 'large',
    customTitle: '智能词典助手',
    subtitle: '知识点查询',
    showActions: true,
    exportText: '导出数据',
    shareText: '分享内容',
    knowledgeInfos: knowledgeInfosRef, // 响应式数据
    debugMode: true
  },

  disableDefaultRequest: true,
  autoInit: false
});
```

### 2. 完整的知识词典示例

```typescript
// use-knowledge-dictionary-simple.ts
import { useDictionary } from '@ad-audit/range-sdk-plugin-dictionary';
import { RangeSdkAppId } from '@ad-audit/range-sdk';
import DictionaryCard from '../components/dictionary-card/index.vue';

export const useKnowledgeDictionarySimple = (options: {
  containerRef: Ref<HTMLElement>;
  words: string[];
  knowledgeInfos: Ref<KnowledgePoint[]>;
}) => {

  // ✅ 无需任何 Enhanced 包装，直接使用原生支持
  const dictionaryHook = useDictionary({
    appid: RangeSdkAppId.PMS,
    container: options.containerRef.value,

    customCardComponent: DictionaryCard,

    // ✅ 原生传递自定义属性
    customCardComponentProps: {
      // 传递知识库信息
      knowledgeInfos: options.knowledgeInfos,

      // UI 自定义
      customClass: 'knowledge-dictionary-card',

      // 功能配置
      showAdvancedFeatures: true,
      enableSearch: true,

      // 主题配置
      theme: 'auto',
      colorScheme: 'blue'
    },

    autoInit: false,
    disableDefaultRequest: true
  });

  return dictionaryHook;
};
```

### 3. 自定义组件如何接收参数

```vue
<!-- MyCustomCard.vue -->
<template>
  <div class="my-custom-card" :class="themeClass">
    <div class="card-header">
      <h3>{{ customTitle || '词典' }}</h3>
      <span class="subtitle">{{ subtitle }}</span>
    </div>

    <div class="card-body">
      <!-- ✅ 使用系统传递的keywords -->
      <div class="keywords-section">
        <h4>关键词 ({{ keywords.length }})</h4>
        <div v-for="keyword in keywords" :key="keyword">
          {{ keyword }}
          <!-- ✅ 使用系统传递的dataLoader -->
          <button @click="loadData(keyword)" v-if="dataLoader">
            加载数据
          </button>
        </div>
      </div>

      <!-- ✅ 使用自定义属性knowledgeInfos -->
      <div class="knowledge-section" v-if="knowledgeInfos">
        <h4>知识库信息</h4>
        <div v-for="info in knowledgeInfos" :key="info.id">
          {{ info.title }}
        </div>
      </div>

      <!-- ✅ 使用自定义UI配置 -->
      <div class="actions" v-if="showActions">
        <button @click="exportData">{{ exportText || '导出' }}</button>
        <button @click="shareContent">{{ shareText || '分享' }}</button>
      </div>
    </div>

    <!-- ✅ 使用系统事件 -->
    <button @click="onClose" class="close-btn">关闭</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// ✅ 组件Props接口 - 系统参数 + 自定义参数
interface Props {
  // 系统传递的参数
  keywords: string[];
  dataLoader?: (keyword: string) => Promise<any>;
  onClose: () => void;

  // 自定义参数（通过customCardComponentProps传递）
  theme?: 'light' | 'dark' | 'auto';
  customTitle?: string;
  subtitle?: string;
  showActions?: boolean;
  exportText?: string;
  shareText?: string;
  knowledgeInfos?: KnowledgePoint[];
  debugMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  showActions: true,
  debugMode: false
});

// 计算属性
const themeClass = computed(() => `theme-${props.theme}`);

// 方法
const loadData = async (keyword: string) => {
  if (props.dataLoader) {
    const data = await props.dataLoader(keyword);
    console.log('加载的数据:', data);
  }
};

const exportData = () => {
  console.log('导出数据:', props.keywords);
};

const shareContent = () => {
  console.log('分享内容:', props.keywords);
};

// 调试信息
if (props.debugMode) {
  console.log('自定义卡片Props:', props);
}
</script>

<style scoped>
.theme-dark {
  background: #2a2a2a;
  color: white;
}

.theme-light {
  background: white;
  color: #333;
}

.theme-auto {
  @media (prefers-color-scheme: dark) {
    background: #2a2a2a;
    color: white;
  }
}
</style>
```

## 🚀 核心优势

### 1. **无需封装**
```typescript
// ❌ 之前需要手动Enhanced封装
const createEnhancedCard = (props) => defineComponent({ /* 复杂封装逻辑 */ });

// ✅ 现在原生支持
customCardComponentProps: { theme: 'dark', size: 'large' }
```

### 2. **类型安全**
- 自动类型推断
- TypeScript编译期检查
- IntelliSense支持

### 3. **响应式支持**
```typescript
// ✅ 响应式数据直接传递
customCardComponentProps: {
  knowledgeInfos: knowledgeInfosRef, // Ref会保持响应性
  userPreferences: userPrefsComputed  // Computed也能正常工作
}
```

### 4. **参数优先级**
- 系统参数：`keywords`, `dataLoader`, `onClose` (优先级最高)
- 自定义参数：`customCardComponentProps` 中的属性
- 系统参数不会被覆盖，确保功能正常

### 5. **调试友好**
```typescript
customCardComponentProps: {
  debugMode: true, // 开启调试输出
  logLevel: 'verbose'
}
```

## 🔄 迁移指南

### 从Enhanced包装迁移到原生支持

```typescript
// ❌ 旧方式 - 手动Enhanced包装
const enhancedCard = createDictionaryCard({
  keywords: words,
  knowledgeInfos,
  theme: 'dark'
});

dictionaryHook = useDictionary({
  customCardComponent: enhancedCard // 包装后的组件
});

// ✅ 新方式 - 原生支持
dictionaryHook = useDictionary({
  customCardComponent: DictionaryCard, // 原始组件
  customCardComponentProps: {         // 原生属性传递
    knowledgeInfos,
    theme: 'dark'
  }
});
```

## 📋 兼容性说明

- ✅ 完全向后兼容
- ✅ 现有代码无需修改
- ✅ 新旧方式可以共存
- ✅ 类型检查增强

## 🎯 最佳实践

1. **优先使用原生支持**：新项目直接使用 `customCardComponentProps`
2. **保持系统参数纯净**：不要在自定义组件中修改 `keywords`, `dataLoader`, `onClose`
3. **合理使用响应式**：直接传递 Ref 对象保持响应性
4. **类型定义完整**：为自定义组件定义完整的 Props 接口

现在你可以直接在 `use-knowledge-dictionary.ts` 中使用这个原生功能了！