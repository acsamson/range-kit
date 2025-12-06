/**
 * 选区数据转换工具
 * 用于在完整数据和精简数据之间进行转换
 */

import type { SerializedSelection, SerializedSelectionSimple } from '../types';

/**
 * 将完整选区数据转换为精简版本
 * 只保留恢复算法需要的核心字段，适合传给后端保存
 * 精简版本不包含 runtime 字段
 *
 * @param selection - 完整的选区数据
 * @returns 精简的选区数据
 */
export const convertToSimple = (selection: SerializedSelection): SerializedSelectionSimple => ({
  id: selection.id,
  text: selection.text,
  type: selection.type,
  restore: selection.restore,
});

/**
 * 批量转换选区数据为精简版本
 *
 * @param selections - 完整的选区数据数组
 * @returns 精简的选区数据数组
 */
export const convertSelectionsToSimple = (
  selections: SerializedSelection[]
): SerializedSelectionSimple[] => {
  return selections.map(convertToSimple);
};
