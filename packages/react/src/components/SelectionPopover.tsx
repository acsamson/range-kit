import React, { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate
} from '@floating-ui/react'
import type { Placement } from '@floating-ui/react'
import type { PopoverData, PopoverPosition } from '../hooks/use-popover/types'

/**
 * 创建虚拟参考元素
 */
function createVirtualElement(position: PopoverPosition | null): {
  getBoundingClientRect: () => DOMRect
} {
  const rect = position
    ? {
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
        top: position.y,
        left: position.x,
        right: position.x + position.width,
        bottom: position.y + position.height
      }
    : { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }

  return {
    getBoundingClientRect: () => rect as DOMRect
  }
}

/**
 * SelectionPopover Props
 */
export interface SelectionPopoverProps {
  /** 是否显示 */
  visible: boolean
  /** Popover 数据 */
  data?: PopoverData
  /** 放置位置 */
  placement?: Placement
  /** 偏移距离（像素） */
  offsetDistance?: number
  /** 边界内边距 */
  padding?: number
  /** 点击外部关闭 */
  closeOnClickOutside?: boolean
  /** 滚动时关闭 */
  closeOnScroll?: boolean
  /** 自动隐藏延迟（ms），0 表示不自动隐藏 */
  autoHideDelay?: number
  /** 自定义 class */
  className?: string
  /** 自定义 style */
  style?: React.CSSProperties
  /** 关闭事件 */
  onClose?: () => void
  /** 子元素 */
  children?: React.ReactNode
}

/**
 * SelectionPopover 组件
 * 开箱即用的选区操作气泡组件，集成 Floating UI 定位
 */
export const SelectionPopover: React.FC<SelectionPopoverProps> = ({
  visible,
  data,
  placement = 'top',
  offsetDistance = 8,
  padding = 8,
  closeOnClickOutside = true,
  closeOnScroll = true,
  autoHideDelay = 0,
  className = '',
  style = {},
  onClose,
  children
}) => {
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showTimestampRef = useRef(0)
  const virtualElementRef = useRef(createVirtualElement(null))

  // 使用 Floating UI
  const { refs, floatingStyles } = useFloating({
    open: visible,
    placement,
    middleware: [
      offset(offsetDistance),
      flip({ padding }),
      shift({ padding })
    ],
    whileElementsMounted: autoUpdate
  })

  // 更新虚拟元素位置
  useEffect(() => {
    virtualElementRef.current = createVirtualElement(data?.position || null)
    refs.setPositionReference(virtualElementRef.current)
    if (visible) {
      showTimestampRef.current = Date.now()
    }
  }, [data?.position, visible, refs])

  // 清除定时器
  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  // 关闭处理
  const handleClose = useCallback(() => {
    cancelHide()
    onClose?.()
  }, [cancelHide, onClose])

  // 自动隐藏
  useEffect(() => {
    if (visible && autoHideDelay > 0) {
      cancelHide()
      hideTimerRef.current = setTimeout(() => {
        handleClose()
      }, autoHideDelay)
    }
    return () => cancelHide()
  }, [visible, autoHideDelay, cancelHide, handleClose])

  // 点击外部关闭
  useEffect(() => {
    if (!closeOnClickOutside || !visible) return

    const handleClickOutside = (event: MouseEvent) => {
      if (Date.now() - showTimestampRef.current < 200) return
      const target = event.target as Node
      if (refs.floating.current && !refs.floating.current.contains(target)) {
        handleClose()
      }
    }

    document.addEventListener('click', handleClickOutside, true)
    return () => document.removeEventListener('click', handleClickOutside, true)
  }, [closeOnClickOutside, visible, refs.floating, handleClose])

  // 滚动时关闭
  useEffect(() => {
    if (!closeOnScroll || !visible) return

    const handleScroll = (event: Event) => {
      // 检查滚动事件的目标是否在 popover 内部
      const target = event.target as Node
      // 如果滚动的是 popover 内部元素，不关闭
      if (refs.floating.current && refs.floating.current.contains(target)) {
        return
      }
      
      handleClose()
    }

    // 使用 capture: true 捕获滚动事件，因为 scroll 事件不冒泡
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [closeOnScroll, visible, refs.floating, handleClose])

  // 鼠标进入取消隐藏
  const handleMouseEnter = useCallback(() => {
    cancelHide()
  }, [cancelHide])

  // 鼠标离开延迟隐藏
  const handleMouseLeave = useCallback(() => {
    if (autoHideDelay > 0) {
      hideTimerRef.current = setTimeout(() => {
        handleClose()
      }, 100)
    }
  }, [autoHideDelay, handleClose])

  if (!visible) return null

  // 检查 transform 是否包含有效的 translate 值
  const transform = (floatingStyles as Record<string, string>).transform || ''
  const hasValidTransform = transform.includes('translate') &&
                            !transform.includes('translate(0px, 0px)') &&
                            !transform.includes('translate(0, 0)')

  const popoverContent = (
    <div
      ref={refs.setFloating}
      className={`rk-selection-popover ${className}`}
      style={{
        ...floatingStyles,
        visibility: hasValidTransform ? 'visible' : 'hidden',
        ...style
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )

  return createPortal(popoverContent, document.body)
}

export default SelectionPopover
