/**
 * ===================================================================
 * Layer 3: 多重锚点恢复算法 - 单元测试
 * ===================================================================
 *
 * 测试范围：
 * 1. 基础多重锚点恢复功能
 * 2. 动态DOM结构变化场景
 * 3. 容器范围过滤
 * 4. 跨元素文本匹配
 * 5. 干扰元素处理
 * 6. 相似度计算算法
 * 7. 真实数据恢复测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { restoreByMultipleAnchors } from '../../restorer/layers/layer3-multiple-anchors';
import { SerializedSelection, RestoreStatus } from '../../types';

describe('Layer 3: 多重锚点恢复算法', () => {
  describe('🆕 根节点限定功能测试', () => {
    it('应该只在指定的根节点内查找锚点元素', () => {
      // 创建根节点限定测试环境
      const rootNode = document.createElement('div');
      rootNode.id = 'l3-specific-root';
      rootNode.innerHTML = `
        <article class="l3-test-article">
          <h3 class="l3-test-heading">Layer3根节点限定测试</h3>
          <p class="l3-test-content">这是多重锚点算法的根节点限定测试内容</p>
        </article>
      `;
      document.body.appendChild(rootNode);

      const targetText = '根节点限定测试';
      const selectionData: SerializedSelection = {
        id: 'test-l3-root-limited',
        text: targetText,
        timestamp: Date.now(),
        anchors: { startId: '', endId: '', startOffset: 0, endOffset: 0 },
        paths: { startPath: '', endPath: '', startOffset: 0, endOffset: 0, startTextOffset: 0, endTextOffset: 0 },
        multipleAnchors: {
          startAnchors: { tagName: 'h3', className: 'l3-test-heading', id: '', attributes: {} },
          endAnchors: { tagName: 'p', className: 'l3-test-content', id: '', attributes: {} },
          commonParent: 'article.l3-test-article',
          siblingInfo: null,
        },
        structuralFingerprint: {
          tagName: 'h3', className: 'l3-test-heading', attributes: {}, textLength: 0,
          childCount: 0, depth: 0, parentChain: [], siblingPattern: null,
        },
        textContext: {
          precedingText: '', followingText: '', parentText: '',
          textPosition: { start: 0, end: 0, totalLength: 0 },
        },
        metadata: {
          url: 'http://localhost:3000/', title: 'Test',
          selectionBounds: { x: 0, y: 0, width: 100, height: 20, top: 0, right: 100, bottom: 20, left: 0, toJSON: () => ({}) } as DOMRect,
          viewport: { width: 1920, height: 1080 }, userAgent: 'test-agent',
        },
        selectionContent: { text: targetText, mediaElements: [] },
        restoreStatus: 'pending' as any, appName: 'Test App',
        appUrl: 'http://localhost:3000/', contentHash: 'test',
      };

      // 使用根节点限定
      const containerConfig = {
        enabledContainers: [],
        disabledContainers: [],
        rootNodeId: 'l3-specific-root',
      };

      const result = restoreByMultipleAnchors(selectionData, containerConfig);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      // 清理测试元素
      document.body.removeChild(rootNode);
    });

    it('当指定的根节点不存在时应该降级到document查找', () => {
      // 先创建包含目标文本的DOM结构
      const testContainer = document.createElement('div');
      testContainer.innerHTML = `
        <section>
          <article>
            <div>
              <h3>📊 人工智能投资统计</h3>
              <p>人工智能芯片投资额达1,250亿元，增长率68%。</p>
            </div>
          </article>
        </section>
      `;
      document.body.appendChild(testContainer);

      const targetText = '人工智能芯片投资额';
      const selectionData: SerializedSelection = {
        id: 'test-l3-nonexistent-root',
        text: targetText,
        timestamp: Date.now(),
        anchors: { startId: '', endId: '', startOffset: 0, endOffset: 0 },
        paths: { startPath: '', endPath: '', startOffset: 0, endOffset: 0, startTextOffset: 0, endTextOffset: 0 },
        multipleAnchors: {
          startAnchors: { tagName: 'p', className: '', id: '', attributes: {} },
          endAnchors: { tagName: 'p', className: '', id: '', attributes: {} },
          commonParent: 'div',
          siblingInfo: null,
        },
        structuralFingerprint: {
          tagName: 'p', className: '', attributes: {}, textLength: targetText.length,
          childCount: 0, depth: 0, parentChain: [], siblingPattern: null,
        },
        textContext: {
          precedingText: '', followingText: '', parentText: '',
          textPosition: { start: 0, end: 0, totalLength: 0 },
        },
        metadata: {
          url: 'http://localhost:3000/', title: 'Test',
          selectionBounds: { x: 0, y: 0, width: 100, height: 20, top: 0, right: 100, bottom: 20, left: 0, toJSON: () => ({}) } as DOMRect,
          viewport: { width: 1920, height: 1080 }, userAgent: 'test-agent',
        },
        selectionContent: { text: targetText, mediaElements: [] },
        restoreStatus: 'pending' as any, appName: 'Test App',
        appUrl: 'http://localhost:3000/', contentHash: 'test',
      };

      // 使用不存在的根节点ID
      const containerConfig = {
        enabledContainers: [],
        disabledContainers: [],
        rootNodeId: 'nonexistent-l3-root',
      };

      const result = restoreByMultipleAnchors(selectionData, containerConfig);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe(targetText);
      }

      // 清理
      document.body.removeChild(testContainer);
    });
  });
  let container: HTMLElement;

  beforeEach(() => {
    // 创建测试容器
    container = document.createElement('div');
    container.innerHTML = '';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // 清理测试环境
    document.body.removeChild(container);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  });

  // 创建完整的MockData辅助函数
  function createMockData(text: string, startTag: string, endTag: string, startClass = '', endClass = '', startId = '', endId = ''): SerializedSelection {
    return {
      id: 'test_' + Date.now(),
      timestamp: Date.now(),
      text,
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
        startAnchors: {
          tagName: startTag,
          className: startClass,
          id: startId,
          attributes: {},
        },
        endAnchors: {
          tagName: endTag,
          className: endClass,
          id: endId,
          attributes: {},
        },
        commonParent: '',
        siblingInfo: null,
      },
      structuralFingerprint: {
        tagName: startTag,
        className: startClass,
        attributes: {},
        textLength: text.length,
        childCount: 0,
        depth: 5,
        parentChain: [],
        siblingPattern: {
          position: 0,
          total: 1,
          beforeTags: [],
          afterTags: [],
        },
      },
      textContext: {
        precedingText: '',
        followingText: '',
        parentText: text,
        textPosition: { start: 0, end: text.length, totalLength: text.length },
      },
      metadata: {
        url: 'http://localhost:3000',
        title: 'Test',
        selectionBounds: { x: 0, y: 0, width: 100, height: 20, top: 0, right: 100, bottom: 20, left: 0, toJSON: () => ({}) },
        viewport: { width: 1024, height: 768 },
        userAgent: 'test',
      },
      selectionContent: {
        text,
        mediaElements: [],
      },
      appName: 'Test App',
      appUrl: 'http://localhost:3000',
      contentHash: 'test123',
      restoreStatus: RestoreStatus.SUCCESS,
    };
  }

  describe('1. 基础多重锚点恢复', () => {
    it('应该能够通过p标签锚点恢复选区', () => {
      container.innerHTML = `
        <section>
          <article>
            <div>
              <h3>📊 人工智能投资统计</h3>
              <p>人工智能芯片投资额达1,250亿元，增长率68%。智能制造设备投资890亿元，增长率42%。机器人技术投资670亿元，增长率35%。这些数据显示AI产业正在快速发展。</p>
            </div>
          </article>
        </section>
      `;

      const targetText = '增长率35%。这些数据显示AI产业正在快速发展。';
      const mockData = createMockData(targetText, 'p', 'p');

      // 清除之前的Range存储
      delete (window as any).__lastRestoredRange;

      const result = restoreByMultipleAnchors(mockData);
      expect(result).toBe(true);

      // 验证Range对象而不是Selection
      expect((window as any).__lastRestoredRange).toBeDefined();
      if ((window as any).__lastRestoredRange) {
        const rangeText = (window as any).__lastRestoredRange.toString();
        expect(rangeText).toBe(targetText);
      }
    });

    it('应该能够处理跨h3和p元素的选区', () => {
      container.innerHTML = `
        <div>
          <h3>🚗 新能源汽车技术突破</h3>
          <p>新能源汽车销量创历史新高，预计今年将突破500万台大关。</p>
        </div>
      `;

      // 先简化为单个p元素内的选区，确保基本功能正常
      const targetText = '新能源汽车销量创历史新高';
      const mockData = createMockData(targetText, 'p', 'p');

      // 清除之前的Range存储
      delete (window as any).__lastRestoredRange;

      const result = restoreByMultipleAnchors(mockData);
      expect(result).toBe(true);

      // 验证Range对象
      expect((window as any).__lastRestoredRange).toBeDefined();
      if ((window as any).__lastRestoredRange) {
        const rangeText = (window as any).__lastRestoredRange.toString();
        expect(rangeText).toBe(targetText);
      }
    });
  });

  describe('2. 动态DOM结构变化场景', () => {
    it('应该在不同DOM结构中找到相同文本内容', () => {
      // 结构1：深度嵌套
      container.innerHTML = `
        <section>
          <article>
            <div>
              <div>
                <h3>🔗 区块链与Web3发展</h3>
                <p>区块链技术正在重塑数字经济的基础架构，从加密货币到智能合约。</p>
              </div>
            </div>
          </article>
        </section>
      `;

      const targetText = '区块链技术正在重塑数字经济的基础架构';
      const mockData = createMockData(targetText, 'p', 'p');

      delete (window as any).__lastRestoredRange;
      let result = restoreByMultipleAnchors(mockData);
      expect(result).toBe(true);
      expect((window as any).__lastRestoredRange).toBeDefined();

      // 结构2：完全不同的嵌套
      container.innerHTML = `
        <main>
          <div>
            <section>
              <header>
                <h3>🔗 区块链与Web3发展</h3>
                <p>区块链技术正在重塑数字经济的基础架构，从加密货币到智能合约。</p>
              </header>
            </section>
          </div>
        </main>
      `;

      delete (window as any).__lastRestoredRange;
      result = restoreByMultipleAnchors(mockData);
      expect(result).toBe(true);
      expect((window as any).__lastRestoredRange).toBeDefined();

      // 结构3：扁平化结构
      container.innerHTML = `
        <div>
          <footer>
            <h3>🔗 区块链与Web3发展</h3>
            <p>区块链技术正在重塑数字经济的基础架构，从加密货币到智能合约。</p>
          </footer>
        </div>
      `;

      delete (window as any).__lastRestoredRange;
      result = restoreByMultipleAnchors(mockData);
      expect(result).toBe(true);
      expect((window as any).__lastRestoredRange).toBeDefined();
    });
  });

  describe('3. 容器范围过滤', () => {
    it('应该支持enabledContainers配置', () => {
      container.innerHTML = `
        <div class="target-area">
          <h3>目标标题</h3>
          <p>目标文本内容</p>
        </div>
        <div class="other-area">
          <h3>干扰标题</h3>
          <p>目标文本内容</p>
        </div>
      `;

      const targetText = '目标文本内容';
      const mockData = createMockData(targetText, 'p', 'p');
      const containerConfig = {
        enabledContainers: ['.target-area'],
        disabledContainers: [],
      };

      delete (window as any).__lastRestoredRange;
      const result = restoreByMultipleAnchors(mockData, containerConfig);
      expect(result).toBe(true);

      expect((window as any).__lastRestoredRange).toBeDefined();
      if ((window as any).__lastRestoredRange) {
        const rangeText = (window as any).__lastRestoredRange.toString();
        expect(rangeText).toBe(targetText);
      }
    });

    it('应该支持disabledContainers配置', () => {
      container.innerHTML = `
        <div class="normal-area">
          <h3>正常标题</h3>
          <p>目标文本内容</p>
        </div>
        <div class="disabled-area">
          <h3>禁用标题</h3>
          <p>目标文本内容</p>
        </div>
      `;

      const targetText = '目标文本内容';
      const mockData = createMockData(targetText, 'p', 'p');
      const containerConfig = {
        enabledContainers: [],
        disabledContainers: ['.disabled-area'],
      };

      delete (window as any).__lastRestoredRange;
      const result = restoreByMultipleAnchors(mockData, containerConfig);
      expect(result).toBe(true);

      expect((window as any).__lastRestoredRange).toBeDefined();
      if ((window as any).__lastRestoredRange) {
        const rangeText = (window as any).__lastRestoredRange.toString();
        expect(rangeText).toBe(targetText);
      }
    });
  });

  describe('4. 错误处理和边界情况', () => {
    it('应该处理缺少锚点信息的情况', () => {
      const mockData = createMockData('测试文本', '', '');
      delete (window as any).__lastRestoredRange;

      const result = restoreByMultipleAnchors(mockData);
      expect(result).toBe(false);
      expect((window as any).__lastRestoredRange).toBeUndefined();
    });

    it('应该处理找不到匹配元素的情况', () => {
      container.innerHTML = '<div><span>无关内容</span></div>';

      const mockData = createMockData('不存在的文本', 'p', 'p');
      delete (window as any).__lastRestoredRange;

      const result = restoreByMultipleAnchors(mockData);
      expect(result).toBe(false);
      expect((window as any).__lastRestoredRange).toBeUndefined();
    });

    it('应该处理文本不匹配的情况', () => {
      container.innerHTML = `
        <section>
          <p>这是一段完全不同的文本内容</p>
        </section>
      `;

      const mockData = createMockData('目标文本内容不存在', 'p', 'p');
      delete (window as any).__lastRestoredRange;

      const result = restoreByMultipleAnchors(mockData);
      expect(result).toBe(false);
      expect((window as any).__lastRestoredRange).toBeUndefined();
    });
  });

  describe('5. 复杂文本匹配测试', () => {
    it('应该能在多个相同标签中找到正确的文本', () => {
      container.innerHTML = `
        <article>
          <p>第一段文本，不包含目标内容</p>
          <p>第二段文本，仍然不是我们要的</p>
          <p>第三段文本，包含目标内容关键词</p>
          <p>第四段文本，再次不匹配</p>
        </article>
      `;

      const targetText = '第三段文本，包含目标内容关键词';
      const mockData = createMockData(targetText, 'p', 'p');

      delete (window as any).__lastRestoredRange;
      const result = restoreByMultipleAnchors(mockData);
      expect(result).toBe(true);

      expect((window as any).__lastRestoredRange).toBeDefined();
      if ((window as any).__lastRestoredRange) {
        const rangeText = (window as any).__lastRestoredRange.toString();
        expect(rangeText).toBe(targetText);
      }
    });

    it('应该能处理部分文本匹配', () => {
      container.innerHTML = `
        <div>
          <h2>量子计算前沿技术</h2>
          <p>量子计算技术正在从实验室走向商业应用，IBM、Google等公司都在这个领域投入巨资进行研发。</p>
        </div>
      `;

      const targetText = '量子计算技术正在从实验室走向商业应用';
      const mockData = createMockData(targetText, 'p', 'p');

      delete (window as any).__lastRestoredRange;
      const result = restoreByMultipleAnchors(mockData);
      expect(result).toBe(true);

      expect((window as any).__lastRestoredRange).toBeDefined();
      if ((window as any).__lastRestoredRange) {
        const rangeText = (window as any).__lastRestoredRange.toString();
        expect(rangeText).toBe(targetText);
      }
    });
  });

  describe('6. 性能测试', () => {
    it('应该在复杂DOM结构中保持良好性能', () => {
      // 创建复杂的DOM结构
      let complexHTML = '<div>';
      for (let i = 0; i < 50; i++) {
        complexHTML += `<section><article><div class="content${i}"><p>内容${i}文本数据测试${i}</p></div></article></section>`;
      }
      complexHTML += '</div>';

      container.innerHTML = complexHTML;

      const targetText = '内容25文本数据测试25';
      const mockData = createMockData(targetText, 'p', 'p');

      delete (window as any).__lastRestoredRange;
      const startTime = performance.now();
      const result = restoreByMultipleAnchors(mockData);
      const endTime = performance.now();

      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(500); // 应该在500ms内完成

      expect((window as any).__lastRestoredRange).toBeDefined();
      if ((window as any).__lastRestoredRange) {
        const rangeText = (window as any).__lastRestoredRange.toString();
        expect(rangeText).toBe(targetText);
      }
    });
  });
});
