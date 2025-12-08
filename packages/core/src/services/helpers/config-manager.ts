/**
 * 配置管理助手
 * 处理容器配置、选项管理等
 */

import { SelectionRestoreOptions } from '../../types';
import { SelectionValidator, SelectionRestorer } from '../wrappers';
import { logInfo } from '../../common/debug';

export interface ConfigManagerDependencies {
  validator: SelectionValidator;
  restorer: SelectionRestorer;
  options: Required<SelectionRestoreOptions>;
}

/**
 * 配置管理器
 */
export class ConfigManager {
  constructor(private deps: ConfigManagerDependencies) {}

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
    logInfo('api', '根节点ID已更新', rootNodeId);
  }

  /**
   * 获取当前设置的根节点ID
   */
  getRootNodeId(): string | undefined {
    return this.deps.options.rootNodeId;
  }

  /**
   * 设置配置选项
   */
  setOptions(options: Partial<SelectionRestoreOptions>): void {
    Object.assign(this.deps.options, options);

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
