import DefaultTheme from 'vitepress/theme'
import Mermaid from '../components/Mermaid.vue'
import { h } from 'vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    
    app.component('Mermaid', Mermaid)
    
    // 创建 Mermaid 包装组件
    app.component('MermaidWrapper', {
      props: ['code', 'isBase64'],
      setup(props) {
        // 如果是 Base64 编码，先解码
        let content = props.code
        if (props.isBase64) {
          try {
            // 解码 Base64
            const decoded = atob(props.code)
            // 将解码后的字符串转换为 UTF-8
            content = decodeURIComponent(escape(decoded))
          } catch (e) {
            // 如果解码失败，尝试直接使用
            console.warn('Base64 解码失败，使用原始内容', e)
            content = props.code
          }
        }
        return () => h(Mermaid, { content })
      }
    })
  }
}