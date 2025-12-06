/**
 * 测试辅助工具
 * 提供创建符合新数据结构的测试数据的工具函数
 */

import type {
  SerializedSelection,
  AnchorInfo,
  PathInfo,
  MultipleAnchorInfo,
  StructuralFingerprint,
  TextContext,
  RestoreData,
} from '../../types';

/**
 * 创建默认的 RestoreData 对象
 */
export const createDefaultRestoreData = (overrides: Partial<RestoreData> = {}): RestoreData => ({
  anchors: {
    startId: '',
    endId: '',
    startOffset: 0,
    endOffset: 0,
  },
  paths: {
    startPath: '',
    endPath: '',
    startOffset: 0,
    endOffset: 0,
    startTextOffset: 0,
    endTextOffset: 0,
  },
  multipleAnchors: {
    startAnchors: { tagName: '', className: '', id: '', attributes: {} },
    endAnchors: { tagName: '', className: '', id: '', attributes: {} },
    commonParent: '',
    siblingInfo: null,
  },
  fingerprint: {
    tagName: '',
    className: '',
    attributes: {},
    textLength: 0,
    childCount: 0,
    depth: 0,
    parentChain: [],
    siblingPattern: null,
  },
  context: {
    precedingText: '',
    followingText: '',
    parentText: '',
    textPosition: { start: 0, end: 0, totalLength: 0 },
  },
  ...overrides,
});

/**
 * 创建默认的测试选区数据
 */
export const createTestSelection = (overrides: Partial<SerializedSelection> = {}): SerializedSelection => {
  const { restore: restoreOverrides, ...otherOverrides } = overrides as any;

  return {
    id: 'test-default',
    text: '测试文本',
    restore: createDefaultRestoreData(restoreOverrides),
    ...otherOverrides,
  };
};

/**
 * 创建带有 anchors 的测试选区数据
 */
export const createTestSelectionWithAnchors = (
  startId: string,
  endId: string,
  startOffset: number,
  endOffset: number,
  text: string,
  id: string = 'test-anchors',
): SerializedSelection => ({
  id,
  text,
  restore: createDefaultRestoreData({
    anchors: { startId, endId, startOffset, endOffset },
  }),
});

/**
 * 创建带有 paths 的测试选区数据
 */
export const createTestSelectionWithPaths = (
  startPath: string,
  endPath: string,
  startOffset: number,
  endOffset: number,
  text: string,
  id: string = 'test-paths',
  startTextOffset?: number,
  endTextOffset?: number,
): SerializedSelection => ({
  id,
  text,
  restore: createDefaultRestoreData({
    paths: {
      startPath,
      endPath,
      startOffset,
      endOffset,
      startTextOffset: startTextOffset ?? startOffset,
      endTextOffset: endTextOffset ?? endOffset,
    },
  }),
});

/**
 * 创建带有 multipleAnchors 的测试选区数据
 */
export const createTestSelectionWithMultipleAnchors = (
  text: string,
  multipleAnchors: MultipleAnchorInfo,
  id: string = 'test-multiple-anchors',
): SerializedSelection => ({
  id,
  text,
  restore: createDefaultRestoreData({ multipleAnchors }),
});

/**
 * 创建带有 fingerprint 的测试选区数据
 */
export const createTestSelectionWithFingerprint = (
  text: string,
  fingerprint: StructuralFingerprint,
  context?: TextContext,
  id: string = 'test-fingerprint',
): SerializedSelection => ({
  id,
  text,
  restore: createDefaultRestoreData({
    fingerprint,
    context: context || {
      precedingText: '',
      followingText: '',
      parentText: '',
      textPosition: { start: 0, end: 0, totalLength: 0 },
    },
  }),
});

/**
 * 从旧的扁平数据结构转换为新的嵌套结构
 * 用于迁移旧测试数据
 */
export const convertOldTestData = (oldData: any): SerializedSelection => {
  const {
    id,
    text,
    type,
    anchors,
    paths,
    multipleAnchors,
    structuralFingerprint,
    textContext,
    // 移除所有旧字段
    timestamp,
    metadata,
    selectionContent,
    restoreStatus,
    appName,
    appUrl,
    contentHash,
    ...rest
  } = oldData;

  return {
    id,
    text,
    type,
    restore: {
      anchors: anchors || { startId: '', endId: '', startOffset: 0, endOffset: 0 },
      paths: paths || { startPath: '', endPath: '', startOffset: 0, endOffset: 0, startTextOffset: 0, endTextOffset: 0 },
      multipleAnchors: multipleAnchors || {
        startAnchors: { tagName: '', className: '', id: '', attributes: {} },
        endAnchors: { tagName: '', className: '', id: '', attributes: {} },
        commonParent: '',
        siblingInfo: null,
      },
      fingerprint: structuralFingerprint || {
        tagName: '',
        className: '',
        attributes: {},
        textLength: 0,
        childCount: 0,
        depth: 0,
        parentChain: [],
        siblingPattern: null,
      },
      context: textContext || {
        precedingText: '',
        followingText: '',
        parentText: '',
        textPosition: { start: 0, end: 0, totalLength: 0 },
      },
    },
    ...rest,
  };
};
