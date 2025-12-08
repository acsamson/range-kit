/**
 * 样式注册表 (StyleRegistry)
 *
 * 职责单一：管理选区类型和对应的样式配置
 */

import type { SelectionType, SelectionTypeConfig, HighlightStyle } from '../types';
import { logInfo } from '../common/debug';

/**
 * 样式注册表
 * 负责管理选区类型的样式配置
 */
export class StyleRegistry {
  /** 已注册的类型配置映射 */
  private registeredTypes: Map<string, SelectionTypeConfig> = new Map();

  /** 默认样式 */
  private defaultStyle: HighlightStyle;

  constructor(defaultStyle: HighlightStyle) {
    this.defaultStyle = defaultStyle;
  }

  /**
   * 批量初始化类型配置
   */
  initializeTypes(types: SelectionTypeConfig[] | undefined): void {
    if (types) {
      types.forEach(typeConfig => {
        this.registeredTypes.set(typeConfig.type, typeConfig);
      });
    }
  }

  /**
   * 注册新的选区类型
   */
  registerType(config: SelectionTypeConfig): void {
    const existingConfig = this.registeredTypes.get(config.type);

    // 合并配置
    const mergedConfig: SelectionTypeConfig = {
      ...existingConfig,
      ...config,
      style: {
        ...(existingConfig?.style || {}),
        ...(config.style || {}),
      },
    };

    this.registeredTypes.set(config.type, mergedConfig);

    logInfo('style-registry', `注册选区类型: ${config.type} (${config.label})`, mergedConfig);
  }

  /**
   * 获取注册的类型配置
   */
  getType(type: SelectionType): SelectionTypeConfig | undefined {
    return this.registeredTypes.get(type);
  }

  /**
   * 获取所有注册的类型配置
   */
  getAllTypes(): SelectionTypeConfig[] {
    return Array.from(this.registeredTypes.values());
  }

  /**
   * 根据类型获取样式
   */
  getStyleForType(type: SelectionType): HighlightStyle {
    const typeConfig = this.registeredTypes.get(type);
    return typeConfig?.style || this.defaultStyle;
  }

  /**
   * 检查类型是否已注册
   */
  hasType(type: SelectionType): boolean {
    return this.registeredTypes.has(type);
  }

  /**
   * 获取类型配置映射（用于外部访问）
   */
  getTypeMap(): Map<string, SelectionTypeConfig> {
    return this.registeredTypes;
  }

  /**
   * 获取注册的类型数量
   */
  get size(): number {
    return this.registeredTypes.size;
  }

  /**
   * 清除所有注册的类型
   */
  clear(): void {
    this.registeredTypes.clear();
  }
}
