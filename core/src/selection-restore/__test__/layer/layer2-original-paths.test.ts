/**
 * ===================================================================
 * Layer 2: DOM路径恢复算法 - 单元测试
 * ===================================================================
 *
 * 🎯 测试目标：
 * 验证基于DOM路径的选区恢复功能，确保L2算法的准确性和适应性
 *
 * 📋 测试覆盖：
 * 1. CSS选择器路径恢复（单元素和跨元素）
 * 2. 智能文本匹配策略（标准化文本处理）
 * 3. 跨元素选择恢复（共同父元素查找）
 * 4. 文本偏移量和TreeWalker精确定位
 * 5. 错误处理和路径失效场景
 * 6. 复杂DOM结构的适应性验证
 * ===================================================================
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { restoreByOriginalPaths } from '../../restorer/layers/layer2-original-paths';
import { SerializedSelection } from '../../types';

// 模拟全局Range存储
declare global {
  interface Window {
    __lastRestoredRange?: Range;
  }
}

describe('Layer 2: DOM路径恢复算法', () => {
  describe('🆕 根节点限定功能测试', () => {
    it('应该只在指定的根节点内查找路径元素', () => {
      // 创建根节点限定测试环境
      const rootNode = document.createElement('div');
      rootNode.id = 'l2-specific-root';
      rootNode.innerHTML = `
        <section class="l2-test-section">
          <p class="l2-test-paragraph">这是Layer2根节点限定测试的目标文本内容</p>
        </section>
      `;
      document.body.appendChild(rootNode);

      const targetText = '根节点限定测试';
      const selectionData: SerializedSelection = {
        id: 'test-l2-root-limited',
        text: targetText,
        timestamp: Date.now(),
        anchors: { startId: '', endId: '', startOffset: 0, endOffset: 0 },
        paths: {
          startPath: 'section.l2-test-section > p.l2-test-paragraph',
          endPath: 'section.l2-test-section > p.l2-test-paragraph',
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
        structuralFingerprint: {
          tagName: '', className: '', attributes: {}, textLength: 0,
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
        rootNodeId: 'l2-specific-root',
      };

      const result = restoreByOriginalPaths(selectionData, containerConfig);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      // 清理测试元素
      document.body.removeChild(rootNode);
    });

    it('当指定的根节点不存在时应该降级到document查找', () => {
      const targetText = '🤖 人工智能';
      const selectionData: SerializedSelection = {
        id: 'test-l2-nonexistent-root',
        text: targetText,
        timestamp: Date.now(),
        anchors: { startId: '', endId: '', startOffset: 0, endOffset: 0 },
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          startOffset: 0,
          endOffset: 7,
          startTextOffset: 0,
          endTextOffset: 7,
        },
        multipleAnchors: {
          startAnchors: { tagName: '', className: '', id: '', attributes: {} },
          endAnchors: { tagName: '', className: '', id: '', attributes: {} },
          commonParent: '', siblingInfo: null,
        },
        structuralFingerprint: {
          tagName: '', className: '', attributes: {}, textLength: 0,
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
        rootNodeId: 'nonexistent-l2-root',
      };

      const result = restoreByOriginalPaths(selectionData, containerConfig);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe(targetText);
      }
    });
  });
  let container: HTMLDivElement;

  beforeEach(() => {
    // 创建复杂的测试DOM结构，模拟真实的React应用
    container = document.createElement('div');
    container.innerHTML = `
      <div id="root">
        <div class="ant-layout ant-layout-has-sider css-dev-only-do-not-override-mc1tut">
          <div class="ant-layout css-dev-only-do-not-override-mc1tut">
            <main class="ant-layout-content css-dev-only-do-not-override-mc1tut">
              <div class="test-content-area">
                <div>
                  <main>
                    <section class="news-grid">
                      <div class="ant-tabs ant-tabs-top css-dev-only-do-not-override-mc1tut">
                        <div class="ant-tabs-content-holder">
                          <div class="ant-tabs-content ant-tabs-content-top">
                            <div id="rc-tabs-1-panel-2" class="ant-tabs-tabpane ant-tabs-tabpane-active">
                              <!-- L2专项测试环境 -->
                              <section class="l2-pure-test-environment">
                                
                                <!-- 复杂文章结构 -->
                                <article class="l2-article-one">
                                  <div class="content-wrapper">
                                    <header class="content-header">
                                      <span class="category-badge">🤖 人工智能</span>
                                    </header>
                                    <main class="content-main">
                                      <p class="description">
                                        <span class="text-segment-start">最新研发的神经网络架构在机器学习和深度学习</span>
                                        <span class="text-segment-middle">领域实现了关键性突破，预计将在医疗诊断</span>
                                        <span class="text-segment-end">和自动驾驶领域发挥重要作用。</span>
                                      </p>
                                      <div class="tech-keywords">核心技术关键词：神经网络、机器学习、深度学习、智能算法、计算机视觉、自然语言处理</div>
                                    </main>
                                  </div>
                                </article>

                                <!-- 量子计算内容区域 -->
                                <section class="l2-section-two">
                                  <div class="quantum-content-container">
                                    <div class="quantum-text-content">
                                      <p class="quantum-description">国际领先的量子物理研究院近期宣布，他们成功开发出了一台100量子位量子计算机实验原型机。这一突破性成果在量子纠缠保持时间、量子门操作精度和量子纠错能力方面都达到了前所未有的水平，为未来量子通信和量子加密技术的产业化应用奠定了坚实基础。</p>
                                      <div class="quantum-impact">预期影响：计算性能提升1000倍以上，将彻底革新密码学、药物研发、金融建模等众多领域</div>
                                    </div>
                                  </div>
                                </section>

                                <!-- 区块链内容区域 -->
                                <article class="l2-article-three">
                                  <div class="blockchain-layout">
                                    <div class="blockchain-text-content">
                                      <p class="blockchain-description">全球区块链技术联盟最新发布的研究报告显示，分布式账本技术正在数字身份和智能合约等多个垂直领域展现出巨大的变革潜力。该技术通过去中心化的信任机制，不仅大幅降低了交易成本，还显著提高了数据透明度和安全性。特别是在跨境支付、数字身份验证、供应链溯源、智能合约执行等应用场景中，区块链技术已经开始重塑传统的商业模式和运营流程。</p>
                                    </div>
                                  </div>
                                </article>

                                <!-- 纯文本测试区域 -->
                                <section class="l2-pure-text-area">
                                  <div class="test-instruction">⭐ L2专项测试区域 - 请在下方连续文本中选择任意段落</div>
                                  <div class="continuous-text-block">人工智能技术的快速发展正在深刻改变着我们的生活方式和工作模式。从早期的专家系统到现在的深度学习网络，AI技术经历了多次重大突破。特别是在自然语言处理领域，大型语言模型的出现让机器能够更好地理解和生成人类语言。同时，计算机视觉技术也在不断进步，使得机器能够精确识别图像、视频中的各种对象和场景。在医疗健康领域，AI技术正在发挥越来越重要的作用。智能诊断系统能够通过分析医学影像快速识别病灶，辅助医生进行精准诊断。药物研发过程中，机器学习算法可以预测分子结构的活性，大大加速新药开发的进程。个性化治疗方案的制定也得益于AI对患者数据的深度分析和模式识别能力。自动驾驶汽车是AI技术应用的另一个重要领域。通过融合激光雷达、摄像头、GPS等多种传感器数据，智能车辆能够实时感知周围环境，做出安全的驾驶决策。虽然完全自动驾驶还面临技术和法规等挑战，但这项技术的发展前景令人充满期待。</div>
                                </section>

                              </section>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </main>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // 清除全局Range存储
    delete window.__lastRestoredRange;
  });

  afterEach(() => {
    // 清理测试容器
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    delete window.__lastRestoredRange;
  });

  // 基于layer2.ts示例数据创建测试数据
  const createTestSelection = (overrides: Partial<SerializedSelection> = {}): SerializedSelection => ({
    id: 'test-l2-default',
    text: '测试文本',
    timestamp: Date.now(),
    anchors: {
      startId: 'root',
      endId: 'root',
      startOffset: 0,
      endOffset: 10,
    },
    paths: {
      startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment',
      endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment',
      startOffset: 0,
      endOffset: 0,
      startTextOffset: 0,
      endTextOffset: 0,
    },
    multipleAnchors: {
      startAnchors: { tagName: 'div', className: '', id: '', attributes: {} },
      endAnchors: { tagName: 'div', className: '', id: '', attributes: {} },
      commonParent: '',
      siblingInfo: null,
    },
    structuralFingerprint: {
      tagName: 'div',
      className: '',
      attributes: {},
      textLength: 0,
      childCount: 0,
      depth: 0,
      parentChain: [],
      siblingPattern: { position: 0, total: 0, beforeTags: [], afterTags: [] },
    },
    textContext: {
      precedingText: '',
      followingText: '',
      parentText: '',
      textPosition: { start: 0, end: 0, totalLength: 0 },
    },
    metadata: {
      url: 'http://localhost:3000/',
      title: '🎯 Selection Restore - React TypeScript Demo',
      selectionBounds: {
        x: 0, y: 0, width: 100, height: 20,
        top: 0, right: 100, bottom: 20, left: 0,
        toJSON: () => ({}),
      } as DOMRect,
      viewport: { width: 1677, height: 958 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    },
    selectionContent: {
      text: '测试文本',
      mediaElements: [],
    },
    restoreStatus: 'pending' as any,
    appName: '🎯 Selection Restore - React TypeScript Demo',
    appUrl: 'http://localhost:3000/',
    contentHash: 'test',
    ...overrides,
  });

  describe('✅ 基础功能测试', () => {
    it('应该成功恢复单元素内的文本选区', () => {
      const selectionData = createTestSelection({
        text: '🤖 人工智能',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          startOffset: 0,
          endOffset: 7,
          startTextOffset: 0,
          endTextOffset: 7,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe('🤖 人工智能');
      }
    });

    it('应该成功恢复跨元素的复杂文本选区', () => {
      const selectionData = createTestSelection({
        text: '和自动驾驶领域发挥重要作用。',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > main.content-main > p.description > span.text-segment-end',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > main.content-main > p.description > span.text-segment-end',
          startOffset: 0,
          endOffset: 15,
          startTextOffset: 0,
          endTextOffset: 15,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe('和自动驾驶领域发挥重要作用。');
      }
    });

    it('应该成功恢复跨章节的复杂选区', () => {
      const selectionData = createTestSelection({
        text: '预期影响：计算性能提升1000倍以上',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > section.l2-section-two > div.quantum-content-container > div.quantum-text-content > div.quantum-impact',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > section.l2-section-two > div.quantum-content-container > div.quantum-text-content > div.quantum-impact',
          startOffset: 0,
          endOffset: 18,
          startTextOffset: 0,
          endTextOffset: 18,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe('预期影响：计算性能提升1000倍以上');
      }
    });

    it('应该支持连续文本区域的部分选择', () => {
      const selectionData = createTestSelection({
        text: '人工智能技术的快速发展正在深刻改变着我们的生活方式和工作模式',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > section.l2-pure-text-area > div.continuous-text-block',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > section.l2-pure-text-area > div.continuous-text-block',
          startOffset: 0,
          endOffset: 30,
          startTextOffset: 0,
          endTextOffset: 30,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe('人工智能技术的快速发展正在深刻改变着我们的生活方式和工作模式');
      }
    });

    it('应该支持CSS选择器路径', () => {
      const selectionData = createTestSelection({
        text: '🤖 人工智能',
        paths: {
          startPath: '#rc-tabs-1-panel-2 .category-badge',
          endPath: '#rc-tabs-1-panel-2 .category-badge',
          startOffset: 0,
          endOffset: 7,
          startTextOffset: 0,
          endTextOffset: 7,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe('🤖 人工智能');
      }
    });
  });

  describe('❌ 错误处理测试', () => {
    it('应该处理路径不存在的情况', () => {
      const selectionData = createTestSelection({
        text: '不存在的文本',
        paths: {
          startPath: 'div#non-existent-element',
          endPath: 'div#non-existent-element',
          startOffset: 0,
          endOffset: 0,
          startTextOffset: 0,
          endTextOffset: 0,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(false);
      expect(window.__lastRestoredRange).toBeUndefined();
    });

    it('应该处理缺少路径信息的情况', () => {
      const selectionData = createTestSelection({
        text: '测试文本',
        paths: {
          startPath: '',
          endPath: '',
          startOffset: 0,
          endOffset: 0,
          startTextOffset: 0,
          endTextOffset: 0,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(false);
      expect(window.__lastRestoredRange).toBeUndefined();
    });

    it('应该处理文本不匹配的情况', () => {
      const selectionData = createTestSelection({
        text: '完全不存在的文本内容xyz123abc',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          startOffset: 0,
          endOffset: 0,
          startTextOffset: 0,
          endTextOffset: 0,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(false);
      expect(window.__lastRestoredRange).toBeUndefined();
    });

    it('应该处理无效的XPath语法', () => {
      const selectionData = createTestSelection({
        text: '测试文本',
        paths: {
          startPath: '//invalid[@xpath=\'syntax[[[',
          endPath: '//invalid[@xpath=\'syntax[[[',
          startOffset: 0,
          endOffset: 0,
          startTextOffset: 0,
          endTextOffset: 0,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(false);
      expect(window.__lastRestoredRange).toBeUndefined();
    });

    it('应该处理部分路径失效的情况', () => {
      const selectionData = createTestSelection({
        text: '🤖 人工智能',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          endPath: 'div#non-existent-end-element',
          startOffset: 0,
          endOffset: 7,
          startTextOffset: 0,
          endTextOffset: 7,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(false);
      expect(window.__lastRestoredRange).toBeUndefined();
    });
  });

  describe('🔍 边界条件测试', () => {
    it('应该处理空文本选区', () => {
      const selectionData = createTestSelection({
        text: '',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          startOffset: 0,
          endOffset: 0,
          startTextOffset: 0,
          endTextOffset: 0,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(false);
      expect(window.__lastRestoredRange).toBeUndefined();
    });

    it('应该处理单字符选区', () => {
      const selectionData = createTestSelection({
        text: '🤖',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          startOffset: 0,
          endOffset: 2, // emoji占2个字符
          startTextOffset: 0,
          endTextOffset: 2,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe('🤖');
      }
    });

    it('应该处理包含特殊字符的文本', () => {
      const selectionData = createTestSelection({
        text: '神经网络、机器学习、深度学习',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > main.content-main > div.tech-keywords',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > main.content-main > div.tech-keywords',
          startOffset: 0,
          endOffset: 15,
          startTextOffset: 0,
          endTextOffset: 15,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toContain('神经网络');
        expect(rangeText).toContain('机器学习');
      }
    });
  });

  describe('⚡ 性能测试', () => {
    it('应该在合理时间内完成恢复', () => {
      const startTime = performance.now();

      const selectionData = createTestSelection({
        text: '人工智能技术',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > section.l2-pure-text-area > div.continuous-text-block',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > section.l2-pure-text-area > div.continuous-text-block',
          startOffset: 0,
          endOffset: 6,
          startTextOffset: 0,
          endTextOffset: 6,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toBe(true);
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });
  });

  describe('📊 真实数据验证测试', () => {
    // 基于layer2.ts示例数据的真实场景测试
    it('应该恢复layer2.ts示例1：人工智能跨元素选择', () => {
      const selectionData = createTestSelection({
        id: 'sel_1750245506905_21ntvrbvf',
        text: '🤖 人工智能',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          startOffset: 0,
          endOffset: 7,
          startTextOffset: 0,
          endTextOffset: 7,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe('🤖 人工智能');
      }
    });

    it('应该恢复layer2.ts示例5：医疗健康领域长文本选择', () => {
      const selectionData = createTestSelection({
        id: 'sel_1750245572881_o135l9bc2',
        text: '来越重要的作用。智能诊断系统能够通过分析医学影像快速识别病灶，辅助医生进行精准诊断。药物研发过程中，机器学习算法可以预测分子结构的活性，大大加速新药开发的进程。个性化治疗方案的制定也得益于AI对患者数据的深度分析和模式识别能力。自动驾驶汽车是AI技术应用的另一个重要领域。通过融合激光雷达、摄像头、GPS等多种传感器数据，智能车辆能够实时感知周围环境，做',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > section.l2-pure-text-area > div.continuous-text-block',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > section.l2-pure-text-area > div.continuous-text-block',
          startOffset: 17,
          endOffset: 63,
          startTextOffset: 163,
          endTextOffset: 340,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toContain('智能诊断系统');
        expect(rangeText).toContain('自动驾驶汽车');
        expect(rangeText.length).toBeGreaterThan(100);
      }
    });

    it('应该恢复layer2.ts示例9：技术关键词部分选择', () => {
      const selectionData = createTestSelection({
        id: 'sel_1750246184469_wvq1j7lbp',
        text: '神经网络、机器学习、深度学习',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > main.content-main > div.tech-keywords',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > main.content-main > div.tech-keywords',
          startOffset: 8,
          endOffset: 22,
          startTextOffset: 8,
          endTextOffset: 22,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe('神经网络、机器学习、深度学习');
      }
    });
  });

  describe('🔥 复杂文本智能匹配测试', () => {
    beforeEach(() => {
      // 添加包含复杂文本的测试环境，使用更简单的DOM结构
      const complexContainer = document.createElement('div');
      complexContainer.innerHTML = `
        <div id="rc-tabs-1-panel-3" class="ant-tabs-tabpane ant-tabs-tabpane-active">
          <section class="complex-text-section">
            <article class="complex-article">
              <div class="complex-content">
                <p class="complex-paragraph">人工智能芯片投资额达1,250亿元，增长率68%。智能制造设备投资890亿元，增长率42%。机器人技术投资670亿元，增长率35%。这些数据显示AI产业正在快速发展，各大科技公司纷纷加大投入。深度学习、机器视觉、自然语言处理等技术不断突破，ChatGPT、GPT-4等大语言模型引领了新一轮AI革命，推动了整个产业的快速发展。</p>
              </div>
            </article>
          </section>
        </div>
      `;
      container.appendChild(complexContainer);
    });

    it('应该通过智能文本匹配恢复包含数字和特殊符号的复杂文本', () => {
      // 测试包含千分位逗号、百分号、中英文混合的复杂文本
      const selectionData = createTestSelection({
        id: 'sel_complex_numbers_and_symbols',
        text: '增长率35%。这些数据显示AI产业正在快速发展，各大科技公司纷纷加大投入。深度学习、机器视觉、自然语言处理等技术不断突破，ChatGPT、GPT-4等大语言模型引领了新一轮AI革命，推动了整个产业的快速发展。',
        paths: {
          startPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          endPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          startOffset: 0,
          endOffset: 104,
          startTextOffset: 59,
          endTextOffset: 163,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe(selectionData.text);

        // 验证包含关键内容
        expect(rangeText).toContain('增长率35%');
        expect(rangeText).toContain('ChatGPT');
        expect(rangeText).toContain('GPT-4');
        expect(rangeText).toContain('AI产业');
      }
    });

    it('应该处理原始偏移量失效后的智能降级恢复', () => {
      // 模拟偏移量不准确的情况，依赖智能文本匹配
      const selectionData = createTestSelection({
        id: 'sel_offset_fallback_test',
        text: '人工智能芯片投资额达1,250亿元，增长率68%',
        paths: {
          startPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          endPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          startOffset: 9999, // 故意使用错误的偏移量
          endOffset: 9999,
          startTextOffset: 0,
          endTextOffset: 21,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe(selectionData.text);

        // 验证智能匹配成功找到了正确的文本
        expect(rangeText).toContain('1,250亿元');
        expect(rangeText).toContain('68%');
      }
    });

    it('应该处理包含品牌名称和英文的中英文混合文本', () => {
      const selectionData = createTestSelection({
        id: 'sel_mixed_language_brands',
        text: 'ChatGPT、GPT-4等大语言模型引领了新一轮AI革命',
        paths: {
          startPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          endPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          startOffset: 0,
          endOffset: 26,
          startTextOffset: 137,
          endTextOffset: 163,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe(selectionData.text);

        // 验证品牌名称正确匹配
        expect(rangeText).toContain('ChatGPT');
        expect(rangeText).toContain('GPT-4');
        expect(rangeText).toContain('AI革命');
      }
    });

    it('应该处理包含专业术语和技术词汇的文本', () => {
      const selectionData = createTestSelection({
        id: 'sel_technical_terms',
        text: '深度学习、机器视觉、自然语言处理等技术不断突破',
        paths: {
          startPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          endPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          startOffset: 0,
          endOffset: 24,
          startTextOffset: 113,
          endTextOffset: 137,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(true);
      expect(window.__lastRestoredRange).toBeDefined();

      if (window.__lastRestoredRange) {
        const rangeText = window.__lastRestoredRange.toString();
        expect(rangeText).toBe(selectionData.text);

        // 验证技术术语正确识别
        expect(rangeText).toContain('深度学习');
        expect(rangeText).toContain('机器视觉');
        expect(rangeText).toContain('自然语言处理');
      }
    });

    it('应该在文本不存在时正确返回失败', () => {
      const selectionData = createTestSelection({
        id: 'sel_non_existent_complex_text',
        text: '这是完全不存在的复杂文本，包含数字123和符号@#$%',
        paths: {
          startPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          endPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          startOffset: 0,
          endOffset: 30,
          startTextOffset: 0,
          endTextOffset: 30,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result).toBe(false);
      expect(window.__lastRestoredRange).toBeUndefined();
    });
  });
});
