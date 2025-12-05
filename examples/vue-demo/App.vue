<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSelectionRestore, useSearchHighlight } from '@life2code/range-kit-vue'
import SelectionPopover from './components/SelectionPopover.vue'
import ControlPanel from './components/ControlPanel.vue'
import SearchHighlight from './components/SearchHighlight.vue'
import { usePopover } from './hooks/use-popover'
import { useSelectionCallbacks } from './hooks/use-selection-callbacks'
import { useSelectionActions } from './hooks/use-selection-actions'
import { useSearchActions } from './hooks/use-search-actions'
import { DEFAULT_SELECTION_TYPES } from './constants'
import { mockSelections } from './mock'

const containerRef = ref<HTMLElement | null>(null)
const content = ref(`
<article class="article-content">
  <h1 style="text-align: center; margin-bottom: 10px;">出师表</h1>
  <h3 style="text-align: center; margin-bottom: 20px; color: #666;">诸葛亮</h3>
  <p>先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气，不宜妄自菲薄，引喻失义，以塞忠谏之路也。</p>
  <p>宫中府中，俱为一体，陟罚臧否，不宜异同。若有作奸犯科及为忠善者，宜付有司论其刑赏，以昭陛下平明之理，不宜偏私，使内外异法也。</p>
  <p>侍中、侍郎郭攸之、费祎、董允等，此皆良实，志虑忠纯，是以先帝简拔以遗陛下。愚以为宫中之事，事无大小，悉以咨之，然后施行，必能裨补阙漏，有所广益。</p>
  <p>将军向宠，性行淑均，晓畅军事，试用于昔日，先帝称之曰能，是以众议举宠为督。愚以为营中之事，悉以咨之，必能使行阵和睦，优劣得所。</p>
  <p>亲贤臣，远小人，此先汉所以兴隆也；亲小人，远贤臣，此后汉所以倾颓也。先帝在时，每与臣论此事，未尝不叹息痛恨于桓、灵也。侍中、尚书、长史、参军，此悉贞良死节之臣，愿陛下亲之信之，则汉室之隆，可计日而待也。</p>
  <p>臣本布衣，躬耕于南阳，苟全性命于乱世，不求闻达于诸侯。先帝不以臣卑鄙，猥自枉屈，三顾臣于草庐之中，咨臣以当世之事，由是感激，遂许先帝以驱驰。后值倾覆，受任于败军之际，奉命于危难之间，尔来二十有一年矣。</p>
  <p>先帝知臣谨慎，故临崩寄臣以大事也。受命以来，夙夜忧叹，恐托付不效，以伤先帝之明，故五月渡泸，深入不毛。今南方已定，兵甲已足，当奖率三军，北定中原，庶竭驽钝，攘除奸凶，兴复汉室，还于旧都。此臣所以报先帝而忠陛下之职分也。至于斟酌损益，进尽忠言，则攸之、祎、允之任也。</p>
  <p>愿陛下托臣以讨贼兴复之效，不效，则治臣之罪，以告先帝之灵。若无兴德之言，则责攸之、祎、允等之慢，以彰其咎；陛下亦宜自谋，以咨诹善道，察纳雅言，深追先帝遗诏，臣不胜受恩感激。</p>
  <p>今当远离，临表涕零，不知所言。</p>
</article>
`)

// Popover State
const popover = usePopover()
const selectedSelectionType = ref('search') // Default to 'search' as per constants order

// Refs for circular dependencies
const refs = {
  getSDKInstance: (() => null) as () => any,
  searchResults: null as any
}

// Callbacks
const callbacks = useSelectionCallbacks({
  popover,
  getSDKInstance: () => refs.getSDKInstance(),
  getSearchResults: () => refs.searchResults
})

// 1. Selection Restore
const { 
  saveCurrentSelection, 
  restoreSelections, 
  currentSelections, 
  getSDKInstance,
  clearAllSelections,
  deleteSelection,
  clearAllSelectionsData,
  getTypeConfig,
  isInitialized,
  navigation
} = useSelectionRestore({
  appId: 'vue-demo-app',
  containers: ['.demo-content'],
  selectionStyles: DEFAULT_SELECTION_TYPES,
  onSelectionAction: callbacks.onSelectionAction,
  onSelectionSaved: () => {
    popover.hidePopover()
  }
})

// Update SDK Instance ref
refs.getSDKInstance = getSDKInstance

// 2. Search Highlight
const { 
  addSearchKeyword,
  removeSearchKeyword,
  clearSearchHighlights,
  searchKeywords,
  searchResults 
} = useSearchHighlight({
  getSDKInstance,
  containers: ['.demo-content'],
  selectionStyles: DEFAULT_SELECTION_TYPES,
  onSearchHighlightInteraction: callbacks.onSearchHighlightInteraction
})

// Update search results ref
refs.searchResults = searchResults

// 3. Highlight Navigation
// Removed useHighlightNavigation as we use the one from useSelectionRestore


// Selection Actions
const selectionActions = useSelectionActions({
  popover,
  selectedSelectionType,
  currentSelections,
  getTypeConfig,
  saveCurrentSelection,
  restoreSelections,
  clearAllSelections,
  deleteSelection,
  clearAllSelectionsData
})

