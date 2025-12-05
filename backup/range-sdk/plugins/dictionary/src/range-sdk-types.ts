// Range SDK 类型声明
// 这个文件定义了与 Range SDK 集成时需要的类型

import type { DictionaryAPI } from './plugin'

// 重新导出主包的核心类型（避免直接依赖主包内部路径）
export type { RangePlugin, PluginContext, PluginAPI } from '../../../src/core/plugin-manager'
export type { RangeData as MainRangeData } from '../../../src/types'

// Range SDK 事件数据类型
export interface RangeData {
  id: string
  selectedText: string
  pageUrl: string
  timestamp: number
  startContainerPath: string
  startOffset: number
  endContainerPath: string
  endOffset: number
  rect?: {
    x: number
    y: number
    width: number
    height: number
    top: number
    right: number
    bottom: number
    left: number
  }
  contextBefore?: string
  contextAfter?: string
}

export interface MarkData {
  id: string
  type: 'comment' | 'dictionary' | 'highlight'
  userId?: string
  isPublic: boolean
  isResolved?: boolean
  metadata?: Record<string, any>
}

export interface CommentData {
  id: string
  markId: string
  content: string
  authorId: string
  authorName: string
  timestamp: number
  createdAt: number
  parentId?: string
  isResolved: boolean
  isPinned: boolean
  isEdited?: boolean
  reactions?: { [emoji: string]: string[] }
}

export interface HighlightInstance {
  id: string
  range: Range
  style: Record<string, any>
  createdAt: number
  isPersistent: boolean
  metadata?: Record<string, any>
}

// Range SDK 事件类型（类型安全的事件定义）
export interface RangeSDKEvents {
  'range-selected': (data: RangeData) => void
  'mark-created': (data: MarkData) => void
  'mark-clicked': (data: MarkData) => void
  'comment-created': (data: CommentData) => void
  'comment-updated': (data: CommentData) => void
  'highlight-created': (instance: HighlightInstance) => void
  'highlight-removed': (instance: HighlightInstance) => void
}

// 事件名称枚举（提供更好的智能提示）
export enum RangeSDKEventType {
  RANGE_SELECTED = 'range-selected',
  MARK_CREATED = 'mark-created',
  MARK_CLICKED = 'mark-clicked',
  COMMENT_CREATED = 'comment-created',
  COMMENT_UPDATED = 'comment-updated',
  HIGHLIGHT_CREATED = 'highlight-created',
  HIGHLIGHT_REMOVED = 'highlight-removed'
}

// 事件名称类型
export type RangeSDKEventName = keyof RangeSDKEvents

// 基础 RangeSDK 接口（最小化定义）
export interface BaseRangeSDK {
  // 核心方法
  registerPlugin<T>(plugin: any): Promise<any>
  unregisterPlugin(pluginId: string): void
  getPlugin<T>(pluginId: string): T | undefined
  getPluginAPI<T>(pluginId: string): T | undefined

  // 选区管理
  getCurrentSelection(): Promise<any>
  clearSelection(): void
  restoreSelection(rangeData: any): Promise<Range | null>
  highlightRange(rangeData: any, duration?: number): Promise<string | null>
  clearAllHighlights(): void

  // 类型安全的事件系统
  on<K extends RangeSDKEventName>(event: K, listener: RangeSDKEvents[K]): void
  off<K extends RangeSDKEventName>(event: K, listener: RangeSDKEvents[K]): void

  // 生命周期
  destroy(): void
}

// 带词典插件的 RangeSDK 类型
export interface RangeSDKWithDictionary<T extends DictionaryAPI = DictionaryAPI> extends BaseRangeSDK {
  dictionary: T
}

// 通用的带插件的 RangeSDK 类型
export type RangeSDKWithPlugins<T extends Record<string, any>> = BaseRangeSDK & T

// 类型辅助函数，用于安全的类型转换
export function asRangeSDKWithDictionary<T extends DictionaryAPI>(
  sdk: any
): RangeSDKWithDictionary<T> {
  return sdk as RangeSDKWithDictionary<T>
}

// 导出常用类型
// 注意：DictionaryAPI 在 plugin.ts 中定义，避免循环依赖
