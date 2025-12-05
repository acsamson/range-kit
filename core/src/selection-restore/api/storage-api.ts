/**
 * 存储 API 方法
 * 包含选区数据的存储、导入、导出等方法
 */

import type {
  SerializedSelection,
  SerializedSelectionSimple,
  SelectionStats,
} from '../types';

import type { SelectionStorage } from '../core/selection-storage';
import type { SelectionInstanceManager } from '../manager/selection-instance-manager';

import {
  logSuccess,
  logError,
} from '../debug/logger';

import { convertToSimple } from '../utils';

/**
 * 存储 API 依赖接口
 */
export interface StorageAPIDependencies {
  storage: SelectionStorage;
  selectionManager: SelectionInstanceManager;
}

/**
 * 获取所有保存的选区
 */
export async function getAllSelections(
  deps: StorageAPIDependencies,
): Promise<SerializedSelection[]> {
  return await deps.storage.getAll();
}

/**
 * 获取所有保存的选区（精简版本）
 * 只包含恢复算法需要的核心字段，适合传给后端保存
 */
export async function getAllSelectionsSimple(
  deps: StorageAPIDependencies,
): Promise<SerializedSelectionSimple[]> {
  const selections = await deps.storage.getAll();
  return selections.map(convertToSimple);
}

/**
 * 删除选区
 */
export async function deleteSelection(
  deps: StorageAPIDependencies,
  id: string,
): Promise<void> {
  try {
    deps.selectionManager.removeSelection(id);
    await deps.storage.delete(id);
    logSuccess('api', `选区已删除: ${id}`);
  } catch (error) {
    logError('api', '删除选区时发生错误', error);
    throw error;
  }
}

/**
 * 清空所有选区
 */
export async function clearAllSelections(
  deps: StorageAPIDependencies,
): Promise<void> {
  try {
    const allSelections = await deps.selectionManager.getAllSelections();
    for (const selection of allSelections) {
      deps.selectionManager.removeSelection(selection.id);
    }
    await deps.storage.clear();
    logSuccess('api', '所有选区已清空');
  } catch (error) {
    logError('api', '清空选区时发生错误', error);
    throw error;
  }
}

/**
 * 更新选区数据
 */
export async function updateSelection(
  deps: StorageAPIDependencies,
  id: string,
  updates: Partial<SerializedSelection>,
): Promise<void> {
  try {
    const existing = await deps.storage.get(id);
    if (!existing) {
      throw new Error(`找不到ID为 ${id} 的选区数据`);
    }

    const updated = { ...existing, ...updates };
    await deps.storage.save(updated);
    logSuccess('api', `选区已更新: ${id}`);
  } catch (error) {
    logError('api', '更新选区时发生错误', error);
    throw error;
  }
}

/**
 * 导入选区数据到 storage
 * 用于批量导入外部选区数据（如从后端获取的数据）
 * @param selections 要导入的选区数据数组
 * @returns 导入结果
 */
export async function importSelections(
  deps: StorageAPIDependencies,
  selections: SerializedSelection[],
): Promise<{
  success: number;
  total: number;
  errors: string[];
}> {
  const result = {
    success: 0,
    total: selections.length,
    errors: [] as string[]
  };

  for (const selection of selections) {
    try {
      await deps.storage.save(selection);
      result.success++;
    } catch (error) {
      const errorMsg = `导入选区 ${selection.id} 失败: ${error}`;
      result.errors.push(errorMsg);
      logError('api', errorMsg);
    }
  }

  logSuccess('api', `选区导入完成: ${result.success}/${result.total}`);
  return result;
}

/**
 * 获取统计信息
 */
export async function getStats(
  deps: StorageAPIDependencies,
): Promise<SelectionStats> {
  return await deps.storage.getStats();
}

/**
 * 导出数据
 */
export async function exportData(
  deps: StorageAPIDependencies,
): Promise<string> {
  return await deps.storage.exportData();
}

/**
 * 导入数据
 */
export async function importData(
  deps: StorageAPIDependencies,
  jsonData: string,
): Promise<number> {
  return await deps.storage.importData(jsonData);
}

