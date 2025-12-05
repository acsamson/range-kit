// 插件类型辅助工具

import type { RangeSDK } from '../core/range-sdk-with-plugins'
import type { PluginAPI } from '../core/plugin-manager'

// 基础 RangeSDK 类型
export type BaseRangeSDK = RangeSDK

// 带插件的 RangeSDK 类型辅助
export type RangeSDKWithPlugins<T extends Record<string, PluginAPI>> = BaseRangeSDK & T

// 常用插件类型组合
export interface CommonPlugins extends Record<string, PluginAPI> {
  // 词典插件会在导入时自动添加
  // dictionary?: DictionaryAPI
}

// 默认的 RangeSDK 类型（可以根据项目需要扩展）
export type MyRangeSDK = RangeSDKWithPlugins<CommonPlugins>

// 类型辅助函数
export function createTypedRangeSDK<T extends Record<string, PluginAPI>>(): RangeSDKWithPlugins<T> | null {
  return null
}

// 词典插件专用类型（当导入词典插件时使用）
export type RangeSDKWithDictionary<T extends PluginAPI = any> = RangeSDKWithPlugins<{ dictionary: T }>

// 多插件组合类型辅助
export type WithDictionary<T extends PluginAPI> = { dictionary: T }
export type WithComment<T extends PluginAPI> = { comment: T }
export type WithHighlight<T extends PluginAPI> = { highlight: T }

// 组合多个插件类型
export type CombinePlugins<T1, T2 = {}, T3 = {}, T4 = {}> = T1 & T2 & T3 & T4
