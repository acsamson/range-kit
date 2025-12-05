<template>
  <div class="custom-demo-card">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="header-content">
        <div class="card-icon">🎨</div>
        <div class="header-text">
          <h3 class="card-title">🎨 自定义词典卡片</h3>
          <span class="card-subtitle">✨ 这是自定义组件UI样式 ✨</span>
        </div>
      </div>
      <button class="close-btn" @click="$emit('close')" title="关闭卡片">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- 简化的内容展示 -->
    <div class="card-body">
      <div class="simple-content">
        <h4 class="keywords-title">📚 词汇列表</h4>
        <div class="keywords-list">
          <div v-for="(keyword, index) in keywords" :key="keyword" class="keyword-item">
            <span class="keyword-badge">{{ index + 1 }}</span>
            <span class="keyword-text">{{ keyword }}</span>
          </div>
        </div>

        <!-- 数据展示区域 -->
        <div class="data-display">
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

        <div class="demo-info">
          <p class="demo-text">
            🎨 这是自定义的词典卡片组件演示
          </p>
          <p class="demo-text">
            ✨ 你可以完全自定义卡片的内容和样式
          </p>
          <p class="demo-text">
            🛠️ 只需要实现 <code>close</code> emit 即可
          </p>
          <p class="demo-text">
            📊 通过 <code>dataLoader</code> 函数可以获取词典数据
          </p>
        </div>
      </div>
    </div>

    <!-- 卡片底部 -->
    <div class="card-footer">
      <div class="footer-info">
        <span class="powered-by">Powered by Range SDK</span>
        <span class="keyword-count">{{ keywords.length }} 个词汇</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { WordData } from '../../../hooks';

interface Props {
  keywords: string[]
  dataLoader?: (keyword: string) => Promise<WordData | null>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// 响应式数据
const loading = ref(false)
const loadedData = ref<Array<{ keyword: string; data: WordData | null }>>([])

// 加载所有关键词的数据
const loadAllData = async () => {
  if (!props.dataLoader) {
    console.log('无 dataLoader 函数')
    return
  }

  loading.value = true
  loadedData.value = []

  try {
    console.log('开始加载词典数据，关键词：', props.keywords)

    // 并行加载所有关键词的数据
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

    console.log('词典数据加载完成：', results)
  } catch (error) {
    console.error('加载词典数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 组件挂载时自动加载数据
onMounted(() => {
  loadAllData()
})
</script>

<style scoped>
.custom-demo-card {
  background: linear-gradient(145deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(102, 126, 234, 0.2),
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-width: 360px;
  max-width: 480px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  border: 2px solid #667eea;
  position: relative;
  transform: translateX(8px);
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

.demo-text code {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'SF Mono', Monaco, monospace;
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