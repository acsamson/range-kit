/**
 * 选区数据格式转换器
 * 负责 SerializedSelection 与 RangeData 之间的转换
 */

import type { SerializedSelection } from '../selection-restore';
import type { RangeData } from '../types';

/**
 * 将 SerializedSelection 转换为 RangeData 格式
 */
export function convertSelectionToRange(selectionData: SerializedSelection): RangeData {
  if (!selectionData) {
    console.error('[DataConverter] convertSelectionToRange: selectionData is undefined');
    throw new Error('Selection data is required');
  }

  const rect = selectionData.metadata?.selectionBounds;
  const paths = selectionData.paths || {};

  return {
    id: selectionData.id || '',
    startContainerPath: paths.startPath || '',
    startOffset: paths.startOffset || 0,
    endContainerPath: paths.endPath || '',
    endOffset: paths.endOffset || 0,
    selectedText: selectionData.text || '',
    pageUrl: selectionData.metadata?.url || window.location.href,
    timestamp: selectionData.timestamp || Date.now(),
    rect: rect ? {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top || rect.y,
      right: rect.right || rect.x + rect.width,
      bottom: rect.bottom || rect.y + rect.height,
      left: rect.left || rect.x
    } : undefined,
    contextBefore: selectionData.textContext?.precedingText || '',
    contextAfter: selectionData.textContext?.followingText || '',
    anchorInfo: selectionData.anchors?.startId ? {
      id: selectionData.anchors.startId,
      startRelativePath: '',
      endRelativePath: ''
    } : undefined,
    multiAnchorInfo: {
      primaryAnchor: selectionData.anchors?.startId ? {
        id: selectionData.anchors.startId,
        tagName: selectionData.multipleAnchors?.startAnchors?.tagName || '',
        depth: 0,
        startRelativePath: '',
        endRelativePath: '',
        reliability: 90,
        attributes: selectionData.multipleAnchors?.startAnchors?.attributes || {}
      } : undefined,
      fallbackAnchors: [],
      structuralFingerprint: {
        hierarchyPattern: selectionData.structuralFingerprint?.parentChain?.map(p => p.tagName) || [],
        depthFromBody: selectionData.structuralFingerprint?.depth || 0,
        siblingContext: {
          tagsBefore: selectionData.structuralFingerprint?.siblingPattern?.beforeTags || [],
          tagsAfter: selectionData.structuralFingerprint?.siblingPattern?.afterTags || [],
          totalSiblings: selectionData.structuralFingerprint?.siblingPattern?.total || 0,
          positionInSiblings: selectionData.structuralFingerprint?.siblingPattern?.position || 0
        },
        contentSignature: {
          textLength: selectionData.structuralFingerprint?.textLength || 0,
          textHash: '',
          hasImages: selectionData.selectionContent?.mediaElements?.some(m => m.type === 'image') || false,
          hasLinks: false,
          uniqueWords: []
        },
        attributeSignature: {
          hasId: !!(selectionData.structuralFingerprint?.attributes?.id),
          hasDataAttributes: Object.keys(selectionData.structuralFingerprint?.attributes || {}).some(k => k.startsWith('data-')),
          commonAttributes: Object.keys(selectionData.structuralFingerprint?.attributes || {})
        }
      }
    }
  };
}

/**
 * 将 RangeData 转换为 SerializedSelection 格式
 */
export function convertRangeToSelection(rangeData: RangeData): SerializedSelection {
  return {
    id: rangeData.id,
    text: rangeData.selectedText,
    timestamp: rangeData.timestamp,
    anchors: {
      startId: rangeData.anchorInfo?.id || null,
      endId: rangeData.anchorInfo?.id || null,
      startOffset: rangeData.startOffset,
      endOffset: rangeData.endOffset
    },
    paths: {
      startPath: rangeData.startContainerPath,
      endPath: rangeData.endContainerPath,
      startOffset: rangeData.startOffset,
      endOffset: rangeData.endOffset,
      startTextOffset: 0,
      endTextOffset: 0
    },
    multipleAnchors: {
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
    },
    structuralFingerprint: {
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
    },
    textContext: {
      precedingText: rangeData.contextBefore || '',
      followingText: rangeData.contextAfter || '',
      parentText: '',
      textPosition: {
        start: rangeData.startOffset,
        end: rangeData.endOffset,
        totalLength: 0
      }
    },
    selectionContent: {
      text: rangeData.selectedText,
      mediaElements: [],
      htmlStructure: ''
    },
    metadata: {
      url: rangeData.pageUrl,
      title: document.title,
      selectionBounds: rangeData.rect ?
        new DOMRect(rangeData.rect.x, rangeData.rect.y, rangeData.rect.width, rangeData.rect.height) :
        new DOMRect(0, 0, 0, 0),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      userAgent: navigator.userAgent
    },
    appUrl: rangeData.pageUrl
  };
}
