<template>
  <div class="mermaid-wrapper">
    <div ref="mermaidRef" class="mermaid-content">{{ content }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  content: {
    type: String,
    required: true
  }
})

const mermaidRef = ref(null)
let mermaidApi = null

// 动态加载 Mermaid
const loadMermaid = async () => {
  if (typeof window === 'undefined') return
  
  if (!window.mermaid) {
    // 创建 script 标签
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
    script.async = true
    document.head.appendChild(script)
    
    // 等待加载完成
    await new Promise((resolve) => {
      script.onload = resolve
    })
  }
  
  // 初始化 Mermaid
  window.mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    themeVariables: {
      primaryColor: '#42b883',
      primaryTextColor: '#2c3e50',
      primaryBorderColor: '#42b883',
      lineColor: '#5a5a5a',
      secondaryColor: '#f3f4f6',
      tertiaryColor: '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    },
    flowchart: {
      htmlLabels: true,
      useMaxWidth: true
    }
  })
  
  mermaidApi = window.mermaid
}

// 渲染图表
const renderChart = async () => {
  if (!mermaidRef.value || !mermaidApi) return
  
  try {
    // 清空内容
    mermaidRef.value.textContent = ''
    mermaidRef.value.removeAttribute('data-processed')
    
    // 生成唯一 ID
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 确保内容是正确的 UTF-8 编码
    const content = props.content
    
    // 渲染
    const { svg } = await mermaidApi.render(id, content)
    
    // 处理 SVG 中的中文字符
    const processedSvg = svg.replace(/font-family="[^"]*"/g, 'font-family="Arial, \'PingFang SC\', \'Microsoft YaHei\', sans-serif"')
    
    mermaidRef.value.innerHTML = processedSvg
  } catch (error) {
    console.error('Mermaid 渲染错误:', error)
    mermaidRef.value.innerHTML = `<pre style="color: red;">Mermaid 渲染错误:\n${error.message}</pre>`
  }
}

onMounted(async () => {
  await loadMermaid()
  await renderChart()
})

// 监听内容变化
watch(() => props.content, async () => {
  await nextTick()
  await renderChart()
})
</script>

<style scoped>
.mermaid-wrapper {
  margin: 1.5em 0;
  overflow-x: auto;
}

.mermaid-content {
  text-align: center;
  min-height: 100px;
}

.mermaid-content :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>