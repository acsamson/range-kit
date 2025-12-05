<!--
  词典演示主组件
  整合所有子组件，提供完整的词典功能演示
-->
<template>
  <div class="dictionary-demo">
    <!-- 导航栏 -->
    <nav class="demo-nav">
      <a href="/range-sdk/playground/" class="back-btn">← 返回 Playground</a>
      <h1 class="demo-title">Range SDK 词典插件演示</h1>
    </nav>

    <!-- 主内容 -->
    <main class="demo-container">
      <!-- 控制面板 -->
      <aside class="control-panel">
        <!-- 词汇选择面板 -->
        <word-selection-panel
          :available-words="initialWords"
          :selected-words="selectedWords"
          @update:selected-words="selectedWords = $event"
          @apply-selection="handleApplyWordSelection"
          @clear-highlights="clearHighlights"
        />

        <!-- 字典配置面板 -->
        <config-panel
          v-model="dictionaryConfig"
          @save="handleConfigSave"
        />

        <!-- 自定义卡片状态面板 -->
        <div v-if="dictionaryConfig.cardStyle === 'custom'" class="panel-section">
          <div class="hook-status">
            <div class="status-item">
              <span class="status-label">当前样式</span>
              <span class="status-value ready">{{ dictionaryConfig.cardStyle }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">自定义卡片状态</span>
              <span
                class="status-value"
                :class="{ ready: rangeKitDictionary.isInitialized() }"
              >
                {{ rangeKitDictionary.isInitialized() ? '已初始化' : '未初始化' }}
              </span>
            </div>
          </div>

          <button
            class="manual-init-btn"
            :disabled="rangeKitDictionary.isInitialized()"
            @click="handleManualInit"
          >
            手动初始化自定义卡片
          </button>
        </div>
      </aside>

      <!-- 内容展示区域 -->
      <div class="content-area">
        <div class="content-card">
          <h2 class="content-title">词典功能演示内容</h2>

          <div ref="contentRef" class="dictionary-content">
            <p>
              <strong>Range SDK 词典插件</strong> 是一个强大的企业知识管理工具，
              能够智能识别文本中的专业术语并提供详细解释。
              本演示展示了两种不同的卡片样式：<strong>默认卡片</strong>和<strong>Range-Kit卡片</strong>。
            </p>

            <p>
              <strong>CORE方法论</strong>：这是抖音电商的核心经营策略。
              <strong>CORE</strong> 代表了 Content（内容）、Operation（运营）、
              Relationship（关系）、Experience（体验）四个关键维度。
              通过点击文本中的<strong>CORE</strong>词汇，可以查看详细的解释说明。
            </p>

            <p>
              <strong>词典功能详解</strong>：<strong>词典</strong>是现代企业知识管理的重要工具。
              它不仅能存储和管理专业术语，还能提供智能搜索、自动高亮等功能。
              在技术实现上，<strong>函数</strong>是编程中的基础概念，
              而<strong>API</strong>接口则是系统间通信的桥梁。
            </p>

            <p>
              <strong>重叠词汇测试</strong>：为了验证系统的词汇识别准确性，
              我们设计了一个特殊的测试场景 - <strong>编程词典与技术</strong>。
              这个长短语包含了多个子词汇：<strong>编程</strong>、<strong>词典</strong>、<strong>技术</strong>。
              测试系统是否能准确识别和高亮整个词组或其中的部分。
            </p>

            <p>
              <strong>虚假测试重叠场景</strong>：这里有一个特殊的重叠测试案例 - <strong>虚假测试345</strong>。
              注意，这个完整的词汇包含了两个子词汇：<strong>虚假测试</strong>和<strong>虚假测试3</strong>。
              当我们点击"虚假测试345"时，系统应该能识别出这三个重叠的词汇。
              再来一个例子：<strong>虚假测试</strong>是基础版本，<strong>虚假测试3</strong>是中间版本，
              而<strong>虚假测试345</strong>是完整版本。这种嵌套的词汇结构可以很好地测试系统的重叠处理能力。
            </p>

            <p>
              <strong>ABC测试重叠场景</strong>：这是一个更复杂的重叠测试 - <strong>ABC123456</strong>。
              这个词汇包含了多个子串：<strong>ABC12345</strong>、<strong>ABC1234</strong>、<strong>ABC123</strong>、
              <strong>ABC12</strong>、<strong>ABC1</strong>、<strong>ABC</strong>、<strong>BC123</strong>、
              <strong>C123</strong>、<strong>123456</strong>、<strong>23456</strong>、<strong>456</strong>。
              点击"ABC123456"时，系统应该识别出所有这些重叠的子串。
            </p>

            <p>
              <strong>使用提示</strong>：点击上面带有蓝色虚线的词汇（如CORE、函数、词典等），
              会弹出相应的词典卡片，展示详细解释和相关信息。这种交互方式让知识获取更加便捷。
            </p>

            <div class="divider"></div>

            <p>
              <strong>大小写敏感测试</strong>：这里提供了一些用于测试大小写敏感功能的词汇。
              页面中包含：<strong>API</strong>、<strong>api</strong>、<strong>Api</strong>、<strong>QA</strong>、<strong>qa</strong>、<strong>Qa</strong>。
              在左侧配置面板中，你可以：
            </p>
            <ul>
              <li><strong>关闭"区分大小写"</strong>：搜索 "API" 会同时高亮 API、api、Api</li>
              <li><strong>开启"区分大小写"</strong>：搜索 "API" 只会高亮 API，不会高亮 api 或 Api</li>
            </ul>

            <div class="divider"></div>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2196f3; margin: 16px 0;">
              <h4 style="color: #1976d2; margin-top: 0;">💡 重要说明</h4>
              <ul style="margin-bottom: 0;">
                <li><strong>页面初始化</strong>：默认会加载并高亮所有预设词汇（不受大小写敏感配置影响）</li>
                <li><strong>手动搜索</strong>：通过搜索框或快速测试功能触发的搜索会根据"区分大小写"配置工作</li>
                <li><strong>测试建议</strong>：先清除所有高亮，再进行手动搜索测试</li>
              </ul>
            </div>

            <h3>大小写敏感测试步骤</h3>
            <ol style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff;">
              <li><strong>测试不区分大小写</strong>：
                <ul>
                  <li>点击"清除所有高亮"按钮（清除默认高亮）</li>
                  <li>在左侧配置面板中，确保"区分大小写"复选框<strong>未勾选</strong></li>
                  <li>点击"保存配置"</li>
                  <li>在搜索框中输入 <code>API</code> 并搜索</li>
                  <li>观察：应该同时高亮页面中的 <strong>API</strong>、<strong>api</strong>、<strong>Api</strong></li>
                </ul>
              </li>
              <li><strong>测试区分大小写</strong>：
                <ul>
                  <li>先点击"清除所有高亮"按钮</li>
                  <li>在左侧配置面板中，<strong>勾选</strong>"区分大小写"复选框</li>
                  <li>点击"保存配置"</li>
                  <li>在搜索框中输入 <code>API</code> 并搜索</li>
                  <li>观察：应该只高亮页面中的 <strong>API</strong>，不高亮 api 或 Api</li>
                </ul>
              </li>
              <li><strong>使用快速测试</strong>：选择左侧的 "API大写测试"、"api小写测试" 等测试用例来验证</li>
            </ol>

            <h3>其他功能</h3>
            <ul>
              <li>找到的文本会以蓝色词典链接样式显示（蓝色文字 + 虚线下划线）</li>
              <li>悬浮到高亮文本上会变为实线并显示浅蓝色背景</li>
              <li><strong>点击高亮的词汇会弹出词典卡片</strong>，显示详细解释</li>
              <li>词典卡片支持查看相关人员、链接、词条等信息</li>
              <li>可以使用左侧的快速测试按钮进行测试</li>
            </ul>

            <div class="divider"></div>

            <h3>技术实现</h3>
            <p style="color: #666; font-size: 14px;">
              本演示使用了 Range SDK 词典插件的 <code>useDictionary</code> hook：
              通过 <code>disableDefaultRequest</code> 参数禁用网络请求，
              实现了文本高亮、选区管理和词典卡片显示等功能。Hook 封装了 RangeSDK 的初始化、
              插件注册和生命周期管理，提供了简洁易用的 API 接口。
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- 提示消息 -->
    <div v-if="message" class="toast" :class="message.type">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDictionary } from '../../../../plugins/dictionary/hooks/use-dictionary'
