import { useState, useCallback } from 'react'
import type {
  PopoverItem,
  PopoverItemType,
  PopoverData as KitPopoverData,
  PopoverPosition
} from 'range-kit-react'
import { usePopover as useKitPopover } from 'range-kit-react'

export type SelectionItemType = PopoverItemType
export type SelectionItem = PopoverItem
export type { PopoverPosition }

export interface DictionaryCardDisplayConfig {
  title: string
  contentTemplate: string
  showKeyword: boolean
  enabled?: boolean
  triggerAction?: 'hover' | 'click' | 'dblclick' | 'contextmenu'
}

export interface PopoverData extends Omit<KitPopoverData, 'position'> {
  position?: PopoverPosition | null
  dictionaryConfig?: DictionaryCardDisplayConfig
}

export function usePopover() {
  // Use the kit's usePopover which handles Floating UI positioning
  const kitPopover = useKitPopover({
    placement: 'top',
    offset: 8,
    padding: 8,
    // Disable hook's internal click outside handling because SelectionPopover component
    // handles it independently. If both are enabled, the hook (which doesn't have the ref)
    // will think every click is "outside" and close the popover before the button click fires.
    closeOnClickOutside: false,
    // Also disable hook's internal scroll handling for the same reason - we want to allow scrolling inside the popover
    closeOnScroll: false
  })
  
  // Local state for extended data (dictionary config) not present in core types yet
  const [dictionaryConfig, setDictionaryConfig] = useState<DictionaryCardDisplayConfig | undefined>(undefined)

  const showPopover = useCallback((newData: PopoverData) => {
    // Separate dictionary config from core data
    const { dictionaryConfig: dictConfig, ...coreData } = newData
    
    setDictionaryConfig(dictConfig)
    
    // Call kit's show method
    // Note: coreData.position might be null, but kit expects PopoverPosition | null
    kitPopover.show({
      ...coreData,
      position: coreData.position || null
    })
  }, [kitPopover])

  const hidePopover = useCallback(() => {
    kitPopover.hide()
  }, [kitPopover])

  const hidePopoverDelayed = useCallback((delay: number = 50) => {
    kitPopover.hideDelayed(delay)
  }, [kitPopover])

  const removeItemFromData = useCallback((itemId: string) => {
    const currentData = kitPopover.data
    const currentItems = currentData.items
    const newItems = currentItems.filter(item => item.id !== itemId)
    
    const hasRemaining = newItems.length > 0
    
    if (!hasRemaining) {
      // Use setTimeout to avoid state update during render if this is called during render
      setTimeout(() => kitPopover.hide(), 0)
    } else {
      // Update data with new items
      kitPopover.show({
        ...currentData,
        items: newItems,
        timestamp: Date.now() // Update timestamp to force refresh if needed
      })
    }
    return hasRemaining
  }, [kitPopover])

  const updateItemType = useCallback((itemId: string, newType: SelectionItemType) => {
    const currentData = kitPopover.data
    const newItems = currentData.items.map(item => 
      item.id === itemId ? { ...item, itemType: newType } : item
    )
    
    kitPopover.show({
      ...currentData,
      items: newItems
    })
  }, [kitPopover])
  
  return {
    ...kitPopover,
    // Override/extend properties
    data: {
      ...kitPopover.data,
      dictionaryConfig
    },
    showPopover,
    hidePopover,
    hidePopoverDelayed,
    removeItemFromData,
    updateItemType,
    // Aliases
    popoverVisible: kitPopover.visible,
    popoverData: {
      ...kitPopover.data,
      dictionaryConfig
    }
  }
}
