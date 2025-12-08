import { ref, computed } from 'vue'
import type {
  PopoverItem,
  PopoverItemType,
  PopoverData as KitPopoverData,
  PopoverPosition
} from 'range-kit-vue'
import { usePopover as useKitPopover } from 'range-kit-vue'

export type SelectionItemType = PopoverItemType
export type SelectionItem = PopoverItem
export type { PopoverPosition }

/**
 * 词典卡片配置（仅用于搜索高亮）
 * 注意：这是 Demo 特有的扩展，Kit 的 PopoverData 也有此字段
 */
export interface DictionaryCardDisplayConfig {
  /** 卡片标题 */
  title: string
  /** 卡片内容模板，可使用 {{keyword}} 作为占位符 */
  contentTemplate: string
  /** 是否在卡片中显示关键词 */
  showKeyword: boolean
}

/**
 * 气泡数据类型
 * 扩展自 Kit 的 PopoverData，添加 Demo 特有的字段
 */
export interface PopoverData extends Omit<KitPopoverData, 'position'> {
  /** 位置信息（可选，Demo 中有些场景不需要） */
  position?: PopoverPosition | null
  /** 词典卡片配置（仅当包含搜索高亮时使用） */
  dictionaryConfig?: DictionaryCardDisplayConfig
}

/**
 * 气泡状态管理 Hook
 */
export function usePopover() {
  const kitPopover = useKitPopover({
    placement: 'top',
    offset: 8,
    padding: 8,
    closeOnClickOutside: true,
    closeOnScroll: false
  })

  // ========== 响应式状态 ==========

  /** 词典配置 (本地状态) */
  const dictionaryConfig = ref<DictionaryCardDisplayConfig | undefined>(undefined)

  // ========== 方法 ==========

  /**
   * 显示气泡
   * @param data - 气泡数据
   */
  const showPopover = (newData: PopoverData): void => {
    const { dictionaryConfig: dictConfig, ...coreData } = newData
    dictionaryConfig.value = dictConfig
    
    kitPopover.show({
      ...coreData,
      position: coreData.position || null
    })
  }

  /**
   * 从气泡数据中移除指定选区项
   * @param itemId - 要移除的选区项 ID
   * @returns 是否还有剩余选区项
   */
  const removeItemFromData = (itemId: string): boolean => {
    const currentItems = kitPopover.data.value.items
    const newItems = currentItems.filter(item => item.id !== itemId)
    
    // 如果没有剩余项，自动隐藏气泡
    if (newItems.length === 0) {
      kitPopover.hide()
      return false
    } else {
      // 更新数据，保持其他属性不变
      kitPopover.show({
        ...kitPopover.data.value,
        items: newItems,
        timestamp: Date.now()
      })
      return true
    }
  }

  /**
   * 更新指定选区项的类型（如从 search 变为 saved）
   * @param itemId - 选区项 ID
   * @param newType - 新类型
   */
  const updateItemType = (itemId: string, newType: SelectionItemType): void => {
    const currentItems = kitPopover.data.value.items
    const newItems = currentItems.map(item => 
      item.id === itemId ? { ...item, itemType: newType } : item
    )
    
    kitPopover.show({
      ...kitPopover.data.value,
      items: newItems
    })
  }

  // ========== 返回接口 ==========
  return {
    ...kitPopover,
    // Explicitly expose SDK properties to ensure they are available
    floatingRef: kitPopover.floatingRef,
    floatingStyles: kitPopover.floatingStyles,
    isPositioned: kitPopover.isPositioned,
    
    // 新 API (Override/Extend)
    popoverVisible: kitPopover.visible,
    popoverData: computed(() => ({
      ...kitPopover.data.value,
      dictionaryConfig: dictionaryConfig.value
    })),
    showPopover,
    hidePopover: kitPopover.hide,
    hidePopoverDelayed: kitPopover.hideDelayed,
    removeItemFromData,
    updateItemType
  }
}

/**
 * Hook 返回值类型
 */
export type UsePopoverReturn = ReturnType<typeof usePopover>
