<template>
  <div class="enhanced-demo-card" :class="themeClass">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="header-content">
        <div class="card-icon">{{ icon || '🎨' }}</div>
        <div class="header-text">
          <h3 class="card-title">{{ customTitle || '🎨 自定义词典卡片' }}</h3>
          <span class="card-subtitle">{{ subtitle || '✨ 这是增强的自定义组件 ✨' }}</span>
        </div>
      </div>
      <button class="close-btn" @click="handleClose" title="关闭卡片">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- 简化的内容展示 -->
    <div class="card-body">
      <div class="simple-content">
        <h4 class="keywords-title">{{ keywordsTitle || '📚 词汇列表' }}</h4>
        <div class="keywords-list">
          <div v-for="(keyword, index) in keywords" :key="keyword" class="keyword-item">
            <span class="keyword-badge">{{ index + 1 }}</span>
            <span class="keyword-text">{{ keyword }}</span>
            <button v-if="showLoadButton" @click="loadData(keyword)" class="load-btn" :disabled="loading">
              {{ loading ? '加载中...' : '加载' }}
            </button>
          </div>
        </div>

        <!-- 数据展示区域 -->
        <div class="data-display" v-if="showDataSection">
          <h4 class="data-title">📊 词典数据展示</h4>
          <div class="data-section">
            <h5 class="section-label">Keywords 列表:</h5>
            <pre class="json-display">{{ JSON.stringify(keywords, null, 2) }}</pre>
          </div>
          <div class="data-section" v-if="loadedData.length > 0">
            <h5 class="section-label">加载的词典数据:</h5>
            <pre class="json-display">{{ JSON.stringify(loadedData, null, 2) }}</pre>
          </div>
          <div class="data-section" v-if="loading">
            <p class="loading-text">🔄 正在加载数据...</p>
          </div>
        </div>

        <!-- 自定义动作区域 -->
        <div class="custom-actions" v-if="showActions">
          <button @click="handleCustomAction('export')" class="action-btn">
            📤 {{ exportText || '导出' }}
          </button>
          <button @click="handleCustomAction('share')" class="action-btn">
            🔗 {{ shareText || '分享' }}
          </button>
        </div>

        <div class="demo-info">
          <p class="demo-text">
            🎨 这是增强版的词典卡片组件
          </p>
          <p class="demo-text">
            ✨ 支持自定义主题：{{ theme }}
          </p>
          <p class="demo-text">
            🛠️ 自定义参数已生效
          </p>
          <p class="demo-text" v-if="debugMode">
            🐛 调试模式已开启
          </p>
        </div>
      </div>
    </div>

    <!-- 卡片底部 -->
    <div class="card-footer">
      <div class="footer-info">
        <span class="powered-by">{{ footerText || 'Powered by Range SDK' }}</span>
        <span class="keyword-count">{{ keywords.length }} 个词汇</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { WordData } from '../../../hooks';

// 基础系统Props
interface BaseProps {
  keywords: string[]
  dataLoader?: (keyword: string) => Promise<WordData | null>
  onClose?: () => void
}

// 自定义增强Props
interface CustomProps {
  theme?: 'light' | 'dark' | 'auto'
  customTitle?: string
  subtitle?: string
  icon?: string
  keywordsTitle?: string
  footerText?: string
  showLoadButton?: boolean
  showDataSection?: boolean
  showActions?: boolean
  exportText?: string
  shareText?: string
  debugMode?: boolean
}

// 完整Props类型
interface Props extends BaseProps, Partial<CustomProps> {}

// Props默认值
const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  showLoadButton: true,
  showDataSection: true,
  showActions: false,
  debugMode: false
})

// Emits
const emit = defineEmits<{
  close: []
  customAction: [action: string, data?: any]
}>()

// 响应式数据
const loading = ref(false)
const loadedData = ref<Array<{ keyword: string; data: WordData | null }>>([])

// 计算属性
const themeClass = computed(() => {
  if (props.theme === 'auto') {
    return 'theme-auto'
  }
  return `theme-${props.theme}`
})

// 方法
const handleClose = () => {
  console.log('增强组件关闭')
  emit('close')
  // 如果有系统的onClose回调，也调用它
  props.onClose?.()
}

