/**
 * 词典演示事件处理 Hook
 * 提供统一的事件处理逻辑
 */
import { ref } from 'vue'

// 消息类型定义
export interface Message {
  text: string
  type: 'info' | 'success' | 'warning' | 'error'
}

/**
 * 词典事件处理 Hook
 */
export function useDictionaryEvents() {
  const message = ref<Message | null>(null)

  // 显示消息
  const showMessage = (text: string, type: Message['type'] = 'info') => {
    message.value = { text, type }
    setTimeout(() => {
      message.value = null
    }, 3000)
  }

  // 创建通用事件处理函数
  const createEvents = () => ({
    onHighlightComplete: (words: string[]) => {
      console.log('高亮完成，词汇：', words)
    },
    onSearchComplete: (results: any[]) => {
      console.log('搜索完成，结果：', results)
    },
    onError: (error: Error) => {
      console.error('词典错误：', error)
      showMessage('操作失败，请重试', 'error')
    },
  })

  return {
    message,
    showMessage,
    createEvents,
  }
}