import { useRangeSdk } from '../../../../plugins/dictionary/examples/range-kit/hooks/use-rangesdk'
import { RangeSdkAppId } from '../../../../src/types'

// 导入子组件
import WordSelectionPanel from './components/word-selection-panel.vue'
import ConfigPanel from './components/config-panel.vue'

// 导入常量和工具
import { initialWords, mockDictionary, commonHighlightStyle } from './constants/test-data'
import { useDictionaryEvents } from './hooks/use-dictionary-events'
import type { DictionaryConfig, CardStyle } from './components/config-panel.vue'

// 从URL参数和localStorage加载配置
const loadConfigFromURL = (): { cardStyle: CardStyle; config: DictionaryConfig } => {
  const defaultConfig: DictionaryConfig = {
    triggerMode: 'hover',
    cardStyle: 'default',
    highlightColor: '#3370ff',
    showUnderline: true,
    caseSensitive: false
  }

  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)

    // 获取卡片样式（优先从配置中获取）
    let cardStyle: CardStyle = 'default'

    // 获取配置
    let config = { ...defaultConfig }

    // 尝试从URL加载配置
    const urlConfig = urlParams.get('config')
    if (urlConfig) {
      try {
        const decoded = JSON.parse(atob(urlConfig))
        config = { ...config, ...decoded }
      } catch (error) {
        console.warn('URL配置解析失败，使用默认配置:', error)
      }
    } else {
      // 从localStorage加载配置
      try {
        const stored = localStorage.getItem('range-sdk-dictionary-config')
        if (stored) {
          const storedConfig = JSON.parse(stored)
          config = { ...config, ...storedConfig }
        }
      } catch (error) {
        console.warn('localStorage配置加载失败，使用默认配置:', error)
      }
    }

    // 从配置中获取卡片样式，或者从URL参数获取（向后兼容）
    cardStyle = config.cardStyle || (urlParams.get('cardStyle') as CardStyle) || 'default'
    if (cardStyle !== 'default' && cardStyle !== 'custom') {
      cardStyle = 'default'
    }

    return { cardStyle, config }
  }

  return { cardStyle: 'default', config: defaultConfig }
}

