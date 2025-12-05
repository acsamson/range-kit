<template>
  <Transition name="dictionary-card" appear>
    <div
      ref="cardRef"
      class="dictionary-card"
      :class="[customClass, { dragging: isDragging }]"
      :style="cardStyle"
      @wheel.stop
      @touchmove.stop
    >
      <!-- 拖拽手柄区域 -->
      <div
        ref="dragHandleRef"
        class="drag-handle"
        @mousedown="startDrag"
        @touchstart="startDrag"
        title="拖拽移动卡片"
      >
        <div class="drag-indicator">
          <div class="drag-dots"></div>
        </div>
      </div>

      <!-- 关闭按钮 -->
      <button class="close-btn" @click.stop="$emit('close')" title="关闭">
        <Close :size="12" />
      </button>

      <!-- Tab 切换栏容器（当有多个关键词时显示） -->
      <div v-if="hasMultipleTabs" class="dictionary-tabs-container">
        <div class="dictionary-tabs">
          <button
            v-for="(item, index) in tabItems"
            :key="index"
            class="tab-button"
            :class="{ 
              active: activeTabIndex === index,
              loaded: isTabLoaded(index)
            }"
            @click="switchTab(index)"
          >
            <span class="tab-text">{{ item.keyword }}</span>
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isCurrentTabLoading" class="dictionary-loading">
        <div class="loading-spinner"></div>
        <span class="loading-text">正在加载 "{{ currentKeyword }}" ...</span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="currentError" class="dictionary-error">
        <span class="error-icon">⚠️</span>
        <span>{{ currentError }}</span>
        <button class="retry-btn" @click="retryCurrentTab">重试</button>
      </div>

      <!-- 内容展示 -->
      <div v-else-if="currentEntry" class="dictionary-content">
        <!-- 使用原有的内容展示逻辑 -->
        <DictionaryContent 
          :entry="currentEntry"
          @clickTag="$emit('clickTag', $event)"
          @clickLarkDoc="$emit('clickLarkDoc', $event)"
          @clickWebLink="$emit('clickWebLink', $event)"
          @clickImage="(url: string, index: number) => $emit('clickImage', url, index)"
          @like="$emit('like', $event)"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="dictionary-empty">
        <span class="empty-icon">📖</span>
        <p class="empty-text">暂无 "{{ currentKeyword }}" 的词条信息</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Close } from '@icon-park/vue-next'
import DictionaryContent from './dictionary-content.vue'
import type { WordData } from '../../bam-auto-generate/bes.fe.web_core/namespaces/dictionary'
import { sendTeaEvent } from '../tea'
import { TeaEventName } from '../tea/constants'

interface TabItem {
  keyword: string
  entry: WordData | null
  loading: boolean
  error: string | null
}

interface Props {
  keywords: string[]
  dataLoader?: (keyword: string) => Promise<WordData | null>
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  keywords: () => [],
  customClass: ''
})

const emit = defineEmits<{
  close: []
  clickTag: [tag: string]
  clickLarkDoc: [doc: string]
  clickWebLink: [link: string]
  clickImage: [url: string, index: number]
  like: [id: number]
  tabChange: [index: number]
}>()

// DOM引用
const cardRef = ref<HTMLElement>()
const dragHandleRef = ref<HTMLElement>()

// 拖拽状态
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const cardPosition = ref({ x: 0, y: 0 })

// Tab数据管理
const tabItems = ref<TabItem[]>([])
const activeTabIndex = ref(0)

// 埋点相关
const cardShowTime = ref<number>(Date.now())
const tabSwitchCount = ref<number>(0)

// 初始化tabs
const initializeTabs = () => {
  tabItems.value = props.keywords.map(keyword => ({
    keyword,
    entry: null,
    loading: false,
    error: null
  }))
}

