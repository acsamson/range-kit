<template>
  <section class="search-filter-bar">
    <!-- 搜索输入区域 -->
    <div class="filter-input-group">
      <span class="filter-icon">🔍</span>
      <input
        v-model="inputValue"
        type="text"
        class="filter-input"
        :placeholder="t.searchHighlight.placeholder"
        @keydown.enter="handleAddKeyword"
        :disabled="!isInitialized"
      />
      <button
        class="filter-add-btn"
        @click="handleAddKeyword"
        :disabled="!isInitialized || !inputValue.trim()"
        :title="t.searchHighlight.addKeyword"
      >
        +
      </button>
    </div>

    <!-- Dictionary Card Config -->
    <div class="dictionary-config-inline">
      <label class="config-toggle-inline">
        <input type="checkbox" v-model="dictionaryCardEnabled" />
        <span>{{ t.searchHighlight.dictionaryCard }}</span>
      </label>
      <select
        v-model="dictionaryTriggerAction"
        class="config-select-inline"
        :disabled="!dictionaryCardEnabled"
      >
        <option value="hover">{{ t.interactionModes.hover }}</option>
        <option value="click">{{ t.interactionModes.click }}</option>
        <option value="dblclick">{{ t.interactionModes.dblclick }}</option>
        <option value="contextmenu">{{ t.interactionModes.contextmenu }}</option>
      </select>
      <button
        class="config-expand-btn"
        @click="showDictionaryConfig = !showDictionaryConfig"
        :class="{ active: showDictionaryConfig }"
        :disabled="!dictionaryCardEnabled"
        :title="t.searchHighlight.expandConfig"
      >
        ⚙️
      </button>
    </div>

    <!-- Dictionary Card Detailed Config -->
    <div v-if="showDictionaryConfig && dictionaryCardEnabled" class="dictionary-config-panel">
      <div class="config-item">
        <label class="config-label">{{ t.searchHighlight.cardTitle }}</label>
        <input
          type="text"
          v-model="dictionaryCardTitle"
          class="config-input"
        />
      </div>

      <div class="config-item config-item-vertical">
        <label class="config-label">{{ t.searchHighlight.contentTemplate }}</label>
        <textarea
          v-model="dictionaryCardContent"
          class="config-textarea"
          :placeholder="t.searchHighlight.contentPlaceholder"
          rows="2"
        ></textarea>
      </div>

      <label class="config-checkbox-label">
        <input type="checkbox" v-model="showKeywordInCard" />
        <span>{{ t.searchHighlight.showKeywordInCard }}</span>
      </label>
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

    <!-- Search Options -->
    <div class="filter-options">
      <label class="filter-option">
        <input type="checkbox" v-model="caseSensitive" />
        <span>{{ t.searchHighlight.caseSensitive }}</span>
      </label>
      <label class="filter-option">
        <input type="checkbox" v-model="wholeWord" />
        <span>{{ t.searchHighlight.wholeWord }}</span>
      </label>
      <label class="filter-option" :title="t.searchHighlight.skipOverlap">
        <input type="checkbox" v-model="skipOverlap" />
        <span>{{ t.searchHighlight.skipOverlap }}</span>
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
          :title="t.searchHighlight.remove"
        >
          ×
        </button>
      </div>

      <!-- Clear All Button -->
      <button
        class="filter-clear-btn"
        @click="handleClearAll"
        :title="t.common.clearAll"
      >
        {{ t.common.clear }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue'
import { messages, type Locale } from '../../../common/i18n'

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
  /** 是否初始化 */
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
  /** Locale */
  locale: {
    type: String as PropType<Locale>,
    default: 'en'
  }
})

// Translation messages based on locale
const t = computed(() => messages[props.locale])

/**
 * 词典卡片配置接口
 */
export interface DictionaryCardConfig {
  enabled: boolean
  triggerAction: 'hover' | 'click' | 'dblclick' | 'contextmenu'
  /** 卡片标题 */
  title: string
  /** 卡片内容模板，可使用 {{keyword}} 作为占位符 */
  contentTemplate: string
  /** 是否在卡片中显示关键词 */
  showKeyword: boolean
}

