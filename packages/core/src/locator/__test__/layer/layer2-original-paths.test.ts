/**
 * ===================================================================
 * Layer 2: DOM路径恢复算法 - 单元测试
 * ===================================================================
 *
 * 🎯 测试目标：
 * 验证基于DOM路径的精确选区恢复功能
 *
 * 📋 测试覆盖：
 * 1. CSS选择器路径恢复（单元素和跨元素）
 * 2. 文本偏移量精确定位
 * 3. 错误处理和路径失效场景
 * 4. 根节点限定功能
 *
 * 注意：L2 只负责精确路径恢复，不进行文本匹配降级
 * 文本匹配是 L3/L4 的职责
 * ===================================================================
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { restoreByOriginalPaths } from '../../restorer/layers/layer2-original-paths';
import { SerializedSelection, LayerRestoreResult } from '../../types';

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
        restore: {
          anchors: { startId: '', endId: '', startOffset: 0, endOffset: 0 },
          paths: {
            startPath: 'section.l2-test-section > p.l2-test-paragraph',
            endPath: 'section.l2-test-section > p.l2-test-paragraph',
            startOffset: 8, // "这是Layer2" = 8个字符
            endOffset: 15, // "根节点限定测试" = 7个字符，8+7=15
            startTextOffset: 8,
            endTextOffset: 15,
          },
          multipleAnchors: {
            startAnchors: { tagName: '', className: '', id: '', attributes: {} },
            endAnchors: { tagName: '', className: '', id: '', attributes: {} },
            commonParent: '',
            siblingInfo: null,
          },
          fingerprint: {
            tagName: '', className: '', attributes: {}, textLength: 0,
            childCount: 0, depth: 0, parentChain: [], siblingPattern: null,
          },
          context: {
            precedingText: '', followingText: '', parentText: '',
            textPosition: { start: 0, end: 0, totalLength: 0 },
          },
        },
      };

      // 使用根节点限定
      const containerConfig = {
        enabledContainers: [],
        disabledContainers: [],
        rootNodeId: 'l2-specific-root',
      };

      const result = restoreByOriginalPaths(selectionData, containerConfig);

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      // 清理测试元素
      document.body.removeChild(rootNode);
    });

    it('当指定的根节点不存在时应该降级到document查找', () => {
      const targetText = '🤖 人工智能';
      const selectionData: SerializedSelection = {
        id: 'test-l2-nonexistent-root',
        text: targetText,
        restore: {
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
          fingerprint: {
            tagName: '', className: '', attributes: {}, textLength: 0,
            childCount: 0, depth: 0, parentChain: [], siblingPattern: null,
          },
          context: {
            precedingText: '', followingText: '', parentText: '',
            textPosition: { start: 0, end: 0, totalLength: 0 },
          },
        },
      };

      // 使用不存在的根节点ID
      const containerConfig = {
        enabledContainers: [],
        disabledContainers: [],
        rootNodeId: 'nonexistent-l2-root',
      };

      const result = restoreByOriginalPaths(selectionData, containerConfig);

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
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
  });

  afterEach(() => {
    // 清理测试容器
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  // 基于layer2.ts示例数据创建测试数据
  const createTestSelection = (overrides: Partial<SerializedSelection> & { paths?: any } = {}): SerializedSelection => {
    const { paths: pathsOverride, ...otherOverrides } = overrides;
    return {
      id: 'test-l2-default',
      text: '测试文本',
      restore: {
        anchors: {
          startId: 'root',
          endId: 'root',
          startOffset: 0,
          endOffset: 10,
        },
        paths: pathsOverride || {
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
        fingerprint: {
          tagName: 'div',
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
      },
      ...otherOverrides,
    };
  };

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

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
        expect(rangeText).toBe('🤖 人工智能');
      }
    });

    it('应该成功恢复单元素内的部分文本选区', () => {
      // DOM 中 span.text-segment-end 的内容是 "和自动驾驶领域发挥重要作用。" (15个字符)
      const selectionData = createTestSelection({
        text: '自动驾驶领域',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > main.content-main > p.description > span.text-segment-end',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > main.content-main > p.description > span.text-segment-end',
          startOffset: 1, // "和" 之后
          endOffset: 7, // "自动驾驶领域" 结束
          startTextOffset: 1,
          endTextOffset: 7,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
        expect(rangeText).toBe('自动驾驶领域');
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

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
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

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
        expect(rangeText).toBe('人工智能技术的快速发展正在深刻改变着我们的生活方式和工作模式');
      }
    });

    it('应该支持CSS选择器路径', () => {
      // 这个测试使用简短的 CSS 选择器路径
      const selectionData = createTestSelection({
        text: '人工智能',
        paths: {
          startPath: '#rc-tabs-1-panel-2 .category-badge',
          endPath: '#rc-tabs-1-panel-2 .category-badge',
          startOffset: 3, // emoji "🤖 " 之后 (emoji 占2字节 + 空格1字节)
          endOffset: 7, // "人工智能" 结束
          startTextOffset: 3,
          endTextOffset: 7,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
        expect(rangeText).toBe('人工智能');
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

      expect(result.success).toBe(false);
      expect(result.range).toBeUndefined();
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

      expect(result.success).toBe(false);
      expect(result.range).toBeUndefined();
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

      expect(result.success).toBe(false);
      expect(result.range).toBeUndefined();
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

      expect(result.success).toBe(false);
      expect(result.range).toBeUndefined();
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

      expect(result.success).toBe(false);
      expect(result.range).toBeUndefined();
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

      expect(result.success).toBe(false);
      expect(result.range).toBeUndefined();
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

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
        expect(rangeText).toBe('🤖');
      }
    });

    it('应该处理包含特殊字符的文本', () => {
      // DOM 中 div.tech-keywords 的内容是 "核心技术关键词：神经网络、机器学习、深度学习、智能算法、计算机视觉、自然语言处理"
      // "核心技术关键词：" 有 8 个字符
      const selectionData = createTestSelection({
        text: '神经网络、机器学习、深度学习',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > main.content-main > div.tech-keywords',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > main.content-main > div.tech-keywords',
          startOffset: 8, // "核心技术关键词：" 之后
          endOffset: 22, // "神经网络、机器学习、深度学习" 结束
          startTextOffset: 8,
          endTextOffset: 22,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
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

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });
  });

  describe('📊 真实数据验证测试', () => {
    // 基于layer2.ts示例数据的真实场景测试
    it('应该恢复人工智能标签选择', () => {
      // span.category-badge 内容是 "🤖 人工智能"
      const selectionData = createTestSelection({
        id: 'sel_1750245506905_21ntvrbvf',
        text: '🤖 人工智能',
        paths: {
          startPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          endPath: 'div#rc-tabs-1-panel-2 > section.l2-pure-test-environment > article.l2-article-one > div.content-wrapper > header.content-header > span.category-badge',
          startOffset: 0,
          endOffset: 7, // 🤖(2) + 空格(1) + 人工智能(4) = 7
          startTextOffset: 0,
          endTextOffset: 7,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
        expect(rangeText).toBe('🤖 人工智能');
      }
    });

    it('应该恢复连续文本区域部分选择', () => {
      // 连续文本区域的前30个字符
      const selectionData = createTestSelection({
        id: 'sel_continuous_text_partial',
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

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
        expect(rangeText).toBe('人工智能技术的快速发展正在深刻改变着我们的生活方式和工作模式');
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

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
        expect(rangeText).toBe('神经网络、机器学习、深度学习');
      }
    });
  });

  describe('🔥 偏移量精确恢复测试', () => {
    let complexContainer: HTMLDivElement;
    const testText = 'ABCDEFGHIJ1234567890中文测试文本内容';

    beforeEach(() => {
      // 添加包含简单可预测文本的测试环境
      complexContainer = document.createElement('div');
      complexContainer.innerHTML = `
        <div id="rc-tabs-1-panel-3" class="ant-tabs-tabpane ant-tabs-tabpane-active">
          <section class="complex-text-section">
            <article class="complex-article">
              <div class="complex-content">
                <p class="complex-paragraph">${testText}</p>
              </div>
            </article>
          </section>
        </div>
      `;
      container.appendChild(complexContainer);
    });

    it('应该使用正确的偏移量恢复文本前部', () => {
      // 测试从开始选择 "ABCDEFGHIJ" (0-10)
      const selectionData = createTestSelection({
        id: 'sel_front_text',
        text: 'ABCDEFGHIJ',
        paths: {
          startPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          endPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          startOffset: 0,
          endOffset: 10,
          startTextOffset: 0,
          endTextOffset: 10,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
        expect(rangeText).toBe('ABCDEFGHIJ');
      }
    });

    it('当偏移量错误时应该返回失败（不进行文本匹配降级）', () => {
      // 使用错误的偏移量，验证 L2 不进行降级
      const selectionData = createTestSelection({
        id: 'sel_offset_fallback_test',
        text: 'ABCDEFGHIJ',
        paths: {
          startPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          endPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          startOffset: 9999, // 故意使用错误的偏移量
          endOffset: 9999,
          startTextOffset: 0,
          endTextOffset: 10,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      // L2 现在不进行文本匹配降级，应该返回失败
      expect(result.success).toBe(false);
    });

    it('应该使用正确的偏移量恢复数字部分', () => {
      // 测试选择 "1234567890" (10-20)
      const selectionData = createTestSelection({
        id: 'sel_numbers',
        text: '1234567890',
        paths: {
          startPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          endPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          startOffset: 10,
          endOffset: 20,
          startTextOffset: 10,
          endTextOffset: 20,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
        expect(rangeText).toBe('1234567890');
      }
    });

    it('应该使用正确的偏移量恢复中文部分', () => {
      // 测试选择 "中文测试文本内容" (20-28)
      const selectionData = createTestSelection({
        id: 'sel_chinese',
        text: '中文测试文本内容',
        paths: {
          startPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          endPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          startOffset: 20,
          endOffset: 28,
          startTextOffset: 20,
          endTextOffset: 28,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result.success).toBe(true);
      expect(result.range).toBeDefined();

      if (result.range) {
        const rangeText = result.range.toString();
        expect(rangeText).toBe('中文测试文本内容');
      }
    });

    it('应该在文本不存在时正确返回失败', () => {
      const selectionData = createTestSelection({
        id: 'sel_non_existent_complex_text',
        text: '这是完全不存在的复杂文本XYZ',
        paths: {
          startPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          endPath: 'div#rc-tabs-1-panel-3 > section.complex-text-section > article.complex-article > div.complex-content > p.complex-paragraph',
          startOffset: 0,
          endOffset: 15,
          startTextOffset: 0,
          endTextOffset: 15,
        },
      });

      const result = restoreByOriginalPaths(selectionData);

      expect(result.success).toBe(false);
      expect(result.range).toBeUndefined();
    });
  });
});
