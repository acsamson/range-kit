import { useRef, useEffect, useCallback } from 'react'
import type {
  SelectionRestoreAPI,
  SelectionActionEvent,
  SearchResultItem,
  SearchHighlightInteractionEvent
} from 'range-kit-react'
import { isPointInRange } from 'range-kit-react'
import type { usePopover, SelectionItem, DictionaryCardDisplayConfig } from './use-popover'

export interface UseSelectionCallbacksOptions {
  popover: ReturnType<typeof usePopover>
  getInstance: () => SelectionRestoreAPI | null
  searchResults: SearchResultItem[]
  interactionMode: string
  dictionaryCardConfig: DictionaryCardDisplayConfig
}

export function useSelectionCallbacks(options: UseSelectionCallbacksOptions) {
  const { popover, getInstance } = options
  
  // Use refs to access latest values in callbacks without re-creating them
  const searchResultsRef = useRef(options.searchResults)
  const interactionModeRef = useRef(options.interactionMode)
  const dictionaryCardConfigRef = useRef(options.dictionaryCardConfig)
  
  // Update refs when props change
  useEffect(() => {
    searchResultsRef.current = options.searchResults
  }, [options.searchResults])

  useEffect(() => {
    interactionModeRef.current = options.interactionMode
  }, [options.interactionMode])

  useEffect(() => {
    dictionaryCardConfigRef.current = options.dictionaryCardConfig
  }, [options.dictionaryCardConfig])

  const lastPopoverShowTime = useRef(0)

  /**
   * Detect search highlights at point
   */
  const detectSearchHighlightsAtPoint = useCallback((x: number, y: number): SelectionItem[] => {
    const items: SelectionItem[] = []
    const searchResults = searchResultsRef.current

    if (!searchResults?.length) {
      return items
    }

    const instance = getInstance()
    if (!instance) {
      return items
    }

    for (const result of searchResults) {
      for (const highlightId of result.highlightIds) {
        const range = instance.getActiveRange(highlightId)
        if (!range) continue

        if (isPointInRange(x, y, range)) {
          items.push({
            id: highlightId,
            itemType: 'search',
            text: range.toString() || result.keyword,
            styleType: result.type,
            range: range
          })
        }
      }
    }

    return items
  }, [getInstance])

  /**
   * Filter duplicate search items
   */
  const filterDuplicateSearchItems = useCallback((
    searchItems: SelectionItem[],
    savedItems: SelectionItem[]
  ): SelectionItem[] => {
    if (savedItems.length === 0) return searchItems

    const savedTexts = new Set(
      savedItems.map(item => item.text?.trim().toLowerCase())
    )

    return searchItems.filter(searchItem => {
      const searchText = searchItem.text?.trim().toLowerCase()
      return !savedTexts.has(searchText)
    })
  }, [])

  /**
   * Handle Created Action
   */
  const handleCreatedAction = useCallback((event: SelectionActionEvent) => {
    if (!event.text || event.text.length === 0) return

    const position = event.position
    const items: SelectionItem[] = []

    // Filter out search highlights from overlapped selections
    const savedSelectionOverlaps = (event.overlappedSelections || []).filter(
      (overlap: any) => overlap.selectionData?.type !== 'search'
    )

    // Check if clicked inside existing selection (fully contained)
    const containingSelection = savedSelectionOverlaps.find(
      (overlap: any) => overlap.overlapType === 'EXISTING_CONTAINS_CURRENT'
    )

    if (containingSelection) {
      // Click on existing selection - add all overlaps
      for (const overlap of savedSelectionOverlaps) {
        const typedOverlap = overlap as { selectionId: string; text: string; selectionData?: { type?: string } }
        items.push({
          id: typedOverlap.selectionId,
          itemType: 'saved',
          text: typedOverlap.text,
          styleType: typedOverlap.selectionData?.type,
          selectionData: typedOverlap.selectionData
        })
      }

      if (items.length > 0) {
        popover.showPopover({
          position: position,
          items,
          timestamp: event.timestamp
        })
        lastPopoverShowTime.current = Date.now()
      }
      return
    }

    // New selection
    if (event.range) {
      items.push({
        id: `new_${Date.now()}`,
        itemType: 'new',
        text: event.text,
        range: event.range
      })
    }

    // Add overlapped selections
    for (const overlap of savedSelectionOverlaps) {
      const typedOverlap = overlap as { selectionId: string; text: string; selectionData?: { type?: string } }
      items.push({
        id: typedOverlap.selectionId,
        itemType: 'saved',
        text: typedOverlap.text,
        styleType: typedOverlap.selectionData?.type,
        selectionData: typedOverlap.selectionData
      })
    }

    if (items.length > 0) {
      popover.showPopover({
        position: position,
        items,
        timestamp: event.timestamp
      })
      lastPopoverShowTime.current = Date.now()
    }
  }, [popover])

  /**
   * Handle Click Action
   */
  const handleClickAction = useCallback((event: SelectionActionEvent) => {
    const mouseEvent = event.originalEvent as MouseEvent
    const clickX = mouseEvent?.clientX || 0
    const clickY = mouseEvent?.clientY || 0

    const items: SelectionItem[] = []
    const instance = getInstance()
    let overlappedSelections: any[] = []

    if (instance) {
      overlappedSelections = instance.detectAllSelectionsAtPoint(clickX, clickY)
    }

    // Fallback if no detection results but event has info
    if (overlappedSelections.length === 0 && event.savedSelectionId) {
      overlappedSelections = [{
        selectionId: event.savedSelectionId,
        text: event.text,
        selectionData: event.savedSelection
      }]
    }

    // Filter out search highlights
    const savedSelections = overlappedSelections.filter(
      (overlap: any) => overlap.selectionData?.type !== 'search'
    )

    for (const overlap of savedSelections) {
      items.push({
        id: overlap.selectionId,
        itemType: 'saved',
        text: overlap.text,
        styleType: overlap.selectionData?.type,
        selectionData: overlap.selectionData
      })
    }

    if (items.length === 0) return

    const clickPosition = {
      x: clickX,
      y: clickY,
      width: 0,
      height: 0
    }

    popover.showPopover({
      position: clickPosition,
      items,
      timestamp: Date.now()
    })
    lastPopoverShowTime.current = Date.now()
  }, [getInstance, popover])

  /**
   * Handle Cleared Action
   */
  const handleClearedAction = useCallback(() => {
    if (Date.now() - lastPopoverShowTime.current < 200) {
      return
    }
    popover.hidePopoverDelayed(50)
  }, [popover])

  /**
   * Main Selection Action Handler
   */
  const onSelectionAction = useCallback((event: SelectionActionEvent) => {
    const currentMode = interactionModeRef.current || 'click'

    switch (event.type) {
      case 'created':
        handleCreatedAction(event)
        break
      case 'cleared':
        handleClearedAction()
        break
      case 'click':
        if (currentMode === 'click') {
          handleClickAction(event)
        }
        break
      case 'hover':
        if (currentMode === 'hover') {
          handleClickAction(event)
        }
        break
      case 'dblclick':
        if (currentMode === 'dblclick') {
          handleClickAction(event)
        }
        break
      case 'contextmenu':
        if (currentMode === 'contextmenu') {
          event.originalEvent?.preventDefault()
          handleClickAction(event)
        }
        break
    }
  }, [handleCreatedAction, handleClearedAction, handleClickAction])

  /**
   * Search Highlight Interaction Handler
   */
  const onSearchHighlightInteraction = useCallback((event: SearchHighlightInteractionEvent) => {
    const dictionaryConfig = dictionaryCardConfigRef.current
    let targetMode: string

    if (dictionaryConfig?.enabled) {
      targetMode = dictionaryConfig.triggerAction || 'hover'
    } else {
      targetMode = interactionModeRef.current || 'click'
    }

    if (event.type !== targetMode) return

    if (event.type === 'contextmenu') {
      event.originalEvent?.preventDefault()
    }

    const mouseEvent = event.originalEvent as MouseEvent
    const clickX = mouseEvent?.clientX || 0
    const clickY = mouseEvent?.clientY || 0

    const items: SelectionItem[] = []
    const instance = getInstance()
    let overlappedSelections: any[] = []

    if (instance) {
      overlappedSelections = instance.detectAllSelectionsAtPoint(clickX, clickY)
    }

    const savedSelections = overlappedSelections.filter(
      (overlap: any) => overlap.selectionData?.type !== 'search'
    )

    const savedItems: SelectionItem[] = []
    for (const overlap of savedSelections) {
      const savedItem: SelectionItem = {
        id: overlap.selectionId,
        itemType: 'saved',
        text: overlap.text,
        styleType: overlap.selectionData?.type,
        selectionData: overlap.selectionData
      }
      items.push(savedItem)
      savedItems.push(savedItem)
    }

    const searchItems = detectSearchHighlightsAtPoint(clickX, clickY)
    const filteredSearchItems = filterDuplicateSearchItems(searchItems, savedItems)
    items.push(...filteredSearchItems)

    if (items.length === 0) return

    const clickPosition = {
      x: clickX,
      y: clickY,
      width: 0,
      height: 0
    }

    const hasDictionaryDisplayConfig = dictionaryConfig?.enabled && filteredSearchItems.length > 0

    popover.showPopover({
      position: clickPosition,
      items,
      timestamp: Date.now(),
      dictionaryConfig: hasDictionaryDisplayConfig ? {
        title: dictionaryConfig!.title,
        contentTemplate: dictionaryConfig!.contentTemplate,
        showKeyword: dictionaryConfig!.showKeyword
      } : undefined
    })

    lastPopoverShowTime.current = Date.now()
  }, [getInstance, detectSearchHighlightsAtPoint, filterDuplicateSearchItems, popover])

  return {
    onSelectionAction,
    onSearchHighlightInteraction
  }
}
