<!--
  字典配置面板组件
  提供触发方式、渲染模板等配置选项
-->
<template>
  <div class="config-panel">
    <div class="panel-header">
      <h3 class="panel-title">词典配置</h3>
    </div>

    <div class="config-sections">
      <!-- 触发方式配置 -->
      <div class="config-section">
        <h4 class="section-title">触发方式</h4>
        <div class="inline-options">
          <label class="inline-radio">
            <input
              type="radio"
              name="triggerMode"
              value="hover"
              :checked="localConfig.triggerMode === 'hover'"
              @change="updateTriggerMode('hover')"
            >
            <span class="inline-label">悬停</span>
          </label>
          <label class="inline-radio">
            <input
              type="radio"
              name="triggerMode"
              value="click"
              :checked="localConfig.triggerMode === 'click'"
              @change="updateTriggerMode('click')"
            >
            <span class="inline-label">点击</span>
          </label>
        </div>
      </div>

      <!-- 卡片样式配置 -->
      <div class="config-section">
        <h4 class="section-title">卡片样式</h4>
        <div class="inline-options">
          <label class="inline-radio">
            <input
              type="radio"
              name="cardStyle"
              value="default"
              :checked="localConfig.cardStyle === 'default'"
              @change="updateCardStyle('default')"
            >
            <span class="inline-label">标准</span>
          </label>
          <label class="inline-radio">
            <input
              type="radio"
              name="cardStyle"
              value="custom"
              :checked="localConfig.cardStyle === 'custom'"
              @change="updateCardStyle('custom')"
            >
            <span class="inline-label">Range-Kit</span>
          </label>
        </div>
      </div>

      <!-- 高亮样式配置 -->
      <div class="config-section">
        <h4 class="section-title">高亮样式</h4>
        <div class="compact-grid">
          <div class="grid-item">
            <label class="compact-label">颜色</label>
            <div class="color-group">
              <input
                type="color"
                :value="localConfig.highlightColor"
                @change="updateHighlightColor($event.target.value)"
                class="color-input"
              >
              <span class="color-code">{{ localConfig.highlightColor.toUpperCase() }}</span>
            </div>
          </div>
          <div class="grid-item">
            <label class="compact-checkbox">
              <input
                type="checkbox"
                :checked="localConfig.showUnderline"
                @change="updateTemplateOption('showUnderline', $event.target.checked)"
              >
              <span class="compact-label">下划线</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 搜索配置 -->
      <div class="config-section">
        <h4 class="section-title">搜索配置</h4>
        <div class="inline-options">
          <label class="compact-checkbox">
            <input
              type="checkbox"
              :checked="localConfig.caseSensitive"
              @change="updateTemplateOption('caseSensitive', $event.target.checked)"
            >
            <span class="compact-label">区分大小写</span>
          </label>
        </div>
        <div class="config-hint">
          <small class="hint-text">
            启用后，搜索 "QA" 只会匹配 "QA"，不会匹配 "qa" 或 "Qa"
          </small>
        </div>
      </div>
    </div>

    <!-- 配置预览 -->
    <div class="config-preview">
      <h4 class="section-title">配置预览</h4>
      <div class="preview-content">
        <code class="config-code">{{ JSON.stringify(localConfig, null, 2) }}</code>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="config-actions">
      <button
        class="save-config-btn"
        :disabled="!hasChanges"
        @click="saveConfig"
      >
        保存配置
      </button>

      <button
        class="reset-config-btn"
        @click="resetConfig"
      >
        重置为默认
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import type { TriggerMode } from '../../../../../plugins/dictionary/hooks/use-dictionary'

// 卡片样式类型
export type CardStyle = 'default' | 'custom'

// 配置接口定义
export interface DictionaryConfig {
  triggerMode: TriggerMode
  cardStyle: CardStyle
  highlightColor: string
  showUnderline: boolean
  caseSensitive: boolean
}

// 默认配置
const defaultConfig: DictionaryConfig = {
  triggerMode: 'hover',
  cardStyle: 'default',
  highlightColor: '#3370ff',
  showUnderline: true,
  caseSensitive: false
}

// Props & Emits
const props = defineProps<{
  modelValue?: DictionaryConfig
}>()

const emit = defineEmits<{
  'update:modelValue': [config: DictionaryConfig]
  'save': [config: DictionaryConfig]
}>()

// 本地配置状态
const localConfig = reactive<DictionaryConfig>({ ...defaultConfig })

// 从 localStorage 加载配置
const loadConfigFromStorage = (): DictionaryConfig => {
  try {
    const stored = localStorage.getItem('range-sdk-dictionary-config')
    if (stored) {
      const config = JSON.parse(stored)
      return { ...defaultConfig, ...config }
    }
  } catch (error) {
    console.warn('加载配置失败，使用默认配置:', error)
  }
  return { ...defaultConfig }
}

