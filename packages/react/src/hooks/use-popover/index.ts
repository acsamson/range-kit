import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  useInteractions,
  useDismiss
} from '@floating-ui/react'
import type {
  UsePopoverOptions,
  UsePopoverReturn,
  PopoverData,
  PopoverPosition
} from './types'

export * from './types'

/**
 * 创建虚拟参考元素
 * 将位置信息转换为 Floating UI 需要的虚拟元素格式
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
 * Popover Hook
 * 封装 Floating UI 的定位逻辑，提供开箱即用的 Popover 功能
 */
export function usePopover(options: UsePopoverOptions = {}): UsePopoverReturn {
  const {
    placement = 'top',
    offset: offsetValue = 8,
    padding = 8,
    autoHideDelay = 0,
    closeOnClickOutside = true,
    closeOnScroll = true
  } = options

  // 状态
  const [visible, setVisible] = useState(false)
  const [data, setData] = useState<PopoverData>({
    position: null,
    items: []
  })

  // 隐藏延迟定时器
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 显示时间戳，用于防止立即关闭
  const showTimestampRef = useRef(0)
  // 虚拟元素
  const virtualElementRef = useRef(createVirtualElement(null))

  // 使用 Floating UI
  const { refs, floatingStyles, update, context, isPositioned } = useFloating({
    open: visible,
    onOpenChange: setVisible,
    placement,
    middleware: [
      offset(offsetValue),
      flip({ padding }),
      shift({ padding })
    ],
    whileElementsMounted: autoUpdate
  })

  // 使用 dismiss 交互处理点击外部关闭
  const dismiss = useDismiss(context, {
    enabled: closeOnClickOutside
  })

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss])

  // 取消延迟隐藏
  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  // 隐藏 Popover
  const hide = useCallback(() => {
    cancelHide()
    setVisible(false)
    setData({ position: null, items: [] })
  }, [cancelHide])

  // 显示 Popover
  const show = useCallback((popoverData: Omit<PopoverData, 'timestamp'> & { timestamp?: number }) => {
    // 取消任何待执行的隐藏
    cancelHide()

    // 更新数据
    setData({
      ...popoverData,
      timestamp: popoverData.timestamp ?? Date.now()
    })

    // 更新虚拟参考元素
    virtualElementRef.current = createVirtualElement(popoverData.position)
    refs.setPositionReference(virtualElementRef.current)

    // 显示
    setVisible(true)
    showTimestampRef.current = Date.now()

    // 自动隐藏
    if (autoHideDelay > 0) {
      hideTimerRef.current = setTimeout(() => {
        hide()
      }, autoHideDelay)
    }
  }, [cancelHide, hide, autoHideDelay, refs])

  // 延迟隐藏
  const hideDelayed = useCallback((delay = 100) => {
    // 如果刚刚显示（200ms 内），忽略隐藏请求
    if (Date.now() - showTimestampRef.current < 200) {
      return
    }

    cancelHide()
    hideTimerRef.current = setTimeout(() => {
      hide()
    }, delay)
  }, [cancelHide, hide])

  // 监听位置变化，更新虚拟元素
  useEffect(() => {
    virtualElementRef.current = createVirtualElement(data.position)
    refs.setPositionReference(virtualElementRef.current)
  }, [data.position, refs])

  // 滚动时隐藏
  useEffect(() => {
    if (!closeOnScroll || !visible) return

    const handleScroll = (event: Event) => {
      // 检查滚动事件的目标是否在 popover 内部
      const target = event.target as Node
      // 如果滚动的是 popover 内部元素，不关闭
      if (refs.floating.current && refs.floating.current.contains(target)) {
        return
      }

      hide()
    }

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [visible, hide, closeOnScroll, refs])

  // 清理定时器
  useEffect(() => {
    return () => {
      cancelHide()
    }
  }, [cancelHide])

  // 安全的 floating styles - 防止闪烁
  const safeFloatingStyles = useMemo(() => ({
    ...floatingStyles,
    opacity: isPositioned ? 1 : 0,
    visibility: (isPositioned ? 'visible' : 'hidden') as 'visible' | 'hidden'
  }), [floatingStyles, isPositioned]);

  // 构建返回值
  const returnValue = useMemo<UsePopoverReturn>(() => ({
    visible,
    data,
    floatingStyles: safeFloatingStyles,
    refs: {
      setReference: refs.setReference,
      setFloating: refs.setFloating,
      reference: refs.reference.current as HTMLElement | null,
      floating: refs.floating.current as HTMLElement | null
    },
    show,
    hide,
    hideDelayed,
    cancelHide,
    update,
    getReferenceProps,
    getFloatingProps,
    isPositioned
  }), [visible, data, safeFloatingStyles, refs, show, hide, hideDelayed, cancelHide, update, getReferenceProps, getFloatingProps, isPositioned])

  return returnValue
}
