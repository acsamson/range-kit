import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/range-kit/',
  title: "Range Kit",
  description: "A powerful range selection and highlighting toolkit.",
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/acsamson/range-kit' }
    ]
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'Core', link: '/core/' },
          { text: 'React', link: '/react/' },
          { text: 'Vue', link: '/vue/' }
        ],
        sidebar: {
          '/core/': [
            {
              text: 'Core',
              items: [
                { text: 'Introduction', link: '/core/' },
                { text: 'Architecture', link: '/core/architecture' },
                { text: 'API Reference', link: '/core/api' }
              ]
            }
          ],
          '/react/': [
            {
              text: 'React',
              items: [
                { text: 'Introduction', link: '/react/' },
                { text: 'Components', link: '/react/components' },
                { text: 'Hooks', link: '/react/hooks' }
              ]
            }
          ],
          '/vue/': [
            {
              text: 'Vue',
              items: [
                { text: 'Introduction', link: '/vue/' },
                { text: 'Components', link: '/vue/components' },
                { text: 'Composables', link: '/vue/composables' }
              ]
            }
          ],
          '/guide/': [
            {
              text: 'Guide',
              items: [
                { text: 'Getting Started', link: '/guide/getting-started' }
              ]
            }
          ]
        }
      }
    },
    zh: {
      label: '简体中文',
      lang: 'zh',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/getting-started' },
          { text: '核心库', link: '/zh/core/' },
          { text: 'React', link: '/zh/react/' },
          { text: 'Vue', link: '/zh/vue/' }
        ],
        sidebar: {
          '/zh/core/': [
            {
              text: '核心库',
              items: [
                { text: '简介', link: '/zh/core/' },
                { text: '架构', link: '/zh/core/architecture' },
                { text: 'API 参考', link: '/zh/core/api' }
              ]
            }
          ],
          '/zh/react/': [
            {
              text: 'React',
              items: [
                { text: '简介', link: '/zh/react/' },
                { text: '组件', link: '/zh/react/components' },
                { text: 'Hooks', link: '/zh/react/hooks' }
              ]
            }
          ],
          '/zh/vue/': [
            {
              text: 'Vue',
              items: [
                { text: '简介', link: '/zh/vue/' },
                { text: '组件', link: '/zh/vue/components' },
                { text: 'Composables', link: '/zh/vue/composables' }
              ]
            }
          ],
          '/zh/guide/': [
            {
              text: '指南',
              items: [
                { text: '快速开始', link: '/zh/guide/getting-started' }
              ]
            }
          ]
        }
      }
    }
  }
})