// 保存配置到 localStorage
const saveConfigToStorage = (config: DictionaryConfig) => {
  try {
    localStorage.setItem('range-sdk-dictionary-config', JSON.stringify(config))
  } catch (error) {
    console.error('保存配置失败:', error)
  }
}

// 检查是否有变更
const hasChanges = computed(() => {
  const current = JSON.stringify(localConfig)
  const original = JSON.stringify(props.modelValue || defaultConfig)
  return current !== original
})

// 更新触发方式
const updateTriggerMode = (mode: TriggerMode) => {
  localConfig.triggerMode = mode
}

// 更新卡片样式
const updateCardStyle = (style: CardStyle) => {
  localConfig.cardStyle = style
}

// 更新模板选项
const updateTemplateOption = (key: keyof DictionaryConfig, value: boolean) => {
  ;(localConfig as any)[key] = value
}

// 更新高亮颜色
const updateHighlightColor = (color: string) => {
  localConfig.highlightColor = color
}

// 保存配置
const saveConfig = () => {
  // 保存到 localStorage
  saveConfigToStorage(localConfig)

  // 触发父组件事件
  emit('update:modelValue', { ...localConfig })
  emit('save', { ...localConfig })

  // 立即刷新页面，不显示倒计时
  refreshNow()
}

// 重置配置
const resetConfig = () => {
  Object.assign(localConfig, defaultConfig)
}

// 立即刷新页面
const refreshNow = () => {
  // 添加配置参数到 URL
  const url = new URL(window.location.href)
  url.searchParams.set('triggerMode', localConfig.triggerMode)
  url.searchParams.set('config', btoa(JSON.stringify(localConfig)))

  window.location.href = url.toString()
}

// 监听配置变化
watch(
  () => props.modelValue,
  (newConfig) => {
    if (newConfig) {
      Object.assign(localConfig, newConfig)
    }
  },
  { deep: true, immediate: true }
)

// 组件挂载时加载配置
onMounted(() => {
  const storedConfig = loadConfigFromStorage()
  Object.assign(localConfig, storedConfig)

  // 同步到父组件
  emit('update:modelValue', { ...localConfig })
})
</script>

<style scoped>
.config-panel {
  background: #fff;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.panel-header {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e1e5e9;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2329;
}

.config-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-section {
  padding: 12px;
  background: #f7f8fa;
  border-radius: 4px;
  border: 1px solid #e1e5e9;
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #1d2329;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 内联选项样式 */
.inline-options {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.inline-radio {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #e1e5e9;
  background: #fff;
  transition: all 0.2s;
  min-width: 80px;
  justify-content: center;
}

.inline-radio:hover {
  border-color: #4f46e5;
  background: #f8faff;
}

.inline-radio input[type="radio"]:checked + .inline-label {
  color: #4f46e5;
  font-weight: 600;
}

.inline-radio input[type="radio"]:checked {
  accent-color: #4f46e5;
}

.inline-label {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
  white-space: nowrap;
}


/* 紧凑网格布局 */
.compact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: center;
}

.grid-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.compact-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.color-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 32px;
  height: 32px;
  border: 1px solid #e1e5e9;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}

.color-code {
  font-size: 11px;
  color: #6b7280;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-weight: 500;
}

.compact-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 0;
}

.compact-checkbox input[type="checkbox"] {
  accent-color: #4f46e5;
}

.compact-checkbox input[type="checkbox"]:checked + .compact-label {
  color: #4f46e5;
  font-weight: 600;
}

/* 配置预览 */
.config-preview {
  margin-top: 16px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 4px;
  border: 1px solid #e1e5e9;
}

.preview-content {
  margin-top: 6px;
}

.config-code {
  display: block;
  background: #1d2329;
  color: #e6e8eb;
  padding: 8px 10px;
  border-radius: 3px;
  font-size: 11px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  white-space: pre;
  overflow-x: auto;
  line-height: 1.4;
}

/* 操作按钮 */
.config-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e1e5e9;
}

.save-config-btn,
.reset-config-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.save-config-btn {
  background: #4f46e5;
  color: white;
  border: none;
  flex: 1;
}

.save-config-btn:hover:not(:disabled) {
  background: #4338ca;
}

.save-config-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.reset-config-btn {
  background: #fff;
  color: #6b7280;
  border: 1px solid #d1d5db;
  min-width: 80px;
}

.reset-config-btn:hover {
  background: #f9fafb;
  color: #374151;
  border-color: #9ca3af;
}

/* 配置提示文本 */
.config-hint {
  margin-top: 8px;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 3px;
  border-left: 3px solid #6b7280;
}

.hint-text {
  color: #6b7280;
  font-size: 11px;
  line-height: 1.4;
  font-style: italic;
}

</style>