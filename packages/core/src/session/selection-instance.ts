/**
 * 选区实例实现
 *
 * 封装单个选区的状态和操作方法
 */

import {
  SerializedSelection,
  SelectionType,
  SelectionInstance,
} from '../types';
import { logInfo, logWarn, logError } from '../common/debug';
import { restoreSelection } from '../locator/restorer';
import type { SelectionManagerContext } from './types';

/**
 * 选区实例实现类
 * 管理单个选区的生命周期和操作
 */
export class SelectionInstanceImpl implements SelectionInstance {
  /** 选区唯一标识 */
  public id: string;
  /** 选区类型 */
  public type: SelectionType;
  /** 序列化的选区数据 */
  public data: SerializedSelection;

  /** 管理器上下文 */
  private context: SelectionManagerContext;
  /** 当前恢复的Range对象 */
  private currentRange: Range | null = null;
  /** 移除回调函数 */
  private removeCallback: (id: string) => void;

  constructor(
    id: string,
    type: SelectionType,
    data: SerializedSelection,
    context: SelectionManagerContext,
    removeCallback: (id: string) => void
  ) {
    this.id = id;
    this.type = type;
    this.data = data;
    this.context = context;
    this.removeCallback = removeCallback;
  }

  /**
   * 设置选区类型
   * @param type - 新的选区类型
   */
  setType(type: SelectionType): void {
    const oldType = this.type;
    this.type = type;
    this.data.type = type;

    // 重新应用样式
    this.rehighlight();

    logInfo('selection-instance', `选区类型已更新: ${oldType} -> ${type}`, { id: this.id });
  }

  /**
   * 更新选区数据
   * @param updates - 要更新的字段
   */
  updateData(updates: Partial<SerializedSelection>): void {
    this.data = { ...this.data, ...updates };
  }

  /**
   * 移除选区
   */
  remove(): void {
    this.removeCallback(this.id);
  }

  /**
   * 获取当前恢复的Range对象
   * @returns Range对象或null
   */
  getRange(): Range | null {
    return this.currentRange;
  }

  /**
   * 设置当前Range
   * @param range - Range对象
   */
  setRange(range: Range | null): void {
    this.currentRange = range;
  }

  /**
   * 重新应用高亮
   */
  async rehighlight(): Promise<void> {
    try {
      // 先清除旧的高亮
      this.context.clearSelectionHighlight(this.id);

      // 恢复选区并重新高亮
      const result = await restoreSelection(this.data);
      if (result.success && result.range) {
        this.currentRange = result.range;
        // 设置类型样式
        const style = this.context.getStyleForType(this.type);
        this.context.highlighter.setDefaultStyle(style);
        const highlightId = this.context.highlighter.highlight(result.range);
        this.context.selectionHighlights.set(this.id, highlightId);
      } else {
        logWarn('selection-instance', '选区重新高亮失败', { id: this.id, error: result.error });
      }
    } catch (error) {
      logError('selection-instance', '选区重新高亮时发生错误', { id: this.id, error });
    }
  }

  /**
   * 滚动到选区位置
   */
  scrollTo(): void {
    if (this.currentRange) {
      this.context.highlighter.scrollToRange?.(this.currentRange);
    }
  }
}
