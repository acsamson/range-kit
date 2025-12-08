<template>
  <div class="rk-dictionary-card" v-if="hasDictionaryContent">
    <div class="rk-dictionary-header">
      <span class="rk-dictionary-title">{{ data?.dictionaryConfig?.title || t.popover.dictionary }}</span>
    </div>
    <div class="rk-dictionary-body">
      <div v-if="data?.dictionaryConfig?.showKeyword" class="rk-dictionary-keyword">{{ searchKeyword }}</div>
      <div class="rk-dictionary-content">{{ renderedDictionaryContent }}</div>
    </div>
  </div>

  <div class="rk-selection-list">
    <div class="rk-list-header">
      <span class="rk-header-title">{{ headerTitle }}</span>
    </div>
    <div class="rk-list-content">
      <div
        v-for="item in (data?.items || [])"
        :key="item.id"
        :class="['rk-selection-item', `rk-item-${item.itemType}`]"
      >
        <span :class="['rk-item-type-badge', `rk-badge-${item.itemType}`]">
          {{ getTypeLabel(item) }}
        </span>
        <span class="rk-item-text" :title="item.text">
          {{ truncateText(item.text, 20) }}
        </span>
        <div class="rk-item-actions">
          <button
            v-if="item.itemType === 'saved'"
            class="rk-action-btn rk-delete-btn"
            @click="$emit('delete', item)"
            :title="t.popover.deleteSelection"
          >
            <DeleteIcon />
          </button>
          <button
            v-if="item.itemType === 'search' || item.itemType === 'new'"
            class="rk-action-btn rk-save-btn"
            @click="$emit('save', item)"
            :title="t.popover.saveSelection"
          >
            <SaveIcon />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import type { PopoverData, PopoverItem } from 'range-kit-vue'
import { useI18n } from '../hooks/use-i18n'

const props = defineProps<{
  data: PopoverData
}>()

defineEmits<{
  (e: 'save', item: PopoverItem): void
  (e: 'delete', item: PopoverItem): void
}>()

const { t } = useI18n()

// Icons as functional components
const DeleteIcon = () =>
  h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [
    h('path', { d: 'M3 6h18' }),
    h('path', { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' }),
    h('path', { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' })
  ])

const SaveIcon = () =>
  h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [
    h('path', { d: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' }),
    h('polyline', { points: '17 21 17 13 7 13 7 21' }),
    h('polyline', { points: '7 3 7 8 15 8' })
  ])

const hasDictionaryContent = computed(() => {
  return !!props.data?.dictionaryConfig &&
    props.data.items.some(item => item.itemType === 'search')
})

const searchKeyword = computed(() => {
  const searchItem = props.data?.items.find(item => item.itemType === 'search')
  return searchItem?.text || ''
})

const renderedDictionaryContent = computed(() => {
  const template = props.data?.dictionaryConfig?.contentTemplate || ''
  const keyword = searchKeyword.value
  return template.replace(/\{\{keyword\}\}/g, keyword)
})

const headerTitle = computed(() => {
  const items = props.data?.items || []
  const savedCount = items.filter(i => i.itemType === 'saved').length
  const searchCount = items.filter(i => i.itemType === 'search').length
  const newCount = items.filter(i => i.itemType === 'new').length

  if (items.length === 1) {
    if (savedCount === 1) return t.value.popover.selectionActions
    if (searchCount === 1) return t.value.popover.searchResults
    if (newCount === 1) return t.value.popover.newSelection
  }

  const parts: string[] = []
  if (savedCount > 0) parts.push(`${savedCount} ${t.value.popover.selections}`)
  if (searchCount > 0) parts.push(`${searchCount} ${t.value.popover.searches}`)
  if (newCount > 0) parts.push(`${newCount} ${t.value.popover.newSelections}`)

  return parts.join(' + ') || t.value.popover.selectionActions
})

const getTypeLabel = (item: PopoverItem): string => {
  switch (item.itemType) {
    case 'saved':
      return t.value.popover.saved
    case 'search':
      return t.value.popover.search
    case 'new':
      return t.value.popover.new
    default:
      return ''
  }
}

const truncateText = (text: string | undefined, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}
</script>