const loadData = async (keyword: string) => {
  if (!props.dataLoader || loading.value) return

  loading.value = true
  try {
    console.log(`加载关键词"${keyword}"的数据`)
    const data = await props.dataLoader(keyword)
    loadedData.value.push({ keyword, data })
    console.log(`关键词"${keyword}"数据加载完成:`, data)
  } catch (error) {
    console.error(`加载关键词"${keyword}"失败:`, error)
  } finally {
    loading.value = false
  }
}

const handleCustomAction = (action: string) => {
  const actionData = {
    action,
    keywords: props.keywords,
    loadedData: loadedData.value,
    timestamp: Date.now()
  }

  console.log('自定义动作:', actionData)
  emit('customAction', action, actionData)
}

// 组件挂载时的调试信息
onMounted(() => {
  if (props.debugMode) {
    console.log('增强词典卡片组件已挂载')
    console.log('接收到的Props:', props)
    console.log('Keywords:', props.keywords)
    console.log('是否有数据加载器:', !!props.dataLoader)
  }

  // 自动加载数据（如果开启了数据展示）
  if (props.showDataSection && props.dataLoader) {
    loadAllData()
  }
})

// 加载所有关键词的数据
const loadAllData = async () => {
  if (!props.dataLoader || props.keywords.length === 0) return

  loading.value = true
  loadedData.value = []

  try {
    console.log('开始批量加载词典数据，关键词：', props.keywords)

    const promises = props.keywords.map(async (keyword) => {
      try {
        const data = await props.dataLoader!(keyword)
        return { keyword, data }
      } catch (error) {
        console.error(`加载词汇 "${keyword}" 数据失败:`, error)
        return { keyword, data: null }
      }
    })

    const results = await Promise.all(promises)
    loadedData.value = results

    console.log('词典数据批量加载完成：', results)
  } catch (error) {
    console.error('批量加载词典数据失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.enhanced-demo-card {
  background: linear-gradient(145deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(102, 126, 234, 0.2),
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-width: 380px;
  max-width: 500px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  border: 2px solid #667eea;
  position: relative;
  transform: translateX(8px);
}

/* 主题样式 */
.theme-dark {
  background: linear-gradient(145deg, #2d3748 0%, #1a202c 100%);
  border-color: #4299e1;
  color: #e2e8f0;
}

.theme-dark .card-header {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
}

.theme-dark .demo-info {
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  border-left-color: #4299e1;
}

.theme-auto {
  /* 自动主题根据系统设置 */
  @media (prefers-color-scheme: dark) {
    background: linear-gradient(145deg, #2d3748 0%, #1a202c 100%);
    border-color: #4299e1;
    color: #e2e8f0;
  }
}

/* 卡片主体 */
.card-body {
  padding: 24px;
}

.simple-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.keywords-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 8px;
}

.keywords-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.keyword-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.keyword-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.keyword-text {
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  flex: 1;
}

.load-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.load-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.load-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 自定义动作区域 */
.custom-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.action-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.demo-info {
  background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #667eea;
}

.demo-text {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #495057;
}

.demo-text:last-child {
  margin-bottom: 0;
}

/* 卡片头部 */
.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  font-size: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px;
  line-height: 1;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}

.card-subtitle {
  font-size: 13px;
  opacity: 0.8;
  font-weight: 400;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

/* 卡片底部 */
.card-footer {
  background: #f8f9fa;
  padding: 12px 20px;
  border-top: 1px solid #e9ecef;
}

.footer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6c757d;
}

.powered-by {
  font-weight: 500;
}

.keyword-count {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

/* 数据展示样式 */
.data-display {
  margin-top: 20px;
  background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%);
  border: 1px solid #e3e6f0;
  border-radius: 8px;
  padding: 16px;
}

.data-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 8px;
}

.data-section {
  margin-bottom: 16px;
}

.data-section:last-child {
  margin-bottom: 0;
}

.section-label {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #495057;
}

.json-display {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'SF Mono', Monaco, 'Consolas', monospace;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid #333;
}

.loading-text {
  margin: 0;
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
  text-align: center;
  padding: 8px;
}
</style>