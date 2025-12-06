<template>
  <section class="search-filter-bar">
    <!-- 搜索输入区域 -->
    <div class="filter-input-group">
      <span class="filter-icon">🔍</span>
      <input
        v-model="inputValue"
        type="text"
        class="filter-input"
        placeholder="搜索关键词..."
        @keydown.enter="handleAddKeyword"
        :disabled="!isInitialized"
      />
      <button
        class="filter-add-btn"
        @click="handleAddKeyword"
        :disabled="!isInitialized || !inputValue.trim()"
        title="添加关键词"
      >
        +
      </button>
    </div>

    <!-- 高亮类型选择 -->
    <div class="filter-type-selector" v-if="availableTypes.length > 0">
      <select
        v-model="selectedType"
        class="type-select"
        :disabled="!isInitialized"
      >
        <option
          v-for="typeConfig in availableTypes"
          :key="typeConfig.type"
          :value="typeConfig.type"
        >
          {{ typeConfig.label }}
        </option>
      </select>
      <span
        class="type-color-dot"
        :style="{ backgroundColor: currentTypeColor }"
      ></span>
    </div>

    <!-- 搜索选项 -->
    <div class="filter-options">
      <label class="filter-option">
        <input type="checkbox" v-model="caseSensitive" />
        <span>区分大小写</span>
      </label>
      <label class="filter-option">
        <input type="checkbox" v-model="wholeWord" />
        <span>全词匹配</span>
      </label>
    </div>

    <!-- 关键词标签列表 -->
    <div class="filter-tags" v-if="keywords.length > 0">
      <div
        v-for="item in keywordResults"
        :key="item.keyword"
        class="filter-tag"
        :class="{ 'has-matches': item.matchCount > 0 }"
        :style="getTagStyle(item)"
      >
        <span
          class="tag-type-dot"
          :style="{ backgroundColor: getTypeColorByKeyword(item.keyword) }"
        ></span>
        <span class="tag-text">{{ item.keyword }}</span>
        <span class="tag-count" v-if="item.matchCount > 0">
          {{ item.matchCount }}
        </span>
        <button
          class="tag-remove"
          @click="handleRemoveKeyword(item.keyword)"
          title="移除"
        >
          ×
        </button>
      </div>

      <!-- 清除全部按钮 -->
      <button
        class="filter-clear-btn"
        @click="handleClearAll"
        title="清除全部"
      >
        清除
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue'

/**
 * 类型配置接口
 */
interface TypeConfig {
  type: string
  label: string
  style?: {
    backgroundColor?: string
    textDecorationColor?: string
  }
}

/**
 * 关键词结果接口（扩展类型信息）
 */
interface KeywordResult {
  keyword: string
  matchCount: number
  type?: string
}

/**
 * 搜索高亮组件的属性定义
 */
const props = defineProps({
  /** SDK是否初始化 */
  isInitialized: {
    type: Boolean,
    required: true
  },
  /** 当前关键词列表 */
  keywords: {
    type: Array as PropType<string[]>,
    required: true
  },
  /** 关键词搜索结果（包含匹配数量和类型） */
  keywordResults: {
    type: Array as PropType<KeywordResult[]>,
    required: true
  },
  /** 可用的高亮类型 */
  availableTypes: {
    type: Array as PropType<TypeConfig[]>,
    required: true
  },
  /** 获取类型配置的函数 */
  getTypeConfig: {
    type: Function as PropType<(type: string) => TypeConfig | undefined>,
    required: true
  },
  /** 默认选中的类型（可选，用于与划词选区同步） */
  defaultType: {
    type: String,
    default: undefined
  }
})

/**
 * 组件事件定义
 */
const emit = defineEmits<{
  /** 添加关键词（包含类型） */
  (e: 'add-keyword', keyword: string, type: string, options: { caseSensitive: boolean; wholeWord: boolean }): void
  /** 移除关键词 */
  (e: 'remove-keyword', keyword: string): void
  /** 清除所有关键词 */
  (e: 'clear-all'): void
}>()

// 输入框的值
const inputValue = ref('')
// 选中的高亮类型
const selectedType = ref('search')
// 是否区分大小写
const caseSensitive = ref(false)
// 是否全词匹配
const wholeWord = ref(false)

// 初始化和监听 defaultType / availableTypes 变化
watch(
  [() => props.defaultType, () => props.availableTypes],
  ([newDefaultType, newTypes]) => {
    // 优先使用 defaultType
    if (newDefaultType && newTypes?.some(t => t.type === newDefaultType)) {
      selectedType.value = newDefaultType
    } else if (newTypes?.length > 0 && !newTypes.some(t => t.type === selectedType.value)) {
      // 如果当前选中的类型不在可用类型中，使用第一个可用类型
      selectedType.value = newTypes[0].type
    }
  },
  { immediate: true }
)

