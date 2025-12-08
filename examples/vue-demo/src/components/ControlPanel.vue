<template>
  <section class="control-panel">
    <div class="panel-header">
      <h2 class="panel-title">{{ t.controlPanel.title }}</h2>
      <div class="selection-count">
        {{ t.controlPanel.savedSelections }}: <span class="count-badge">{{ currentSelections.length }}</span>
      </div>
    </div>

    <div class="control-grid">
      <!-- Selection Type -->
      <div class="control-group">
        <h3 class="group-title">{{ t.controlPanel.selectionType }}</h3>

        <!-- Type Selector -->
        <div class="type-selector">
          <label class="type-label">{{ t.controlPanel.selectTypeHint }}</label>
          <select v-model="selectedSelectionType" class="type-select">
            <option
              v-for="typeConfig in availableTypes"
              :key="typeConfig.type"
              :value="typeConfig.type"
            >
              {{ typeConfig.icon }} {{ typeConfig.label }}
            </option>
          </select>
          <div class="type-preview" :class="`type-${selectedSelectionType}`">
            {{ getTypeConfig(selectedSelectionType)?.description || t.controlPanel.defaultStylePreview }}
          </div>
        </div>
      </div>

      <!-- Interaction Mode -->
      <div class="control-group">
        <h3 class="group-title">{{ t.controlPanel.interactionMode }}</h3>
        <div class="interaction-selector">
          <label class="type-label">{{ t.controlPanel.triggerActionHint }}</label>
          <select v-model="interactionMode" class="type-select">
            <option value="click">{{ t.interactionModes.click }}</option>
            <option value="hover">{{ t.interactionModes.hover }}</option>
            <option value="dblclick">{{ t.interactionModes.dblclick }}</option>
            <option value="contextmenu">{{ t.interactionModes.contextmenu }}</option>
          </select>
        </div>
      </div>

      <!-- Batch Operations -->
      <div class="control-group">
        <h3 class="group-title">{{ t.controlPanel.batchOperations }}</h3>
        <div class="button-group">
          <button
            @click="$emit('load-mock-data')"
            :disabled="!isInitialized"
            class="btn btn-primary"
          >
            <span class="btn-icon">📥</span>
            {{ t.controlPanel.loadPresetData }}
          </button>
          <button
            @click="$emit('restore-all-selections')"
            :disabled="!isInitialized || currentSelections.length === 0"
            class="btn btn-success"
          >
            <span class="btn-icon">🔄</span>
            {{ t.controlPanel.restoreAllSelections }}
          </button>
          <button
            @click="$emit('clear-highlights')"
            :disabled="!isInitialized"
            class="btn btn-outline"
          >
            <span class="btn-icon">🧹</span>
            {{ t.controlPanel.clearAllHighlights }}
          </button>
          <button
            @click="$emit('print-data')"
            :disabled="!isInitialized || currentSelections.length === 0"
            class="btn btn-outline"
          >
            <span class="btn-icon">🖨️</span>
            {{ t.controlPanel.printData }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { messages, type Locale } from '../../../common/i18n'
import type { SelectionTypeConfig } from 'range-kit-vue'

// Define component props
const props = defineProps({
  // Initialization status
  isInitialized: {
    type: Boolean,
    default: false
  },
  // Loading status
  isLoading: {
    type: Boolean,
    default: false
  },
  // Current selection list
  currentSelections: {
    type: Array,
    default: () => []
  },
  // Available selection types
  availableTypes: {
    type: Array as PropType<SelectionTypeConfig[]>,
    default: () => []
  },
  // Get type config function
  getTypeConfig: {
    type: Function as PropType<(type: string) => SelectionTypeConfig | undefined>,
    required: true
  },
  // Current selected selection type
  selectedSelectionType: {
    type: String,
    default: 'default'
  },
  // Interaction mode
  interactionMode: {
    type: String,
    default: 'click'
  },
  // Locale
  locale: {
    type: String as PropType<Locale>,
    default: 'en'
  }
})

// Define events
const emit = defineEmits([
  'load-mock-data',
  'clear-highlights',
  'restore-all-selections',
  'export-data',
  'print-data',
  'update:selectedSelectionType',
  'update:interactionMode'
])

// Translation messages based on locale
const t = computed(() => messages[props.locale as Locale])

// Current selected selection type (v-model implementation)
const selectedSelectionType = computed({
  get: () => props.selectedSelectionType,
  set: (value) => emit('update:selectedSelectionType', value)
})

// Interaction mode (v-model implementation)
const interactionMode = computed({
  get: () => props.interactionMode,
  set: (value) => emit('update:interactionMode', value)
})
</script>

<style scoped>
/* Control panel container - Enterprise clean style */
.control-panel {
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  margin-bottom: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.selection-count {
  font-size: 13px;
  color: #6b7280;
}

.count-badge {
  background: #f3f4f6;
  color: #1f2937;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  margin-left: 6px;
  font-size: 12px;
}

/* Sidebar uses single column layout */
.control-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 768px) {
  .control-grid {
    flex-direction: column;
  }
}

.control-group {
  background: #fafafa;
  border-radius: 6px;
  padding: 14px;
  border: 1px solid #e5e7eb;
}

.group-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.type-selector,
.interaction-selector {
  margin-bottom: 0;
}

.type-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.type-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #1f2937;
  font-size: 13px;
}

.type-select:focus {
  outline: none;
  border-color: #6b7280;
  box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.1);
}

.type-select option {
  background: white;
  color: #1f2937;
}

.type-preview {
  margin-top: 6px;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  background: #f9fafb;
  border-left: 3px solid #6b7280;
  color: #6b7280;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Button base styles - Enterprise clean style */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
  background: white;
  color: #374151;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 16px;
}

.btn-primary {
  background: #ffffff;
  color: #059669;
  border-color: #059669;
}

.btn-primary:hover:not(:disabled) {
  background: #ecfdf5;
}

.btn-success {
  background: #ffffff;
  color: #0284c7;
  border-color: #0284c7;
}

.btn-success:hover:not(:disabled) {
  background: #f0f9ff;
}

.btn-info {
  background: #ffffff;
  color: #2563eb;
  border-color: #2563eb;
}

.btn-info:hover:not(:disabled) {
  background: #eff6ff;
}

.btn-danger {
  background: #ffffff;
  color: #dc2626;
  border-color: #dc2626;
}

.btn-danger:hover:not(:disabled) {
  background: #fef2f2;
}

.btn-outline {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-outline:hover:not(:disabled) {
  background: #f9fafb;
}

/* Type preview styles - Enterprise colors */
.type-default {
  border-left-color: #6b7280;
}

.type-highlight {
  border-left-color: #9ca3af;
}

.type-annotation {
  border-left-color: #6b7280;
}

.type-bookmark {
  border-left-color: #9ca3af;
}
</style>
