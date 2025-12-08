import {
  defineComponent,
  h,
  ref,
  watch,
  onMounted,
  onUnmounted,
  Teleport,
  type PropType
} from 'vue'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/vue'
import type { VirtualElement, Placement } from '@floating-ui/vue'
import type { PopoverData, PopoverPosition } from '../composables/use-popover/types'

/**
 * 创建虚拟参考元素
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
 * SelectionPopover 组件
 * 开箱即用的选区操作气泡组件，集成 Floating UI 定位
 *
 * @see https://floating-ui.com/docs/vue - Floating UI Vue 文档
 */
export const SelectionPopover = defineComponent({
  name: 'SelectionPopover',
  props: {
    /** 是否显示 */
    visible: {
      type: Boolean,
      default: false
    },
    /** Popover 数据 */
    data: {
      type: Object as PropType<PopoverData>,
      default: () => ({ position: null, items: [] })
    },
    /**
     * 放置位置
     * @see https://floating-ui.com/docs/computePosition#placement
     */
    placement: {
      type: String as PropType<Placement>,
      default: 'top'
    },
    /**
     * 偏移距离（像素）
     * @see https://floating-ui.com/docs/offset
     */
    offsetDistance: {
      type: Number,
      default: 8
    },
    /**
     * 边界内边距，用于 flip 和 shift 中间件
     * @see https://floating-ui.com/docs/flip
     * @see https://floating-ui.com/docs/shift
     */
    padding: {
      type: Number,
      default: 8
    },
    /**
     * 是否启用 flip 中间件（当空间不足时自动翻转位置）
     * @see https://floating-ui.com/docs/flip
     */
    flip: {
      type: Boolean,
      default: true
    },
    /**
     * 是否启用 shift 中间件（当溢出边界时自动偏移）
     * @see https://floating-ui.com/docs/shift
     */
    shift: {
      type: Boolean,
      default: true
    },
    /** 点击外部关闭 */
    closeOnClickOutside: {
      type: Boolean,
      default: true
    },
    /** 滚动时关闭 */
    closeOnScroll: {
      type: Boolean,
      default: true
    },
    /** 自动隐藏延迟（ms），0 表示不自动隐藏 */
    autoHideDelay: {
      type: Number,
      default: 0
    },
    /** 自定义 class */
    popoverClass: {
      type: [String, Array, Object] as PropType<string | string[] | Record<string, boolean>>,
      default: ''
    },
    /**
     * 自定义 style
     * 注意：避免设置 transform 属性，会与 Floating UI 定位冲突
     */
    popoverStyle: {
      type: Object as PropType<Record<string, string>>,
      default: () => ({})
    }
  },
  emits: ['close', 'update:visible'],
  setup(props, { emit, slots }) {
    const floatingRef = ref<HTMLElement | null>(null)
    let hideTimer: ReturnType<typeof setTimeout> | null = null
    let showTimestamp = 0

    // 虚拟参考元素
    const virtualReference = ref<VirtualElement>(createVirtualElement(null))

    // 使用 Floating UI
    const { floatingStyles } = useFloating(virtualReference, floatingRef, {
      placement: props.placement,
      middleware: [
        offset(props.offsetDistance),
        flip({ padding: props.padding }),
        shift({ padding: props.padding })
      ],
      whileElementsMounted: autoUpdate
    })

    // 监听位置变化
    watch(
      () => props.data?.position,
      (newPosition) => {
        virtualReference.value = createVirtualElement(newPosition || null)
        if (props.visible) {
          showTimestamp = Date.now()
        }
      },
      { immediate: true }
    )

    // 监听 visible 变化
    watch(
      () => props.visible,
      (newVisible) => {
        if (newVisible) {
          showTimestamp = Date.now()
          if (props.autoHideDelay > 0) {
            cancelHide()
            hideTimer = setTimeout(() => {
              handleClose()
            }, props.autoHideDelay)
          }
        } else {
          cancelHide()
        }
      }
    )

    const cancelHide = () => {
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
    }

    const handleClose = () => {
      emit('close')
      emit('update:visible', false)
    }

    const handleMouseEnter = () => {
      cancelHide()
    }

    const handleMouseLeave = () => {
      if (props.autoHideDelay > 0) {
        hideTimer = setTimeout(() => {
          handleClose()
        }, 100)
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!props.closeOnClickOutside || !props.visible) return
      if (Date.now() - showTimestamp < 200) return

      const target = event.target as Node
      if (floatingRef.value && !floatingRef.value.contains(target)) {
        handleClose()
      }
    }

    const handleScroll = (event: Event) => {
      if (!props.closeOnScroll || !props.visible) return

      // 检查滚动是否发生在 popover 内部
      const target = event.target as Node
      if (floatingRef.value && floatingRef.value.contains(target)) {
        // 内部滚动，不关闭
        return
      }

      handleClose()
    }

    onMounted(() => {
      if (props.closeOnClickOutside) {
        document.addEventListener('click', handleClickOutside, true)
      }
      if (props.closeOnScroll) {
        window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
      }
    })

    onUnmounted(() => {
      cancelHide()
      document.removeEventListener('click', handleClickOutside, true)
      window.removeEventListener('scroll', handleScroll, true)
    })

    return () => {
      if (!props.visible) return null

      // 主容器
      // Floating UI 使用 transform: translate(x, y) 定位，left/top 固定为 0
      // 第一帧时 transform 还未计算，此时隐藏防止闪烁
      const styles = floatingStyles.value as Record<string, string>
      const transform = styles.transform || ''
      // 检查 transform 是否包含有效的 translate 值（非 0,0）
      const hasValidTransform = transform.includes('translate') &&
                                 !transform.includes('translate(0px, 0px)') &&
                                 !transform.includes('translate(0, 0)')

      const popoverContent = h('div', {
        ref: floatingRef,
        class: ['rk-selection-popover', props.popoverClass],
        style: {
          ...styles,
          // 如果没有有效的 transform，隐藏元素防止闪烁到左上角
          visibility: hasValidTransform ? 'visible' : 'hidden',
          // 合并用户自定义样式
          ...props.popoverStyle
        },
        onMouseenter: handleMouseEnter,
        onMouseleave: handleMouseLeave
      }, slots.default ? slots.default() : [])

      return h(Teleport, { to: 'body' }, popoverContent)
    }
  }
})

export default SelectionPopover
