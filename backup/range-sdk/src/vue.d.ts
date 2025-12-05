/**
 * Vue 3 类型定义文件
 * 用于解决在当前构建环境下 Vue 模块类型解析的问题
 */

declare module 'vue' {
  // 基础响应式类型
  interface VueRef<T = any> {
    value: T
  }

  interface ComputedRef<T = any> extends VueRef<T> {
    readonly value: T
  }

  type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
  }

  type UnwrapNestedRefs<T> = T extends VueRef<any> ? T : T extends object ? {
    [K in keyof T]: UnwrapNestedRefs<T[K]>
  } : T

  // 响应式 API
  export function ref<T = any>(): VueRef<T | undefined>
  export function ref<T = any>(value: T): VueRef<T>
  export function reactive<T extends object>(target: T): UnwrapNestedRefs<T>
  export function readonly<T>(target: T): DeepReadonly<T>
  export function computed<T>(getter: () => T): ComputedRef<T>
  export function computed<T>(options: {
    get: () => T
    set: (value: T) => void
  }): ComputedRef<T>

  // 生命周期钩子
  export function onMounted(hook: () => void): void
  export function onUnmounted(hook: () => void): void
  export function onBeforeMount(hook: () => void): void
  export function onBeforeUnmount(hook: () => void): void
  export function onUpdated(hook: () => void): void
  export function onBeforeUpdate(hook: () => void): void

  // 类型导出
  export type Ref<T = any> = VueRef<T>

  // 工具函数
  export function nextTick(fn?: () => void): Promise<void>
  export function watch<T>(
    source: T,
    callback: (newValue: T, oldValue: T) => void,
    options?: { immediate?: boolean; deep?: boolean }
  ): () => void
  export function watchEffect(effect: () => void): () => void

  // 工具类型
  export type UnwrapRef<T> = T extends VueRef<infer V> ? V : T
}

export {}