/**
 * 组件事件定义
 */
const emit = defineEmits<{
  /** 添加关键词（包含类型） */
  (e: 'add-keyword', keyword: string, type: string, options: { caseSensitive: boolean; wholeWord: boolean; skipOverlap: boolean }): void
  /** 移除关键词 */
  (e: 'remove-keyword', keyword: string): void
  /** 清除所有关键词 */
  (e: 'clear-all'): void
  /** 词典卡片配置变更 */
  (e: 'dictionary-config-change', config: DictionaryCardConfig): void
}>()

// 输入框的值
const inputValue = ref('')
// 选中的高亮类型
const selectedType = ref('search')
// 是否区分大小写
const caseSensitive = ref(false)
// 是否全词匹配
const wholeWord = ref(false)
// 是否避开重叠选区
const skipOverlap = ref(false)
// 是否显示词典配置面板
const showDictionaryConfig = ref(false)
// 是否启用词典卡片
const dictionaryCardEnabled = ref(true)
// 词典卡片触发动作
const dictionaryTriggerAction = ref<'hover' | 'click' | 'dblclick' | 'contextmenu'>('hover')
// 词典卡片标题
const dictionaryCardTitle = ref('词典释义')
// 词典卡片内容模板
const dictionaryCardContent = ref('"{{keyword}}" 的释义将显示在这里')
// 是否在卡片中显示关键词
const showKeywordInCard = ref(true)

// 监听词典配置变化并发出事件
watch(
  [dictionaryCardEnabled, dictionaryTriggerAction, dictionaryCardTitle, dictionaryCardContent, showKeywordInCard],
  ([enabled, action, title, content, showKeyword]) => {
    emit('dictionary-config-change', {
      enabled,
      triggerAction: action,
      title: title || '词典释义',
      contentTemplate: content || '',
      showKeyword
    })
  },
  { immediate: true }
)

// 初始化：确保选中的类型在可用类型中
watch(
  () => props.availableTypes,
  (newTypes) => {
    // 如果当前选中的类型不在可用类型中，使用第一个可用类型
    if (newTypes?.length > 0 && !newTypes.some(t => t.type === selectedType.value)) {
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
    wholeWord: wholeWord.value,
    skipOverlap: skipOverlap.value
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

/* 词典卡片配置 - 紧凑行内布局 */
.dictionary-config-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 12px;
  border-left: 1px solid #e5e7eb;
}

.config-toggle-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  white-space: nowrap;
}

.config-toggle-inline input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #2563eb;
}

.config-select-inline {
  padding: 4px 6px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #f9fafb;
  font-size: 11px;
  color: #374151;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

.config-select-inline:focus {
  border-color: #6b7280;
}

.config-select-inline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.config-expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.config-expand-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.config-expand-btn.active {
  background: #dbeafe;
  border-color: #3b82f6;
}

.config-expand-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 词典卡片配置面板 */
.dictionary-config-panel {
  width: 100%;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin-top: 4px;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.config-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.config-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
}

.config-toggle input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #2563eb;
}

.config-content {
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.config-label {
  font-size: 12px;
  color: #374151;
  white-space: nowrap;
}

.config-select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

.config-select:focus {
  border-color: #6b7280;
}

.config-hint {
  margin: 8px 0 0 0;
  padding: 8px;
  background: #fef3c7;
  border-radius: 4px;
  font-size: 11px;
  color: #92400e;
  line-height: 1.4;
}

/* 卡片内容配置区块 */
.config-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
}

.config-section-title {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
}

.config-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  color: #374151;
  outline: none;
  transition: border-color 0.15s;
}

.config-input:focus {
  border-color: #6b7280;
}

.config-item-vertical {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}

.config-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  color: #374151;
  resize: vertical;
  min-height: 60px;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
  line-height: 1.4;
}

.config-textarea:focus {
  border-color: #6b7280;
}

.config-textarea::placeholder {
  color: #9ca3af;
}

.config-checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
}

.config-checkbox-label input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #2563eb;
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

  .dictionary-config-panel {
    margin-top: 8px;
  }
}
</style>
