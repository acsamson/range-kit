/**
 * 公共类型定义
 */

/**
 * 配置模式
 */
export type ConfigMode = 'strict' | 'loose';

/**
 * 容器配置
 */
export interface ContainerConfig {
  /** 允许的容器 ID 列表 */
  enabledContainers?: string[];
  /** 禁用的容器 ID 列表 */
  disabledContainers?: string[];
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
