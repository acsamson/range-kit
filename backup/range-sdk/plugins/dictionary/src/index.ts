import { App, Plugin } from 'vue'
import DictionaryCardLazy from './components/dictionary-card-lazy.vue'
import * as Types from './types'
import * as PluginExports from './plugin'
import * as RangeTypes from './range-sdk-types'
import { generateMockData } from '../helpers'
import { useDictionary } from '../hooks'
import { DictionaryPlugin, createDictionaryPlugin } from './plugin'
import type { DictionaryAPI } from './plugin'
// 单独导入 hooks 的类型和值
import type { 
  UseDictionaryOptions as HooksUseDictionaryOptions, 
  UseDictionaryReturn as HooksUseDictionaryReturn, 
  DictionaryEvents as HooksDictionaryEvents 
} from '../hooks'

// 导出组件
export { DictionaryCardLazy as DictionaryCard }

// 导出类型
export * from './types'

// 导出 Range SDK 插件（主要使用方式）
export { DictionaryPlugin, createDictionaryPlugin } from './plugin'
export type { DictionaryAPI, DictionaryPluginConfig } from './plugin'

// 导出 Range SDK 集成类型
export type {
  RangeSDKWithDictionary,
  RangeSDKWithPlugins,
  RangeSDKEvents,
  RangeSDKEventName,
  RangeData,
  MarkData,
  CommentData,
  HighlightInstance
} from './range-sdk-types'
export { asRangeSDKWithDictionary, RangeSDKEventType } from './range-sdk-types'

// 导出 Vue Composition API Hook
export { useDictionary } from '../hooks'
export { generateMockData as createDictionaryMockData } from '../helpers'

export type { 
  UseDictionaryOptions, 
  UseDictionaryReturn,
  DictionaryEvents,
} from '../hooks'

// 创建 Dictionary 命名空间，方便外部使用
export namespace Dictionary {
  // 从外部导入的类型，使用 type 别名
  export type WordData = Types.WordData
  export type DictionaryConfig = Types.DictionaryConfig
  export type HighlightStyle = Types.HighlightStyle
  export type HighlightResult = Types.HighlightResult
  export type DictionaryCardProps = Types.DictionaryCardProps
  export type SimpleWord = Types.SimpleWord
  
  // 插件相关
  export type DictionaryAPI = PluginExports.DictionaryAPI
  export type DictionaryPluginConfig = PluginExports.DictionaryPluginConfig
  export const Plugin = DictionaryPlugin
  export const createPlugin = createDictionaryPlugin
  
  // Range SDK 集成类型
  export type RangeSDKWithDictionary<T extends DictionaryAPI = DictionaryAPI> = RangeTypes.RangeSDKWithDictionary<T>
  export type RangeSDKWithPlugins<T extends Record<string, any> = Record<string, any>> = RangeTypes.RangeSDKWithPlugins<T>
  export type RangeSDKEvents = RangeTypes.RangeSDKEvents
  export type RangeSDKEventName = RangeTypes.RangeSDKEventName
  export type RangeData = RangeTypes.RangeData
  export type MarkData = RangeTypes.MarkData
  
  // Vue Hooks - 使用重命名的导入
  export type UseDictionaryOptions = HooksUseDictionaryOptions
  export type UseDictionaryReturn = HooksUseDictionaryReturn
  export type DictionaryEvents = HooksDictionaryEvents
  
  // 组件
  export const Card = DictionaryCardLazy
  
  // 工具函数
  export const use = useDictionary
  export const createMockData = generateMockData
  
  // 常量
  export const LocalStorageReqParamsKey = 'dictionaryExtraParams'
}

// Vue 插件安装（用于 Vue 应用中直接使用组件）
const install: Plugin = (app: App) => {
  // 注册全局组件
  app.component('DictionaryCard', DictionaryCardLazy)
}

export default {
  install,
  // 同时导出 namespace 作为默认导出的一部分
  Dictionary
}
