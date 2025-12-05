/// <reference types="vue/macros-global" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Vue 3 全局编译器宏
declare global {
  const defineProps: typeof import('vue')['defineProps']
  const defineEmits: typeof import('vue')['defineEmits']
  const defineExpose: typeof import('vue')['defineExpose']
  const withDefaults: typeof import('vue')['withDefaults']
} 