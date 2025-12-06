/**
 * 选区数据格式转换器
 * 负责 SerializedSelection 与 RangeData 之间的转换
 */

import type {
  SerializedSelection,
  RestoreData,
  AnchorInfo,
  PathInfo,
  MultipleAnchorInfo,
  StructuralFingerprint,
  TextContext,
  RangeData,
} from '../types';

/**
 * 将 SerializedSelection 转换为 RangeData 格式
 */
export function convertSelectionToRange(selectionData: SerializedSelection): RangeData {
  if (!selectionData) {
    console.error('[DataConverter] convertSelectionToRange: selectionData is undefined');
    throw new Error('Selection data is required');
  }

  const restore = selectionData.restore;
  const paths = restore.paths;
  const anchors = restore.anchors;
  const fingerprint = restore.fingerprint;
  const context = restore.context;
  const multipleAnchors = restore.multipleAnchors;

  return {
    id: selectionData.id || '',
    startContainerPath: paths.startPath || '',
    startOffset: paths.startOffset || 0,
    endContainerPath: paths.endPath || '',
    endOffset: paths.endOffset || 0,
    selectedText: selectionData.text || '',
    pageUrl: window.location.href,
    timestamp: Date.now(),
    rect: undefined,
    contextBefore: context.precedingText || '',
    contextAfter: context.followingText || '',
    anchorInfo: anchors.startId ? {
      id: anchors.startId,
      startRelativePath: '',
      endRelativePath: ''
    } : undefined,
    multiAnchorInfo: {
      primaryAnchor: anchors.startId ? {
        id: anchors.startId,
        tagName: multipleAnchors.startAnchors?.tagName || '',
        depth: 0,
        startRelativePath: '',
        endRelativePath: '',
        reliability: 90,
        attributes: multipleAnchors.startAnchors?.attributes || {}
      } : undefined,
      fallbackAnchors: [],
      structuralFingerprint: {
        hierarchyPattern: fingerprint.parentChain?.map(p => p.tagName) || [],
        depthFromBody: fingerprint.depth || 0,
        siblingContext: {
          tagsBefore: fingerprint.siblingPattern?.beforeTags || [],
          tagsAfter: fingerprint.siblingPattern?.afterTags || [],
          totalSiblings: fingerprint.siblingPattern?.total || 0,
          positionInSiblings: fingerprint.siblingPattern?.position || 0
        },
        contentSignature: {
          textLength: fingerprint.textLength || 0,
          textHash: '',
          hasImages: false,
          hasLinks: false,
          uniqueWords: []
        },
        attributeSignature: {
          hasId: !!(fingerprint.attributes?.id),
          hasDataAttributes: Object.keys(fingerprint.attributes || {}).some(k => k.startsWith('data-')),
          commonAttributes: Object.keys(fingerprint.attributes || {})
        }
      }
    }
  };
}

/**
 * 将 RangeData 转换为 SerializedSelection 格式
 */
export function convertRangeToSelection(rangeData: RangeData): SerializedSelection {
  // 构建 AnchorInfo
  const anchors: AnchorInfo = {
    startId: rangeData.anchorInfo?.id || null,
    endId: rangeData.anchorInfo?.id || null,
    startOffset: rangeData.startOffset,
    endOffset: rangeData.endOffset
  };

  // 构建 PathInfo
  const paths: PathInfo = {
    startPath: rangeData.startContainerPath,
    endPath: rangeData.endContainerPath,
    startOffset: rangeData.startOffset,
    endOffset: rangeData.endOffset,
    startTextOffset: 0,
    endTextOffset: 0
  };

  // 构建 MultipleAnchorInfo
  const multipleAnchors: MultipleAnchorInfo = {
    startAnchors: {
      tagName: rangeData.multiAnchorInfo?.primaryAnchor?.tagName || '',
      className: '',
      id: rangeData.multiAnchorInfo?.primaryAnchor?.id || '',
      attributes: rangeData.multiAnchorInfo?.primaryAnchor?.attributes || {}
    },
    endAnchors: {
      tagName: rangeData.multiAnchorInfo?.primaryAnchor?.tagName || '',
      className: '',
      id: rangeData.multiAnchorInfo?.primaryAnchor?.id || '',
      attributes: rangeData.multiAnchorInfo?.primaryAnchor?.attributes || {}
    },
    commonParent: null,
    siblingInfo: null
  };

  // 构建 StructuralFingerprint
  const fingerprint: StructuralFingerprint = {
    tagName: '',
    className: '',
    attributes: rangeData.multiAnchorInfo?.structuralFingerprint?.attributeSignature.commonAttributes.reduce((acc, attr) => {
      acc[attr] = '';
      return acc;
    }, {} as Record<string, string>) || {},
    textLength: rangeData.multiAnchorInfo?.structuralFingerprint?.contentSignature.textLength || 0,
    childCount: 0,
    depth: rangeData.multiAnchorInfo?.structuralFingerprint?.depthFromBody || 0,
    parentChain: rangeData.multiAnchorInfo?.structuralFingerprint?.hierarchyPattern.map(tag => ({
      tagName: tag,
      className: '',
      id: ''
    })) || [],
    siblingPattern: {
      position: rangeData.multiAnchorInfo?.structuralFingerprint?.siblingContext.positionInSiblings || 0,
      total: rangeData.multiAnchorInfo?.structuralFingerprint?.siblingContext.totalSiblings || 0,
      beforeTags: rangeData.multiAnchorInfo?.structuralFingerprint?.siblingContext.tagsBefore || [],
      afterTags: rangeData.multiAnchorInfo?.structuralFingerprint?.siblingContext.tagsAfter || []
    }
  };

  // 构建 TextContext
  const context: TextContext = {
    precedingText: rangeData.contextBefore || '',
    followingText: rangeData.contextAfter || '',
    parentText: '',
    textPosition: {
      start: rangeData.startOffset,
      end: rangeData.endOffset,
      totalLength: 0
    }
  };

  // 构建 RestoreData
  const restore: RestoreData = {
    anchors,
    paths,
    multipleAnchors,
    fingerprint,
    context
  };

  return {
    id: rangeData.id,
    text: rangeData.selectedText,
    restore
  };
}
