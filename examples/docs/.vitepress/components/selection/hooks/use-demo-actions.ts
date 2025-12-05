import { ElMessage } from 'element-plus'
import type { Ref } from 'vue'
import type { SerializedSelection } from '../../../../../src/core/selection-restore'
import { convertToSimple } from '../../../../../vue/hooks'
import type { UseSearchHighlightReturn } from '../../../../../vue/hooks/use-search-highlight/types'

/**
 * Demo 操作配置选项
 */
export interface UseDemoActionsOptions {
  /** 当前选区列表 */
  currentSelections: Ref<SerializedSelection[]>
  /** 恢复选区列表 */
  restoreSelections: (selections: SerializedSelection[], enableAutoScroll?: boolean) => Promise<void>
  /** 清除所有高亮 */
  clearAllSelections: () => void
  /** 清空所有选区数据 */
  clearAllSelectionsData: () => Promise<void>
  /** 添加搜索关键词 */
  addSearchKeyword: UseSearchHighlightReturn['addSearchKeyword']
  /** Mock 数据 */
  mockSelections: SerializedSelection[]
}

/**
 * Demo 专用功能 Hook
 *
 * @description
 * 提供 Demo 页面特有的功能，包括：
 * - 导出数据
 * - 打印数据到控制台
 * - 加载预设 mock 数据
 * - 过滤搜索示例
 *
 * 注意：这些功能仅用于 Demo 演示，实际业务中可能不需要
 *
 * @example
 * ```ts
 * const {
 *   handleExportData,
 *   handlePrintData,
 *   handleLoadMockData,
 *   handleClearPreset,
 *   handleSearchWithFilter,
 *   handleSearchFilterFirst
 * } = useDemoActions({
 *   currentSelections,
 *   restoreSelections,
 *   clearAllSelections,
 *   clearAllSelectionsData,
 *   addSearchKeyword,
 *   mockSelections
 * })
 *
 * // 导出数据
 * handleExportData()
 *
 * // 加载预设数据
 * await handleLoadMockData()
 * ```
 */
