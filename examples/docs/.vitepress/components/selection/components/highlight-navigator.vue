<template>
  <div class="highlight-navigator">
    <div class="navigator-info">
      <span class="navigator-label">高亮导航</span>
      <span class="navigator-count">
        {{ total > 0 ? (currentIndex >= 0 ? currentIndex + 1 : '-') : '0' }} / {{ total }}
      </span>
    </div>
    <div class="navigator-actions">
      <button
        class="nav-btn"
        @click="$emit('go-prev')"
        :disabled="!canNavigate"
        title="上一个 (↑)"
      >
        <span class="nav-icon">↑</span>
      </button>
      <button
        class="nav-btn"
        @click="$emit('go-next')"
        :disabled="!canNavigate"
        title="下一个 (↓)"
      >
        <span class="nav-icon">↓</span>
      </button>
      <button
        class="nav-btn reset-btn"
        @click="$emit('reset')"
        :disabled="currentIndex < 0"
        title="重置"
      >
        <span class="nav-icon">×</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentIndex: {
    type: Number,
    default: -1
  },
  total: {
    type: Number,
    default: 0
  }
})

defineEmits(['go-prev', 'go-next', 'reset'])

const canNavigate = computed(() => props.total > 0)
</script>

<style scoped>
.highlight-navigator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border: 1px solid #fed7aa;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.navigator-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.navigator-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #9a3412;
}

.navigator-count {
  font-size: 0.8rem;
  font-weight: 600;
  color: #c2410c;
  background: #ffffff;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #fdba74;
}

.navigator-actions {
  display: flex;
  gap: 0.25rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #fdba74;
  border-radius: 6px;
  background: #ffffff;
  color: #c2410c;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-btn:hover:not(:disabled) {
  background: #ffedd5;
  border-color: #fb923c;
  transform: translateY(-1px);
}

.nav-btn:active:not(:disabled) {
  transform: translateY(0);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-icon {
  font-weight: bold;
  line-height: 1;
}

.reset-btn {
  margin-left: 0.25rem;
  border-color: #fca5a5;
  color: #dc2626;
}

.reset-btn:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #f87171;
}
</style>
