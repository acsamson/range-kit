/**
 * 配置管理助手
 * 处理容器配置、选项管理等
 */

import { SelectionRestoreOptions, HighlightStyle } from '../../types';
import { SelectionValidator, SelectionRestorer, SelectionSerializerWrapper } from '../wrappers';
import { logInfo } from '../../common/debug';

export interface ConfigManagerDependencies {
  validator: SelectionValidator;
  restorer: SelectionRestorer;
  serializer: SelectionSerializerWrapper;
  options: Required<SelectionRestoreOptions>;
  setHighlightStyleFn: (style: HighlightStyle) => void;
}

/**
 * 配置管理器
 */
export class ConfigManager {
  constructor(private deps: ConfigManagerDependencies) {}

  /**
   * 设置选区生效范围
   */
  setEnabledContainers(containers: string[]): void {
    this.deps.options.enabledContainers = [...containers];
    this.deps.validator.updateOptions({ enabledContainers: containers });
    this.deps.restorer.updateOptions({ enabledContainers: containers });
    logInfo('api', '选区生效范围已更新', containers);
  }

  /**
   * 设置选区豁免区域
   */
  setDisabledContainers(containers: string[]): void {
    this.deps.options.disabledContainers = [...containers];
    this.deps.validator.updateOptions({ disabledContainers: containers });
    this.deps.restorer.updateOptions({ disabledContainers: containers });
    logInfo('api', '选区豁免区域已更新', containers);
  }

  /**
   * 设置算法检测的根节点ID
   */
  setRootNodeId(rootNodeId: string | null): void {
    if (rootNodeId) {
      this.deps.options.rootNodeId = rootNodeId;
    } else {
      // 使用类型断言避免 any
      const options = this.deps.options as { rootNodeId?: string };
      delete options.rootNodeId;
    }

    this.deps.validator.updateOptions({ rootNodeId: rootNodeId || undefined });
    this.deps.restorer.updateOptions({ rootNodeId: rootNodeId || undefined });
  }

  /**
   * 获取当前设置的根节点ID
   */
  getRootNodeId(): string | undefined {
    return this.deps.options.rootNodeId;
  }

  /**
   * 添加生效容器
   */
  addEnabledContainer(container: string): void {
    if (!this.deps.options.enabledContainers.includes(container)) {
      this.deps.options.enabledContainers.push(container);
      this.deps.validator.updateOptions({ enabledContainers: this.deps.options.enabledContainers });
      this.deps.restorer.updateOptions({ enabledContainers: this.deps.options.enabledContainers });
      logInfo('api', '添加选区生效容器', container);
    }
  }

  /**
   * 移除生效容器
   */
  removeEnabledContainer(container: string): void {
    const index = this.deps.options.enabledContainers.indexOf(container);
    if (index > -1) {
      this.deps.options.enabledContainers.splice(index, 1);
      this.deps.validator.updateOptions({ enabledContainers: this.deps.options.enabledContainers });
      this.deps.restorer.updateOptions({ enabledContainers: this.deps.options.enabledContainers });
      logInfo('api', '移除选区生效容器', container);
    }
  }

  /**
   * 添加豁免容器
   */
  addDisabledContainer(container: string): void {
    if (!this.deps.options.disabledContainers.includes(container)) {
      this.deps.options.disabledContainers.push(container);
      this.deps.validator.updateOptions({ disabledContainers: this.deps.options.disabledContainers });
      this.deps.restorer.updateOptions({ disabledContainers: this.deps.options.disabledContainers });
      logInfo('api', '添加选区豁免容器', container);
    }
  }

  /**
   * 移除豁免容器
   */
  removeDisabledContainer(container: string): void {
    const index = this.deps.options.disabledContainers.indexOf(container);
    if (index > -1) {
      this.deps.options.disabledContainers.splice(index, 1);
      this.deps.validator.updateOptions({ disabledContainers: this.deps.options.disabledContainers });
      this.deps.restorer.updateOptions({ disabledContainers: this.deps.options.disabledContainers });
      logInfo('api', '移除选区豁免容器', container);
    }
  }

  /**
   * 设置配置选项
   */
  setOptions(options: Partial<SelectionRestoreOptions>): void {
    Object.assign(this.deps.options, options);

    if (options.contextLength !== undefined) {
      this.deps.serializer.setContextLength(options.contextLength);
    }

    if (options.highlightStyle) {
      this.deps.setHighlightStyleFn(options.highlightStyle);
    }

    if (options.enabledContainers !== undefined) {
      this.deps.validator.updateOptions({ enabledContainers: options.enabledContainers });
      this.deps.restorer.updateOptions({ enabledContainers: options.enabledContainers });
    }

    if (options.disabledContainers !== undefined) {
      this.deps.validator.updateOptions({ disabledContainers: options.disabledContainers });
      this.deps.restorer.updateOptions({ disabledContainers: options.disabledContainers });
    }

    if (options.rootNodeId !== undefined) {
      this.deps.validator.updateOptions({ rootNodeId: options.rootNodeId });
      this.deps.restorer.updateOptions({ rootNodeId: options.rootNodeId });
    }
  }

  /**
   * 获取当前配置
   */
  getOptions(): Required<SelectionRestoreOptions> {
    return { ...this.deps.options };
  }
}
