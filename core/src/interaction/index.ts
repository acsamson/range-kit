/**
 * Interaction 模块
 *
 * 事件层，负责监听和归一化交互事件
 *
 * @example
 * ```typescript
 * import { InteractionManager } from '@range-kit/core';
 *
 * const interaction = new InteractionManager(container);
 *
 * interaction.on('select', (event) => {
 *   console.log('选区变化:', event.text);
 * });
 *
 * interaction.on('click', (event) => {
 *   console.log('点击了选区:', event.selectionId);
 * });
 * ```
 */

// 主类导出
export { InteractionManager, createInteractionManager } from './interaction-manager';

// 类型导出
export type {
  IInteractionManager,
  InteractionManagerOptions,
  InteractionEventData,
  InteractionEventHandler,
  SelectionPosition,
} from './types';

export { InteractionEventType } from './types';
