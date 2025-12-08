import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/vue'
import type { VirtualElement } from '@floating-ui/vue'
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
function createVirtualElement(position: PopoverPosition | null): VirtualElement {
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
  const visible = ref(false)
  const data = ref<PopoverData>({
    position: null,
    items: []
  })

  // 虚拟参考元素
  const virtualReference = ref<VirtualElement>(createVirtualElement(null))

  // 浮动元素 ref
  const floatingRef = ref<HTMLElement | null>(null)

  // 使用 Floating UI
  const { floatingStyles, update } = useFloating(virtualReference, floatingRef, {
    placement,
    middleware: [
      offset(offsetValue),
      flip({ padding }),
      shift({ padding })
    ],
    whileElementsMounted: autoUpdate
  })

  // 隐藏延迟定时器
  let hideTimer: ReturnType<typeof setTimeout> | null = null
  // 显示时间戳，用于防止立即关闭
  let showTimestamp = 0

  /**
   * 显示 Popover
   */
  const show = (popoverData: Omit<PopoverData, 'timestamp'> & { timestamp?: number }) => {
    // 取消任何待执行的隐藏
    cancelHide()

    // 更新数据
    data.value = {
      ...popoverData,
      timestamp: popoverData.timestamp ?? Date.now()
    }

    // 更新虚拟参考元素
    virtualReference.value = createVirtualElement(popoverData.position)

    // 显示
    visible.value = true
    showTimestamp = Date.now()

    // 自动隐藏
    if (autoHideDelay > 0) {
      hideTimer = setTimeout(() => {
        hide()
      }, autoHideDelay)
    }
  }

  /**
   * 隐藏 Popover
   */
  const hide = () => {
    cancelHide()
    visible.value = false
    data.value = { position: null, items: [] }
  }

  /**
   * 延迟隐藏
   */
  const hideDelayed = (delay = 100) => {
    // 如果刚刚显示（200ms 内），忽略隐藏请求
    if (Date.now() - showTimestamp < 200) {
      return
    }

    cancelHide()
    hideTimer = setTimeout(() => {
      hide()
    }, delay)
  }

  /**
   * 取消延迟隐藏
   */
  const cancelHide = () => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  /**
   * 更新位置
   */
  const updatePosition = () => {
    update()
  }

  // 点击外部关闭
  const handleClickOutside = (event: MouseEvent) => {
    if (!closeOnClickOutside || !visible.value) return

    // 如果刚刚显示（200ms 内），忽略点击
    if (Date.now() - showTimestamp < 200) {
      return
    }

    const target = event.target as Node
    if (floatingRef.value && !floatingRef.value.contains(target)) {
      hide()
    }
  }

  // 滚动时隐藏
  const handleScroll = (event: Event) => {
    if (!closeOnScroll || !visible.value) return

    // 检查滚动事件的目标是否在 popover 内部
    const target = event.target as Node
    // 如果滚动的是 popover 内部元素，不关闭
    if (floatingRef.value && floatingRef.value.contains(target)) {
      return
    }

    hide()
  }

  // 生命周期
  onMounted(() => {
    if (closeOnClickOutside) {
      document.addEventListener('click', handleClickOutside, true)
    }
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
  })

  onUnmounted(() => {
    cancelHide()
    document.removeEventListener('click', handleClickOutside, true)
    window.removeEventListener('scroll', handleScroll, true)
  })

  // 监听位置变化，更新虚拟元素
  watch(
    () => data.value.position,
    (newPosition) => {
      virtualReference.value = createVirtualElement(newPosition)
    }
  )

  /**
   * 是否已定位
   * 当 floatingStyles 包含 transform 属性时，说明 Floating UI 已完成计算
   */
  const isPositioned = computed(() => {
    return visible.value && !!floatingStyles.value.transform
  })

  return {
    visible: computed(() => visible.value),
    data: computed(() => data.value),
    floatingStyles: computed(() => floatingStyles.value as Record<string, string>),
    floatingRef,
    show,
    hide,
    hideDelayed,
    cancelHide,
    updatePosition,
    isPositioned
  }
}