// 加载指定tab的数据
const loadTabData = async (index: number) => {
  if (index < 0 || index >= tabItems.value.length) return
  
  const tab = tabItems.value[index]
  
  // 如果已经加载过或正在加载，不重复加载
  if (tab.entry || tab.loading) return
  
  tab.loading = true
  tab.error = null
  
  try {
    if (props.dataLoader) {
      const data = await props.dataLoader(tab.keyword)
      tab.entry = data
      
      if (!data) {
        tab.error = `未找到词条: ${tab.keyword}`
      }
    } else {
      tab.error = '数据加载器未配置'
    }
  } catch (error) {
    console.error(`加载词条失败: ${tab.keyword}`, error)
    tab.error = error instanceof Error ? error.message : '加载失败'
  } finally {
    tab.loading = false
  }
}

// 切换tab
const switchTab = (index: number) => {
  if (index === activeTabIndex.value) return
  
  const previousIndex = activeTabIndex.value
  activeTabIndex.value = index
  tabSwitchCount.value++
  
  // 发送tab切换埋点
  sendTeaEvent(TeaEventName.DICTIONARY_CARD_TAB_SWITCH, {
    section: {
      keywords: props.keywords,
      currentKeyword: props.keywords[index],
      previousKeyword: props.keywords[previousIndex],
    },
    data: {
      from_index: previousIndex,
      to_index: index,
      from_keyword: props.keywords[previousIndex],
      to_keyword: props.keywords[index],
      switch_count: tabSwitchCount.value,
      time_since_show: Date.now() - cardShowTime.value
    }
  })
  
  emit('tabChange', index)
  
  // 加载新tab的数据
  loadTabData(index)
}

// 重试当前tab
const retryCurrentTab = () => {
  const tab = tabItems.value[activeTabIndex.value]
  if (tab) {
    tab.entry = null
    tab.error = null
    loadTabData(activeTabIndex.value)
  }
}

// 拖拽功能实现
const startDrag = (event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation() // 阻止事件传播到父元素

  if (!cardRef.value) return

  // 获取当前卡片位置
  const rect = cardRef.value.getBoundingClientRect()

  // 如果卡片没有设置初始位置，使用当前位置
  if (cardPosition.value.x === 0 && cardPosition.value.y === 0) {
    cardPosition.value = {
      x: rect.left,
      y: rect.top
    }
  }

  isDragging.value = true

  // 获取初始点击位置
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  dragOffset.value = {
    x: clientX - cardPosition.value.x,
    y: clientY - cardPosition.value.y
  }

  // 添加全局事件监听
  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.value || !cardRef.value) return

    e.preventDefault()
    e.stopPropagation()

    const moveClientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const moveClientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    // 计算新位置
    const newX = moveClientX - dragOffset.value.x
    const newY = moveClientY - dragOffset.value.y

    // 获取卡片实际尺寸
    const cardWidth = cardRef.value.offsetWidth || 400
    const cardHeight = cardRef.value.offsetHeight || 300

    // 限制在视口内
    const maxX = window.innerWidth - cardWidth
    const maxY = window.innerHeight - cardHeight

    const constrainedX = Math.max(0, Math.min(newX, maxX))
    const constrainedY = Math.max(0, Math.min(newY, maxY))

    cardPosition.value = {
      x: constrainedX,
      y: constrainedY
    }
  }

  const handleEnd = (e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()

    isDragging.value = false
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleEnd)
    document.removeEventListener('touchmove', handleMove)
    document.removeEventListener('touchend', handleEnd)
  }

  document.addEventListener('mousemove', handleMove, { passive: false })
  document.addEventListener('mouseup', handleEnd, { passive: false })
  document.addEventListener('touchmove', handleMove, { passive: false })
  document.addEventListener('touchend', handleEnd, { passive: false })
}

// 计算属性
const hasMultipleTabs = computed(() => tabItems.value.length > 1)
const currentTab = computed(() => tabItems.value[activeTabIndex.value])
const currentKeyword = computed(() => currentTab.value?.keyword || '')
const currentEntry = computed(() => currentTab.value?.entry)
const currentError = computed(() => currentTab.value?.error)
const isCurrentTabLoading = computed(() => currentTab.value?.loading || false)

