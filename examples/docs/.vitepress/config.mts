import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  title: 'RangeSDK',
  description: '基于 DOM Range API 的划词操作组件',
  srcDir: './',
  base: '/range-sdk/',

  vite: {
    resolve: {
      alias: {
        '@life2code/range-kit-core': fileURLToPath(new URL('../../core/src', import.meta.url)),
        '@life2code/range-kit': fileURLToPath(new URL('../../core/src', import.meta.url)) // Backwards compatibility
      }
    },
    ssr: {
      noExternal: ['@life2code/range-kit-core', '@life2code/range-kit']
    },
    optimizeDeps: {
      force: true
    }
  },
  
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/installation' },
      { text: 'API', link: '/api/core-api' },
      { text: '插件', link: '/plugins/development-guide' },
      { text: '最佳实践', link: '/best-practices/dictionary-plugin' },
      { text: 'Playground', link: '/playground/' }
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: '安装', link: '/guide/installation' },
            { text: '快速开始', link: '/guide/quick-start' },
            { text: 'Vue Hooks 快速接入', link: '/guide/vue-hooks-quick-start' },
            { text: '核心概念', link: '/guide/core-concepts' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '核心 API', link: '/api/core-api' },
            { text: '插件系统', link: '/api/plugin-system' },
            { text: '性能监控', link: '/api/performance-monitoring' },
            { text: '类型定义', link: '/api/type-reference' }
          ]
        }
      ],
      '/plugins/': [
        {
          text: '插件开发',
          items: [
            { text: '开发指南', link: '/plugins/development-guide' }
          ]
        }
      ],
      '/best-practices/': [
        {
          text: '最佳实践',
          items: [
            { text: 'Dictionary 插件', link: '/best-practices/dictionary-plugin' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: '架构设计',
          items: [
            { text: '架构概览', link: '/architecture/overview' }
          ]
        }
      ],
      '/': [
        {
          text: '文档',
          items: [
            { text: '首页', link: '/' },
            { text: '故障排除', link: '/troubleshooting' },
            { text: '架构设计', link: '/architecture/overview' }
          ]
        }
      ],
      '/playground/': [
        {
          text: 'Playground',
          items: [
            { text: '概览', link: '/playground/' },
            { text: '选区管理演示', link: '/playground/selection' },
            { text: 'Dictionary 插件', link: '/playground/dictionary' },
            { text: '标记功能', link: '/playground/marks' },
            { text: '性能监控', link: '/playground/performance' },
            { text: 'TipTap 编辑器', link: '/playground/tiptap' },
            { text: 'Selection Restore', link: '/playground/selection-restore' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/life2code/range-kit' }
    ],
    
    footer: false
  },
  
  markdown: {
    lineNumbers: true,
    config: (md) => {
      // 处理 Mermaid 代码块
      const fence = md.renderer.rules.fence!.bind(md.renderer.rules)
      md.renderer.rules.fence = (tokens, idx, options, env, renderer) => {
        const token = tokens[idx]
        if (token.info === 'mermaid') {
          const code = token.content.trim()
          // 使用 UTF-8 编码的 Base64
          const encodedCode = Buffer.from(code, 'utf8').toString('base64')
          return `<MermaidWrapper :code="'${encodedCode}'" :isBase64="true" />`
        }
        return fence(tokens, idx, options, env, renderer)
      }
    }
  },
  
  // 自定义页面配置
  transformPageData(pageData) {
    // 为 playground 页面设置自定义布局
    if (pageData.relativePath.startsWith('playground/')) {
      pageData.frontmatter = pageData.frontmatter || {}
      pageData.frontmatter.layout = 'page'
      pageData.frontmatter.navbar = false
      pageData.frontmatter.sidebar = false
      pageData.frontmatter.aside = false
      pageData.frontmatter.outline = false
    }
  },
  
  ignoreDeadLinks: [
    /^\/lib\/selection-restore\/docs\//,
    /^\/demo\//
  ]
})