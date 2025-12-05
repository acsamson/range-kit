<template>
  <div class="simple-custom-card">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="header-left">
        <span class="card-icon">🎯</span>
        <h3 class="card-title">简单自定义卡片</h3>
      </div>
      <button class="close-btn" @click="$emit('close')" title="关闭">
        ×
      </button>
    </div>

    <!-- 卡片内容 -->
    <div class="card-content">
      <div class="keywords-section">
        <h4 class="section-title">📝 关键词列表</h4>
        <div class="keywords-grid">
          <div
            v-for="(keyword, index) in keywords"
            :key="keyword"
            class="keyword-chip"
          >
            <span class="chip-number">{{ index + 1 }}</span>
            <span class="chip-text">{{ keyword }}</span>
          </div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-card">
          <div class="info-icon">💡</div>
          <div class="info-content">
            <h5 class="info-title">自定义组件示例</h5>
            <p class="info-text">
              这是一个简单的自定义词典卡片组件，展示了如何创建自己的UI样式。
            </p>
          </div>
        </div>

        <div class="features-list">
          <div class="feature-item">
            <span class="feature-icon">✅</span>
            <span class="feature-text">接收 keywords 参数</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✅</span>
            <span class="feature-text">实现 close emit</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✅</span>
            <span class="feature-text">完全自定义样式</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片底部 -->
    <div class="card-footer">
      <span class="footer-text">🚀 自定义组件示例</span>
      <span class="keywords-count">{{ keywords.length }} 个词汇</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WordData } from '../bam-auto-generate/bes.fe.web_core/namespaces/dictionary'

interface Props {
  keywords: string[]
  dataLoader?: (keyword: string) => Promise<WordData | null>
}

defineProps<Props>()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.simple-custom-card {
  background: linear-gradient(145deg, #f8f9ff 0%, #ffffff 100%);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-width: 320px;
  max-width: 420px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border: 2px solid #4caf50;
}

/* 卡片头部 */
.card-header {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-icon {
  font-size: 20px;
  line-height: 1;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* 卡片内容 */
.card-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #4caf50;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 关键词网格 */
.keywords-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.keyword-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #e8f5e8;
  border: 1px solid #c8e6c9;
  border-radius: 20px;
  font-size: 13px;
}

.chip-number {
  background: #4caf50;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chip-text {
  font-weight: 500;
  color: #2e7d32;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 信息区域 */
.info-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #e8f5e8 0%, #f1f8f1 100%);
  border-radius: 8px;
  border-left: 4px solid #4caf50;
}

.info-icon {
  font-size: 24px;
  line-height: 1;
}

.info-content {
  flex: 1;
}

.info-title {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2e7d32;
}

.info-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #4a5568;
}

/* 特性列表 */
.features-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 13px;
}

.feature-icon {
  font-size: 14px;
  line-height: 1;
}

.feature-text {
  color: #4a5568;
  font-weight: 500;
}

/* 卡片底部 */
.card-footer {
  background: #f5f5f5;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
}

.footer-text {
  color: #4caf50;
  font-weight: 600;
}

.keywords-count {
  background: #4caf50;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
</style>