// 卡片样式
const cardStyle = computed(() => {
  const style: any = {
    position: 'fixed' as const,
    zIndex: isDragging.value ? 10001 : 10000
  }

  // 只有在拖拽状态或位置不为0时才应用transform
  if (isDragging.value || cardPosition.value.x !== 0 || cardPosition.value.y !== 0) {
    style.transform = `translate(${cardPosition.value.x}px, ${cardPosition.value.y}px)`
    style.left = '0px'
    style.top = '0px'
  }

  return style
})

// 辅助方法
const isTabLoaded = (index: number) => !!tabItems.value[index]?.entry

// 监听keywords变化
watch(() => props.keywords, (newKeywords) => {
  if (JSON.stringify(newKeywords) !== JSON.stringify(tabItems.value.map(t => t.keyword))) {
    initializeTabs()
    activeTabIndex.value = 0
    // 加载第一个tab
    if (tabItems.value.length > 0) {
      loadTabData(0)
    }
  }
}, { immediate: true })

// 组件挂载时加载第一个tab
onMounted(() => {
  // 记录卡片展示时间
  cardShowTime.value = Date.now()
  
  // 发送卡片展示埋点
  sendTeaEvent(TeaEventName.DICTIONARY_CARD_SHOW, {
    section: {
      keywords: props.keywords,
      firstKeyword: props.keywords[0],
      keywordCount: props.keywords.length
    },
    data: {
      keywords: props.keywords,
      keyword_count: props.keywords.length,
      has_multiple_tabs: props.keywords.length > 1
    }
  })
  
  if (tabItems.value.length > 0 && !tabItems.value[0].entry) {
    loadTabData(0)
  }
})

// 组件卸载时发送停留时间埋点
onUnmounted(() => {
  const stayTime = Date.now() - cardShowTime.value
  
  sendTeaEvent(TeaEventName.DICTIONARY_CARD_STAY_TIME, {
    section: {
      keywords: props.keywords,
      lastViewedKeyword: props.keywords[activeTabIndex.value]
    },
    data: {
      stay_time: stayTime,
      tab_switch_count: tabSwitchCount.value,
      viewed_keywords: tabItems.value
        .filter(item => item.entry !== null)
        .map(item => item.keyword),
      viewed_count: tabItems.value.filter(item => item.entry !== null).length,
      total_keywords: props.keywords.length
    }
  })
})
</script>

<style lang="scss" scoped>
@use './dictionary-card.scss';

// 拖拽手柄样式
.drag-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 24px;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: 8px 8px 0 0;
  z-index: 10;

  &:active {
    cursor: grabbing;
  }
}

.drag-indicator {
  width: 20px;
  height: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-dots {
  width: 20px;
  height: 2px;
  background: #d1d5db;
  border-radius: 1px;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 2px;
    background: #d1d5db;
    border-radius: 1px;
  }

  &::before {
    top: -4px;
  }

  &::after {
    top: 4px;
  }
}

// 修改卡片样式以适应拖拽
.dictionary-card {
  // 为拖拽手柄留出空间
  padding-top: 24px;

  // 拖拽时的过渡效果
  &:not(.dragging) {
    transition: transform 0.2s ease;
  }
}

// 关闭按钮调整位置以避免与拖拽手柄冲突
.close-btn {
  top: 4px;
  right: 8px;
  z-index: 11;
}

// 额外的懒加载样式
.dictionary-tabs-container {
  .tab-button {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;

    &.loaded {
      .tab-text {
        font-weight: 500;
      }
    }
  }
}

.dictionary-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f0f0f0;
    border-top-color: #1890ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  .loading-text {
    margin-top: 12px;
    color: #8f959e;
    font-size: 14px;
  }
}

.dictionary-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  
  .error-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }
  
  .retry-btn {
    margin-top: 12px;
    padding: 6px 16px;
    background: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
    
    &:hover {
      background: #40a9ff;
    }
  }
}

.dictionary-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
  
  .empty-text {
    color: #8f959e;
    font-size: 14px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
