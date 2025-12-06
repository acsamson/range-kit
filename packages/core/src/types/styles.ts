/**
 * 样式相关类型定义
 * 基础类型，不依赖其他模块
 */

// 选区高亮样式配置
export interface HighlightStyle {
  /** 背景颜色 */
  backgroundColor?: string;
  /** 文字颜色 */
  color?: string;
  /** 文本装饰 */
  textDecoration?: string;
  /** 文本装饰样式 */
  textDecorationStyle?: string;
  /** 文本装饰颜色 */
  textDecorationColor?: string;
  /** 文本装饰粗细 */
  textDecorationThickness?: string;
  /** 文本下划线偏移 */
  textUnderlineOffset?: string;
  /** 文本阴影 */
  textShadow?: string;
  /** 字体粗细 */
  fontWeight?: string;
  /** 边框样式 (CSS Highlights API不支持，仅用于降级方案) */
  border?: string;
  /** 左侧边框 (CSS Highlights API不支持，仅用于降级方案) */
  borderLeft?: string;
  /** 底部边框 (CSS Highlights API不支持，仅用于降级方案) */
  borderBottom?: string;
  /** 边框圆角 (CSS Highlights API不支持，仅用于降级方案) */
  borderRadius?: string;
  /** 内边距 (CSS Highlights API不支持，仅用于降级方案) */
  padding?: string;
  /** 透明度 */
  opacity?: number;
  /** 动画效果 (CSS Highlights API不支持，仅用于降级方案) */
  transition?: string;
  /** 阴影效果 (CSS Highlights API不支持，仅用于降级方案) */
  boxShadow?: string;
  /** 轮廓 (CSS Highlights API不支持，仅用于降级方案) */
  outline?: string;
  /** 鼠标光标样式 (CSS Highlights API不支持，仅用于降级方案) */
  cursor?: string;
  /** 自定义CSS类名 */
  className?: string;
}
