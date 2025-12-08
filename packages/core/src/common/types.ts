/**
 * 公共类型定义
 */

/**
 * 配置模式
 */
export type ConfigMode = 'strict' | 'loose';

/**
 * 容器配置
 *
 * 简化设计：仅需指定根节点ID
 * 如需豁免子区域，使用 `data-range-exclude` 属性标记
 */
export interface ContainerConfig {
  /** 根节点 ID */
  rootNodeId?: string;
}

/**
 * 位置信息
 */
export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 操作结果
 */
export interface OperationResult<T = void> {
  /** 是否成功 */
  success: boolean;
  /** 结果数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
}

/**
 * 销毁接口
 */
export interface Destroyable {
  destroy(): void;
}
