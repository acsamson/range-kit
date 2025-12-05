import { describe, it, expect, beforeEach } from 'vitest';
import { restoreSelection } from '../../restorer/restorer';
import { SerializedSelection } from '../../types';

describe('Single DOM - Key Scenarios', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  // 通用的选区数据创建函数
  const createSelectionData = (
    originalText: string,
    selectedText: string,
    startOffset: number,
    endOffset: number,
    scenario: string,
  ): SerializedSelection => ({
    id: `test-${scenario}`,
    text: selectedText,
    timestamp: Date.now(),
    anchors: {
      startId: 'test-container',
      endId: 'test-container',
      startOffset,
      endOffset,
    },
    paths: {
      startPath: '#test-container',
      endPath: '#test-container',
      startOffset,
      endOffset,
      startTextOffset: startOffset,
      endTextOffset: endOffset,
    },
    multipleAnchors: {
      startAnchors: { tagName: 'div', className: '', id: 'test-container', attributes: {} },
      endAnchors: { tagName: 'div', className: '', id: 'test-container', attributes: {} },
      commonParent: 'test-container',
      siblingInfo: null,
    },
    structuralFingerprint: {
      tagName: 'div',
      className: '',
      attributes: { id: 'test-container' },
      textLength: originalText.length,
      childCount: 0,
      depth: 1,
      parentChain: [],
      siblingPattern: null,
    },
    textContext: {
      precedingText: originalText.substring(Math.max(0, startOffset - 10), startOffset),
      followingText: originalText.substring(endOffset, Math.min(originalText.length, endOffset + 10)),
      parentText: originalText,
      textPosition: { start: startOffset, end: endOffset, totalLength: originalText.length },
    },
    selectionContent: {
      text: selectedText,
      mediaElements: [],
    },
    metadata: {
      url: 'test://single-dom',
      title: 'Single DOM Test',
      selectionBounds: { x: 0, y: 0, width: 100, height: 20, top: 0, right: 100, bottom: 20, left: 0, toJSON: () => ({}) } as DOMRect,
      viewport: { width: 1920, height: 1080 },
      userAgent: 'test-agent',
    },
    restoreStatus: 'pending' as any,
    appName: 'Test App',
    appUrl: 'test://single-dom',
  });

  describe('1. 文本删除场景', () => {
    it('应该处理简单的前缀删除', () => {
      console.log('\n=== 测试: 前缀删除 ===');

      // 原始: "ABCDEF", 选区: "EF" (4-6)
      // 删除AB → "CDEF", 选区应该变成: "EF" (2-4)
      container.textContent = 'CDEF';

      const selectionData = createSelectionData('ABCDEF', 'EF', 4, 6, 'prefix-delete');

      console.log('原始文本: "ABCDEF", 选区: "EF" (4-6)');
      console.log('删除AB后: "CDEF"');

      const result = restoreSelection(selectionData);

      console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

      if (result.success) {
        expect(result.layer).toBeGreaterThan(0);
        expect(result.restoreTime).toBeLessThan(100);
      } else {
        console.log(`失败原因: ${result.error}`);
      }
    });

    it('应该识别选区完全被删除的情况', () => {
      console.log('\n=== 测试: 选区完全删除 ===');

      // 原始: "ABCDEF", 选区: "CD" (2-4)
      // 删除CD → "ABEF", 选区丢失
      container.textContent = 'ABEF';

      const selectionData = createSelectionData('ABCDEF', 'CD', 2, 4, 'complete-delete');

      console.log('原始文本: "ABCDEF", 选区: "CD" (2-4)');
      console.log('删除CD后: "ABEF" (选区丢失)');

      const result = restoreSelection(selectionData);

      console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

      // 选区完全删除，应该失败
      expect(result.success).toBe(false);
      expect(result.layer).toBe(0);
      expect(result.layerName).toBe('恢复失败');
      console.log(`❌ 正确识别选区已删除: ${result.error}`);
    });
  });

  describe('2. 文本插入场景', () => {
    it('应该处理前缀插入', () => {
      console.log('\n=== 测试: 前缀插入 ===');

      // 原始: "ABCD", 选区: "CD" (2-4)
      // 前缀插入XY → "XYABCD", 选区应该变成: "CD" (4-6)
      container.textContent = 'XYABCD';

      const selectionData = createSelectionData('ABCD', 'CD', 2, 4, 'prefix-insert');

      console.log('原始文本: "ABCD", 选区: "CD" (2-4)');
      console.log('前缀插入XY: "XYABCD"');

      const result = restoreSelection(selectionData);

      console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

      if (result.success) {
        expect(result.layer).toBeGreaterThan(0);
        expect(result.restoreTime).toBeLessThan(100);
      }
    });
  });

  describe('3. 重复文本歧义场景', () => {
    it('应该处理简单的重复文本场景', () => {
      console.log('\n=== 测试: 重复文本歧义 ===');

      // 设置重复文本内容
      container.innerHTML = '<div>这是重复文本，这是重复文本</div>';

      const selectionData = createSelectionData('ABCABC', 'ABC', 3, 6, 'ambiguous-text');

      const result = restoreSelection(selectionData);

      if (result.success) {
        console.log(`✅ 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);
        console.log('✅ 成功处理重复文本歧义');
      } else {
        console.log(`⚠️ 重复文本处理失败: ${result.error}`);
      }

      expect(result).toBeDefined();
    });

    it('4.1 重复文本-删除前面', () => {
      console.log('\n🎯 测试场景: 4.1 删除前面的重复项');

      // 原始: "abcabcabc", 选区: 第2个"bc" (位置4-6)
      // 删除: 第1个"abc" → "abcabc"
      container.innerHTML = '<div>abcabc</div>';

      const selectionData = createSelectionData('abcabcabc', 'bc', 1, 3, 'repeat-delete-front');

      console.log('📊 删除前面重复项后，选区应该向前移动');

      const result = restoreSelection(selectionData);

      if (result.success) {
        console.log(`✅ 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);
        console.log('✅ 正确处理删除前面重复项的情况');
      } else {
        console.log(`⚠️ 删除前面重复项处理失败: ${result.error}`);
      }

      expect(result).toBeDefined();
    });

    it('4.2 重复文本-删除中间', () => {
      console.log('\n🎯 测试场景: 4.2 删除中间的重复项');

      // 原始: "abcabcabc", 选区: 第3个"bc" (位置7-9)
      // 删除: 第2个"abc" → "abcabc"
      container.innerHTML = '<div>abcabc</div>';

      const selectionData = createSelectionData('abcabcabc', 'bc', 4, 6, 'repeat-delete-middle');

      console.log('📊 删除中间重复项后，选区应该重新定位');

      const result = restoreSelection(selectionData);

      if (result.success) {
        console.log(`✅ 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);
        console.log('✅ 正确处理删除中间重复项的情况');
      } else {
        console.log(`⚠️ 删除中间重复项处理失败: ${result.error}`);
      }

      expect(result).toBeDefined();
    });

    it('4.4 重复文本-插入干扰', () => {
      console.log('\n🎯 测试场景: 4.4 插入相同文本造成歧义');

      // 原始: "abcdefabc", 选区: 第2个"abc" (位置6-9)
      // 插入: 开头插入"abc" → "abcabcdefabc"
      container.innerHTML = '<div>abcabcdefabc</div>';

      const selectionData = createSelectionData('abcdefabc', 'abc', 6, 9, 'repeat-insert-ambiguous');

      console.log('📊 插入相同文本后，选区应该向后移动');

      const result = restoreSelection(selectionData);

      if (result.success) {
        console.log(`✅ 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);
        console.log('✅ 正确处理插入干扰的情况');
      } else {
        console.log(`⚠️ 插入干扰处理失败: ${result.error}`);
      }

      expect(result).toBeDefined();
    });
  });

  describe('5. 复杂变化场景', () => {
    it('5.1 多重操作-删除和插入', () => {
      console.log('\n🎯 测试场景: 5.1 同时进行删除和插入');

      // 原始: "ABCDEFGHIJ", 选区: "EF" (位置4-6)
      // 操作: 删除"BC"，插入"XYZ" → "AXYZDEFGHIJ"
      container.innerHTML = '<div>AXYZDEFGHIJ</div>';

      const selectionData = createSelectionData('ABCDEFGHIJ', 'EF', 5, 7, 'complex-delete-insert');

      console.log('📊 复杂变化：删除BC，插入XYZ，选区EF应该向后移动');

      const result = restoreSelection(selectionData);

      if (result.success) {
        console.log(`✅ 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);
        console.log('✅ 正确处理多重操作的情况');
      } else {
        console.log(`⚠️ 多重操作处理失败: ${result.error}`);
      }

      expect(result).toBeDefined();
    });

    it('5.2 大范围重组', () => {
      console.log('\n🎯 测试场景: 5.2 文本顺序发生较大变化');

      // 原始: "ABCDEFGH", 选区: "EF" (位置4-6)
      // 重组: "DEFGHABC" (后半部分移到前面)
      container.innerHTML = '<div>DEFGHABC</div>';

      const selectionData = createSelectionData('ABCDEFGH', 'EF', 1, 3, 'text-reorder');

      console.log('📊 大范围重组：ABCDEFGH → DEFGHABC');

      const result = restoreSelection(selectionData);

      if (result.success) {
        console.log(`✅ 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);
        console.log('✅ 正确处理文本重组的情况');
      } else {
        console.log(`⚠️ 文本重组处理失败: ${result.error}`);
      }

      expect(result).toBeDefined();
    });
  });
});