/**
 * 当前选中类型的颜色
 */
const currentTypeColor = computed(() => {
  const config = props.getTypeConfig(selectedType.value)
  return config?.style?.backgroundColor || config?.style?.textDecorationColor || '#2196f3'
})

/**
 * 根据关键词获取其类型颜色
 */
const getTypeColorByKeyword = (keyword: string): string => {
  const result = props.keywordResults.find(r => r.keyword === keyword)
  if (result?.type) {
    const config = props.getTypeConfig(result.type)
    return config?.style?.backgroundColor || config?.style?.textDecorationColor || '#2196f3'
  }
  return '#2196f3'
}

/**
 * 获取标签样式（根据类型）
 */
const getTagStyle = (item: KeywordResult) => {
  if (item.matchCount > 0 && item.type) {
    const config = props.getTypeConfig(item.type)
    if (config?.style?.backgroundColor) {
      return {
        backgroundColor: config.style.backgroundColor + '40', // 添加透明度
        borderColor: config.style.backgroundColor
      }
    }
  }
  return {}
}

/**
 * 处理添加关键词
 */
const handleAddKeyword = () => {
  const keyword = inputValue.value.trim()
  if (!keyword) return

  // 检查是否已存在
  if (props.keywords.includes(keyword)) {
    inputValue.value = ''
    return
  }

  emit('add-keyword', keyword, selectedType.value, {
    caseSensitive: caseSensitive.value,
    wholeWord: wholeWord.value
  })

  // 清空输入框
  inputValue.value = ''
}

/**
 * 处理移除关键词
 */
const handleRemoveKeyword = (keyword: string) => {
  emit('remove-keyword', keyword)
}

/**
 * 处理清除全部关键词
 */
const handleClearAll = () => {
  emit('clear-all')
}
</script>

<style scoped>
/* 搜索筛选栏 - 水平布局 */
.search-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  flex-wrap: wrap;
}

/* 搜索输入组 */
.filter-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0 4px 0 10px;
  min-width: 200px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.filter-input-group:focus-within {
  border-color: #6b7280;
  box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.1);
}

.filter-icon {
  font-size: 14px;
  color: #9ca3af;
  flex-shrink: 0;
}

.filter-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 0;
  font-size: 13px;
  color: #1f2937;
  outline: none;
  min-width: 120px;
}

.filter-input::placeholder {
  color: #9ca3af;
}

.filter-input:disabled {
  cursor: not-allowed;
}

.filter-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: #2563eb;
  color: white;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.filter-add-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.filter-add-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

/* 类型选择器 */
.filter-type-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 12px;
  border-left: 1px solid #e5e7eb;
}

.type-select {
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #f9fafb;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

.type-select:focus {
  border-color: #6b7280;
}

.type-select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.type-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 搜索选项 */
.filter-options {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 12px;
  border-left: 1px solid #e5e7eb;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
}

.filter-option input[type="checkbox"] {
  width: 13px;
  height: 13px;
  cursor: pointer;
  accent-color: #2563eb;
}

/* 关键词标签 */
.filter-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-left: 12px;
  border-left: 1px solid #e5e7eb;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  font-size: 12px;
  color: #374151;
  transition: all 0.15s;
}

.filter-tag.has-matches {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #065f46;
}

.tag-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-text {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-count {
  background: #10b981;
  color: white;
  padding: 0 5px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.15s;
  line-height: 1;
}

.tag-remove:hover {
  background: #e5e7eb;
  color: #374151;
}

.filter-tag.has-matches .tag-remove:hover {
  background: #a7f3d0;
  color: #065f46;
}

/* 清除全部按钮 */
.filter-clear-btn {
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.filter-clear-btn:hover {
  background: #fee2e2;
  color: #dc2626;
  font-weight: bold;
}

/* 响应式：小屏幕时换行 */
@media (max-width: 768px) {
  .search-filter-bar {
    padding: 12px;
    flex-direction: column;
    align-items: stretch;
  }

  .filter-input-group {
    flex: 1;
    min-width: 100%;
  }

  .filter-options {
    padding-left: 0;
    border-left: none;
    width: 100%;
    justify-content: flex-start;
  }

  .filter-tags {
    padding-left: 0;
    border-left: none;
    width: 100%;
    margin-top: 4px;
  }
  
  .filter-type-selector {
    padding-left: 0;
    border-left: none;
  }
}
</style>