const initialData = loadConfigFromURL()
const cardStyle = ref<CardStyle>(initialData.cardStyle)

// 响应式状态
const contentRef = ref<HTMLElement | null>(null)
const selectedWords = ref(new Set<string>())

// 字典配置状态 - 使用从URL或localStorage加载的配置
const dictionaryConfig = ref<DictionaryConfig>(initialData.config)

// 使用事件处理 hook
const { message, showMessage, createEvents } = useDictionaryEvents()

// 默认词典实例 - 使用配置中的参数
const defaultDictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.dictionary-content',  // 使用CSS选择器，因为useDictionary不支持Vue ref
  useMock: initialWords,
  mockData: mockDictionary,
  highlightStyle: {
    ...commonHighlightStyle,
    color: dictionaryConfig.value.highlightColor,
    borderBottom: dictionaryConfig.value.showUnderline
      ? `1px dashed ${dictionaryConfig.value.highlightColor}`
      : 'none'
  },
  triggerMode: dictionaryConfig.value.triggerMode,
  caseSensitive: dictionaryConfig.value.caseSensitive,
  events: createEvents(),
  debug: true,
  autoInit: false
})

// Range-Kit 词典实例
const demoData = ref({ initialized: true })
const rangeKitDictionary = useRangeSdk({
  data: demoData,
  containerRef: contentRef,
  words: initialWords,
  appid: RangeSdkAppId.RANGE_SDK + 2,
  autoInit: false,
  disableDefaultRequest: true
})