export function useDemoActions(options: UseDemoActionsOptions) {
  const {
    currentSelections,
    restoreSelections,
    clearAllSelections,
    clearAllSelectionsData,
    addSearchKeyword,
    mockSelections
  } = options

  /**
   * 导出数据（Demo 功能）
   * 将选区数据导出为 JSON 文件
   */
  const handleExportData = (): void => {
    const data = {
      exportTime: new Date().toISOString(),
      selections: currentSelections.value
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `selection-data-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出完成')
  }

  /**
   * 打印数据到控制台（Demo 功能）
   * 同时打印原始数据和过滤后的精简数据
   */
  const handlePrintData = (): void => {
    const originalData = currentSelections.value
    const simpleData = originalData.map(convertToSimple)

    console.log('=== 选区数据 ===')
    console.log('原始数据 (完整):', originalData)
    console.log('精简数据 (过滤后):', simpleData)
    console.log('================')
  }

  /**
   * 选区项点击（Demo 功能）
   * 仅用于日志输出
   */
  const handleSelectionClick = (selection: SerializedSelection): void => {
    console.log('选区项被点击:', selection.id)
  }

  /**
   * 加载预设 mock 数据
   */
  const handleLoadMockData = async (): Promise<void> => {
    try {
      console.log('=== 加载预设选区数据 ===')
      console.log('预设数据:', mockSelections)

      // 先清除现有高亮
      clearAllSelections()

      // 恢复 mock 选区
      await restoreSelections(mockSelections, false)

      console.log('加载完成，当前选区数量:', currentSelections.value.length)
      console.log('========================')

      ElMessage.success(`成功加载 ${mockSelections.length} 个预设选区`)
    } catch (err: any) {
      console.error('加载预设数据失败:', err)
      ElMessage.error('加载预设数据失败: ' + err.message)
    }
  }

  /**
   * 清除预设数据
   */
  const handleClearPreset = async (): Promise<void> => {
    try {
      clearAllSelections()
      await clearAllSelectionsData()
      ElMessage.success('已清除所有预设数据')
    } catch (err: any) {
      ElMessage.error('清除预设数据失败: ' + err.message)
    }
  }

  /**
   * 加载出师表选区并搜索"中"
   * 组合操作：先加载预设选区，再执行搜索
   */
  const handleLoadMockDataAndSearch = async (): Promise<void> => {
    try {
      console.log('=== 加载出师表选区并搜索"中" ===')

      // 先清除现有高亮
      clearAllSelections()

      // 恢复 mock 选区
      await restoreSelections(mockSelections, false)
      console.log('预设选区加载完成，数量:', mockSelections.length)

      // 执行搜索"中"
      const keyword = '中'
      const type = 'search'

      const result = await addSearchKeyword(keyword, type, {
        caseSensitive: false,
        wholeWord: false
      })

      if (result) {
        ElMessage.success(`已加载 ${mockSelections.length} 个选区，并找到 ${result.matchCount} 个"${keyword}"`)
      } else {
        ElMessage.success(`已加载 ${mockSelections.length} 个选区`)
      }

      console.log('================================')
    } catch (err: any) {
      console.error('加载并搜索失败:', err)
      ElMessage.error('加载并搜索失败: ' + err.message)
    }
  }

  /**
   * 搜索"中"并过滤掉重叠选区
   * 演示 filterMatches 过滤函数的使用
   */
  const handleSearchWithFilter = async (): Promise<void> => {
    try {
      const keyword = '中'
      const type = 'search'

      const result = await addSearchKeyword(keyword, type, {
        caseSensitive: false,
        wholeWord: false,
        // 使用过滤函数：过滤掉与已有选区重叠的匹配项
        filterMatches: (items, kw) => {
          console.log('========== 过滤函数执行 ==========')
          console.log(`关键词: "${kw}"`)
          console.log(`过滤前 (${items.length} 个):`, items.map(item => ({
            index: item.index,
            text: item.text,
            hasOverlap: item.hasOverlap,
            overlappedSelectionIds: item.overlappedSelectionIds,
            overlaps: item.overlaps
          })))

          const filtered = items.filter(item => !item.hasOverlap)

          console.log(`过滤后 (${filtered.length} 个):`, filtered.map(item => ({
            index: item.index,
            text: item.text
          })))
          console.log('===================================')

          return filtered
        }
      })

      if (result) {
        if (result.matchCount > 0) {
          ElMessage.success(`找到 ${result.matchCount} 个匹配项（已过滤重叠选区）`)
        } else {
          ElMessage.warning(`未找到关键词 "${keyword}"（所有匹配项都与已有选区重叠）`)
        }
      }
    } catch (err: any) {
      ElMessage.error('搜索失败: ' + err.message)
    }
  }

  /**
   * 搜索"中"并过滤掉重叠选区，只展示第一个高亮
   * 演示 filterMatches 过滤函数的组合使用
   */
  const handleSearchFilterFirst = async (): Promise<void> => {
    try {
      const keyword = '中'
      const type = 'search'

      const result = await addSearchKeyword(keyword, type, {
        caseSensitive: false,
        wholeWord: false,
        // 使用过滤函数：过滤掉重叠选区，并只保留第一个
        filterMatches: (items, kw) => {
          console.log('========== 过滤函数执行（只展示第一个） ==========')
          console.log(`关键词: "${kw}"`)
          console.log(`过滤前 (${items.length} 个):`, items.map(item => ({
            index: item.index,
            text: item.text,
            hasOverlap: item.hasOverlap,
            overlappedSelectionIds: item.overlappedSelectionIds
          })))

          // 先过滤掉重叠的
          const nonOverlapping = items.filter(item => !item.hasOverlap)
          console.log(`过滤重叠后 (${nonOverlapping.length} 个)`)

          // 只保留第一个
          const firstOnly = nonOverlapping.slice(0, 1)
          console.log(`只保留第一个:`, firstOnly.map(item => ({
            index: item.index,
            text: item.text
          })))
          console.log('================================================')

          return firstOnly
        }
      })

      if (result) {
        if (result.matchCount > 0) {
          ElMessage.success(`只展示第一个匹配项（已过滤重叠选区）`)
        } else {
          ElMessage.warning(`未找到关键词 "${keyword}"（所有匹配项都与已有选区重叠）`)
        }
      }
    } catch (err: any) {
      ElMessage.error('搜索失败: ' + err.message)
    }
  }

  // ========== 返回接口 ==========
  return {
    handleExportData,
    handlePrintData,
    handleSelectionClick,
    handleLoadMockData,
    handleClearPreset,
    handleLoadMockDataAndSearch,
    handleSearchWithFilter,
    handleSearchFilterFirst
  }
}

/**
 * Hook 返回值类型
 */
export type UseDemoActionsReturn = ReturnType<typeof useDemoActions>
