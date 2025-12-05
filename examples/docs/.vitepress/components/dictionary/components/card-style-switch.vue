<!--
  卡片样式切换组件
  用于切换不同的词典卡片样式
-->
<template>
  <div class="panel-section">
    <h3 class="section-title">卡片样式</h3>

    <div class="card-style-switch">
      <label class="switch-item">
        <input
          type="radio"
          name="cardStyle"
          value="default"
          :checked="props.modelValue === 'default'"
          @change="emit('update:modelValue', 'default')"
        />
        <span class="switch-label">
          <span class="switch-icon">📋</span>
          默认卡片
        </span>
      </label>

      <label class="switch-item">
        <input
          type="radio"
          name="cardStyle"
          value="custom"
          :checked="props.modelValue === 'custom'"
          @change="emit('update:modelValue', 'custom')"
        />
        <span class="switch-label">
          <span class="switch-icon">🎨</span>
          自定义卡片
        </span>
      </label>
    </div>

    <p class="style-hint">
      {{ props.modelValue === 'default' ? '使用默认的词典卡片样式' :
         '使用自定义的词典卡片样式，绿色主题设计' }}
    </p>
  </div>
</template>

<script setup lang="ts">
// 卡片样式类型定义
export type CardStyle = 'default' | 'custom'

// 接收props
const props = defineProps<{
  modelValue: CardStyle
}>()

// 定义更新事件
const emit = defineEmits<{
  'update:modelValue': [value: CardStyle]
}>()
</script>

<style scoped>
/* 卡片样式切换 */
.card-style-switch {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.switch-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  color: #000;
}

.switch-item:hover {
  background: #e9ecef;
  border-color: #4285f4;
}

.switch-item input[type="radio"] {
  display: none;
}

.switch-item input[type="radio"]:checked + .switch-label {
  font-weight: 600;
}

.switch-item:has(input[type="radio"]:checked) {
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  border-color: #4285f4;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  width: 100%;
}

.switch-icon {
  font-size: 16px;
  line-height: 1;
}

.style-hint {
  font-size: 12px;
  color: #6c757d;
  margin: 0;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #4285f4;
}
</style>