// 根据当前样式返回对应的词典实例
const getCurrentDictionary = () => {
  switch (dictionaryConfig.value.cardStyle) {
    case 'custom':
      return rangeKitDictionary
    default:
      return defaultDictionary
  }
}

// 导出响应式接口
const isReady = computed(() => getCurrentDictionary().isReady.value)
const initDictionary = (options: any) => getCurrentDictionary().initDictionary(options)
const clearHighlights = () => {
  defaultDictionary.clearHighlights()
  rangeKitDictionary.clearHighlights()
}


// 应用词汇选择 - 高亮选中的词汇
const handleApplyWordSelection = async (): Promise<void> => {
  if (selectedWords.value.size === 0) {
    showMessage('请先选择要高亮的词汇', 'warning')
    return
  }

  const words = Array.from(selectedWords.value)
  console.log(`🎯 应用词汇选择(${dictionaryConfig.value.cardStyle}模式): ${words.join(', ')}`)

  try {
    if (dictionaryConfig.value.cardStyle === 'custom') {
      // 只操作自定义卡片实例
      await rangeKitDictionary.manualInit(words)
    } else {
      // 只操作默认词典实例
      await defaultDictionary.initDictionary({
        words: words.map(word => ({ word, appid: RangeSdkAppId.RANGE_SDK }))
      })
    }
    showMessage(`已高亮选中的 ${words.length} 个词汇`, 'success')
  } catch (error) {
    console.error('词汇选择应用失败:', error)
    showMessage('词汇选择应用失败，请重试', 'error')
  }
}

// 手动初始化自定义卡片
const handleManualInit = async () => {
  try {
    await rangeKitDictionary.manualInit()
    showMessage('自定义卡片词典手动初始化成功', 'success')
  } catch (error) {
    console.error('手动初始化失败:', error)
    showMessage('手动初始化失败，请重试', 'error')
  }
}

// 调试当前状态
const debugCurrentState = () => {
  console.log('🔍 当前词典状态调试:')
  console.log('- 当前配置:', dictionaryConfig.value)
  console.log('- 默认词典就绪:', defaultDictionary.isReady.value)
  console.log('- 自定义卡片词典初始化:', rangeKitDictionary.isInitialized())
}

// 处理配置保存
const handleConfigSave = (config: DictionaryConfig) => {
  console.log('💾 保存新配置:', config)
  dictionaryConfig.value = { ...config }

  // 动态更新词典插件的 caseSensitive 配置
  if (defaultDictionary.rangeSDK.value?.dictionary) {
    defaultDictionary.rangeSDK.value.dictionary.setCaseSensitive(config.caseSensitive)
    console.log('📝 已更新默认词典的大小写敏感配置:', config.caseSensitive)
  }

  // 配置面板会自动处理刷新，这里不需要额外操作
}


// 组件挂载时初始化 - 根据配置决定初始化哪个词典实例
onMounted(async () => {
  console.log(`🚀 页面加载，当前配置:`, dictionaryConfig.value)

  // 默认选择所有初始词汇
  selectedWords.value = new Set(initialWords)
  console.log(`📝 默认选择词汇: ${initialWords.join(', ')}`)

  try {
    if (dictionaryConfig.value.cardStyle === 'custom') {
      // 只初始化自定义卡片实例
      console.log('🎨 初始化自定义卡片...')
      await rangeKitDictionary.manualInit(initialWords)
      console.log('✅ 自定义卡片初始化完成')
    } else {
      // 只初始化默认词典实例
      console.log('📋 初始化默认词典...')
      await defaultDictionary.initDictionary({
        words: initialWords.map(word => ({
          word,
          appid: RangeSdkAppId.RANGE_SDK
        }))
      })
      console.log('✅ 默认词典初始化完成')
    }

    // 输出当前状态
    debugCurrentState()
  } catch (error) {
    console.error(`${dictionaryConfig.value.cardStyle}词典初始化失败:`, error)
    showMessage('词典初始化失败，请刷新页面重试', 'error')
  }
})
</script>

<style>
/* 导入分离的样式文件 */
@import './styles/layout.css';
@import './styles/panel.css';
@import './styles/content.css';
@import './styles/toast.css';
</style>