// Search Actions
const searchActions = useSearchActions({
  addSearchKeyword,
  removeSearchKeyword,
  clearSearchHighlights
})

const handleLoadMockData = async () => {
  // @ts-ignore
  await restoreSelections(mockSelections, true)
}

// Handle Scroll to hide popover
const handleScroll = () => {
  if (popover.popoverVisible.value) {
    popover.hidePopover()
  }
}

onMounted(() => {
  const container = document.querySelector('.demo-content')
  if (container) {
    container.addEventListener('scroll', handleScroll, { passive: true })
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  const container = document.querySelector('.demo-content')
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  }
  window.removeEventListener('scroll', handleScroll)
})

</script>

<template>
  <div class="vue-demo">
    <header>
      <h1>Vue Range Kit Demo</h1>
      <a href="/">Back to Home</a>
    </header>

    <div class="layout-container">
      <aside class="sidebar">
        <ControlPanel
          :is-initialized="isInitialized"
          :current-selections="currentSelections"
          :available-types="DEFAULT_SELECTION_TYPES"
          :get-type-config="getTypeConfig"
          v-model:selected-selection-type="selectedSelectionType"
          @restore-all-selections="selectionActions.handleRestoreAllSelections"
          @clear-highlights="selectionActions.handleClearHighlights"
          @clear-all="selectionActions.handleClearAll"
          @print-data="selectionActions.handlePrintData"
        />

        <!-- 预设数据 -->
        <div class="control-group">
          <h3 class="group-title">预设数据</h3>
          <div class="button-group vertical">
            <button
              @click="handleLoadMockData"
              :disabled="!isInitialized"
              class="btn btn-primary full-width"
            >
              <span class="btn-icon">📥</span>
              加载预设数据
            </button>
            <button
              @click="selectionActions.handleClearAll"
              :disabled="!isInitialized"
              class="btn btn-outline full-width"
            >
              <span class="btn-icon">❌</span>
              清空数据
            </button>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <div class="main-panel-controls combined-controls">
          <!-- Search and Navigation in one row -->
          <div class="control-group search-nav-group">
            <div class="search-section">
               <SearchHighlight
                :is-initialized="isInitialized"
                :keywords="searchKeywords"
                :keyword-results="searchResults"
                :available-types="DEFAULT_SELECTION_TYPES"
                :get-type-config="getTypeConfig"
                :default-type="selectedSelectionType"
                @add-keyword="searchActions.handleAddSearchKeyword"
                @remove-keyword="searchActions.handleRemoveSearchKeyword"
                @clear-all="searchActions.handleClearSearchKeywords"
              />
            </div>

            <div class="separator"></div>

            <div class="nav-section">
               <div class="nav-controls">
                 <button class="btn btn-outline" @click="navigation.goToPrev" :disabled="navigation.total.value === 0">Prev</button>
                 <span class="nav-info">{{ navigation.currentIndex.value + 1 }} / {{ navigation.total.value }}</span>
                 <button class="btn btn-outline" @click="navigation.goToNext" :disabled="navigation.total.value === 0">Next</button>
               </div>
            </div>
          </div>
        </div>
        <div class="demo-content" ref="containerRef" v-html="content"></div>
      </main>
    </div>
    
    <SelectionPopover 
      :visible="popover.popoverVisible.value"
      :popover-data="popover.popoverData.value"
      @save-item="selectionActions.handleSaveItem"
      @delete-item="selectionActions.handleDeleteItem"
      @close="popover.hidePopover"
    />
  </div>
</template>

<style>
.vue-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}

.layout-container {
  display: flex;
  gap: 24px;
}

.sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-content {
  flex: 1;
  min-width: 0; /* Prevent overflow */
}

.main-panel-controls {
  margin-bottom: 20px;
}

.combined-controls .control-group {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
}

.search-nav-group {
  justify-content: space-between;
  flex-wrap: wrap;
}

.search-section {
  flex: 1;
  min-width: 300px;
}

.nav-section {
  flex-shrink: 0;
}

.separator {
  width: 1px;
  height: 24px;
  background-color: #e5e7eb;
  margin: 0 10px;
  display: none; /* Hide on smaller screens if needed */
}

@media (min-width: 768px) {
  .separator {
    display: block;
  }
}

.demo-content {
  line-height: 1.8;
  padding: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-height: 600px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  flex: 1;
  min-width: 150px;
}

input {
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.button-group {
  display: flex;
  gap: 8px;
}

.button-group.vertical {
  flex-direction: column;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-info {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

/* Button Styles reused here for consistency if not using scoped styles in ControlPanel */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  background: white;
  color: #374151;
}

.btn:hover:not(:disabled) {
  background: #f9fafb;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.full-width {
  width: 100%;
}

.btn-primary {
  background: #ffffff;
  color: #2563eb;
  border-color: #2563eb;
}

.btn-primary:hover:not(:disabled) {
  background: #eff6ff;
}

.btn-outline {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}
</style>