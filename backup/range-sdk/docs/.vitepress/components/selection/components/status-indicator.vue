<template>
  <section class="status-section">
    <div class="status-card">
      <div class="status-indicator" :class="{ 'active': isInitialized }">
        <div class="indicator-dot"></div>
        <span>{{ isInitialized ? 'SDK 已就绪' : '正在初始化...' }}</span>
      </div>
      <div v-if="error" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ error }}
      </div>
    </div>
  </section>
</template>

<script setup>
// 定义组件属性
defineProps({
  // SDK初始化状态
  isInitialized: {
    type: Boolean,
    default: false
  },
  // 错误信息
  error: {
    type: String,
    default: null
  }
})
</script>