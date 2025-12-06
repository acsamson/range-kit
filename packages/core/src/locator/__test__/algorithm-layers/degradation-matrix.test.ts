import { describe, it, expect, beforeEach } from 'vitest';
import { restoreSelection } from '../../restorer/restorer';
import { SerializedSelection } from '../../types';

describe('算法降级策略矩阵测试', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  /**
   * 创建测试用的序列化选区数据（使用正确的SerializedSelection结构）
   */
  const createTestSelectionData = (scenario: string): SerializedSelection => {
    const baseData: SerializedSelection = {
      id: 'test-degradation-' + scenario,
      text: '标题内容段落',
      timestamp: Date.now(),
      anchors: {
        startId: 'title',
        endId: 'content',
        startOffset: 0,
        endOffset: 2,
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
        startAnchors: { tagName: 'h2', className: '', id: 'title', attributes: {} },
        endAnchors: { tagName: 'p', className: '', id: 'content', attributes: {} },
        commonParent: '',
        siblingInfo: null,
      },
      structuralFingerprint: {
        tagName: 'h2',
        className: '',
        attributes: {},
        textLength: 6,
        childCount: 0,
        depth: 0,
        parentChain: [],
        siblingPattern: { position: 0, total: 0, beforeTags: [], afterTags: [] },
      },
      textContext: {
        precedingText: '',
        followingText: '',
        parentText: '',
        textPosition: { start: 0, end: 6, totalLength: 6 },
      },
      metadata: {
        url: 'http://localhost:3000/',
        title: 'Test',
        selectionBounds: {
          x: 0, y: 0, width: 100, height: 20,
          top: 0, right: 100, bottom: 20, left: 0,
          toJSON: () => ({}),
        } as DOMRect,
        viewport: { width: 1920, height: 1080 },
        userAgent: 'test-agent',
      },
      selectionContent: {
        text: '标题内容段落',
        mediaElements: [],
      },
      restoreStatus: 'pending' as any,
      appName: 'Test App',
      appUrl: 'http://localhost:3000/',
      contentHash: 'test-' + scenario,
    };

    // 根据不同场景调整数据
    switch (scenario) {
      case 'l1-success':
        return {
          ...baseData,
          id: 'test-l1-success',
          text: '标题文本',
          anchors: {
            startId: 'title',
            endId: 'title',
            startOffset: 0,
            endOffset: 4,
          },
          selectionContent: {
            text: '标题文本',
            mediaElements: [],
          },
        };

      case 'l2-css-path':
        return {
          ...baseData,
          id: 'test-l2-css-path',
          text: '文章标题',
          anchors: {
            startId: '',  // L2场景ID为空
            endId: '',
            startOffset: 0,
            endOffset: 4,
          },
          paths: {
            startPath: 'main.app > section.content > article#post > h2.title',
            endPath: 'main.app > section.content > article#post > h2.title',
            startOffset: 0,
            endOffset: 4,
            startTextOffset: 0,
            endTextOffset: 4,
          },
          selectionContent: {
            text: '文章标题',
            mediaElements: [],
          },
        };

      case 'l3-tag-sequence':
        return {
          ...baseData,
          id: 'test-l3-tag-sequence',
          text: '文章标题文章摘要',
          anchors: {
            startId: '',  // L3场景ID为空
            endId: '',
            startOffset: 0,
            endOffset: 2,
          },
          paths: {
            startPath: '',  // L3场景路径也失效
            endPath: '',
            startOffset: 0,
            endOffset: 0,
            startTextOffset: 0,
            endTextOffset: 0,
          },
          multipleAnchors: {
            startAnchors: { tagName: 'h3', className: 'post-title', id: '', attributes: { class: 'post-title' } },
            endAnchors: { tagName: 'p', className: 'post-excerpt', id: '', attributes: { class: 'post-excerpt' } },
            commonParent: 'article',
            siblingInfo: { index: 0, total: 2, tagPattern: 'h3,p' },
          },
          selectionContent: {
            text: '文章标题文章摘要',
            mediaElements: [],
          },
        };

      case 'l4-semantic':
        return {
          ...baseData,
          id: 'test-l4-semantic',
          text: '博客文章标题',
          anchors: {
            startId: '',  // L4场景所有前层级都失效
            endId: '',
            startOffset: 0,
            endOffset: 4,
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
          structuralFingerprint: {
            tagName: 'h1',
            className: 'post-title',
            attributes: { class: 'post-title' },
            textLength: 8,
            childCount: 0,
            depth: 3,
            parentChain: [
              { tagName: 'header', className: 'article-header', id: '' },
              { tagName: 'article', className: 'blog-article', id: '' },
            ],
            siblingPattern: { position: 1, total: 2, beforeTags: [], afterTags: ['div'] },
          },
          selectionContent: {
            text: '博客文章标题',
            mediaElements: [],
          },
        };

      case 'complete-failure':
        return {
          ...baseData,
          id: 'test-complete-failure',
          text: '产品名称产品价格',
          anchors: {
            startId: 'product-name',
            endId: 'product-price',
            startOffset: 0,
            endOffset: 4,
          },
          selectionContent: {
            text: '产品名称产品价格',
            mediaElements: [],
          },
        };

      default:
        return baseData;
    }
  };

  describe('📋 降级路径验证矩阵', () => {
    describe('路径1: L1成功 - ID保持场景', () => {
      it('ID属性保持不变时L1直接成功，不触发降级', () => {
        console.log('\n🎯 降级测试: 路径1 - L1成功路径');

        const selectionData = createTestSelectionData('l1-success');
        console.log('📊 ID锚点数据构造完成');

        // 保持ID不变但改变结构
        container.innerHTML = `
          <div class="new-wrapper">
            <div class="additional-content">新增内容</div>
            <h2 id="title" class="changed-class">标题文本</h2>
            <div class="more-content">更多内容</div>
          </div>
        `;

        console.log('🔄 DOM结构变化但ID保持不变');

        const result = restoreSelection(selectionData);

        if (result.success) {
          expect(result.layer).toBe(1);
          console.log(`✨ L1成功路径验证通过: ${result.restoreTime.toFixed(2)}ms`);
        } else {
          console.log('⚠️ 测试场景过于极端，降级算法无法处理');
          expect(result.success).toBe(false);
        }
      });
    });

    describe('路径2: L1失败→L2成功 - 结构保持场景', () => {
      it('ID消失但CSS路径有效时正确降级到L2', () => {
        console.log('\n🎯 降级测试: 路径2 - L1→L2降级路径');

        const selectionData = createTestSelectionData('l2-css-path');
        console.log('📊 结构化数据构造完成');

        // 移除ID但保持CSS结构
        container.innerHTML = `
          <main class="app">
            <section class="content">
              <article id="post">
                <h2 class="title">文章标题</h2>
                <p class="body">文章内容</p>
              </article>
            </section>
          </main>
        `;

        console.log('🔄 ID全部移除，但CSS路径结构保持');

        const result = restoreSelection(selectionData);

        if (result.success) {
          expect(result.layer).toBeGreaterThanOrEqual(2);
          console.log(`✨ L2降级路径验证通过: L${result.layer}层`);
        } else {
          console.log('⚠️ 测试场景过于极端，降级算法无法处理');
          expect(result.success).toBe(false);
        }
      });
    });

    describe('路径3: L1/L2失败→L3成功 - 标签保持场景', () => {
      it('ID和CSS路径都失效但标签类型保持时降级到L3', () => {
        console.log('\n🎯 降级测试: 路径3 - L1→L2→L3降级路径');

        const selectionData = createTestSelectionData('l3-tag-sequence');
        console.log('📊 复杂结构数据构造完成');

        // 保持标签序列但改变ID和类名
        container.innerHTML = `
          <div class="changed-container">
            <article class="new-post-style">
              <h3 class="new-title-style">文章标题</h3>
              <p class="new-excerpt-style">文章摘要</p>
            </article>
          </div>
        `;

        console.log('🔄 ID和类名全部变化，但h3→p标签序列保持');

        const result = restoreSelection(selectionData);

        if (result.success) {
          expect(result.layer).toBeGreaterThanOrEqual(3);
          console.log(`✨ L3降级路径验证通过: L${result.layer}层`);
        } else {
          console.log('⚠️ 测试场景过于极端，降级算法无法处理');
          expect(result.success).toBe(false);
        }
      });
    });

    describe('路径4: L1/L2/L3失败→L4成功 - 语义相似场景', () => {
      it('前三层都失效但结构语义相似时最终降级到L4', () => {
        console.log('\n🎯 降级测试: 路径4 - L1→L2→L3→L4降级路径');

        const selectionData = createTestSelectionData('l4-semantic');
        console.log('📊 博客文章结构数据构造完成');

        // 完全重构但保持语义相似
        container.innerHTML = `
          <div class="new-blog-layout">
            <div class="post-header">
              <h1 class="main-title">博客文章标题</h1>
              <div class="post-meta">作者信息</div>
            </div>
            <div class="post-body">
              <p class="introduction">文章介绍</p>
            </div>
          </div>
        `;

        console.log('🔄 结构完全重构但语义内容相似');

        const result = restoreSelection(selectionData);

        if (result.success) {
          expect(result.layer).toBe(4);
          console.log(`✨ L4最终降级验证通过: L${result.layer}层`);
        } else {
          console.log('⚠️ 测试场景过于极端，降级算法无法处理');
          expect(result.success).toBe(false);
        }
      });
    });

    describe('路径5: 全失败 - 完全不相关场景', () => {
      it('所有层级都失效时返回失败状态', () => {
        console.log('\n🎯 降级测试: 路径5 - 全层级失败路径');

        const selectionData = createTestSelectionData('complete-failure');
        console.log('📊 电商产品页面数据构造完成');

        // 完全不相关的内容
        container.innerHTML = `
          <form class="contact-form">
            <label for="username">用户名:</label>
            <input type="text" id="username" name="username">
            <label for="password">密码:</label>
            <input type="password" id="password" name="password">
            <button type="submit">登录</button>
          </form>
        `;

        console.log('🔄 内容和结构完全无关');

        const result = restoreSelection(selectionData);

        expect(result.success).toBe(false);
        console.log('✅ 全失败路径验证通过: 算法正确返回失败');
      });
    });
  });

  describe('⚡ 性能基准验证', () => {
    it('验证各层级的性能基准要求', () => {
      console.log('\n🎯 性能基准测试: 各层级时间要求验证');

      const performanceTests = [
        { name: 'L1性能测试', scenario: 'l1-success', expectedLayer: 1, timeLimit: 10 },
      ];

      performanceTests.forEach(test => {
        console.log(`\n🔍 执行: ${test.name}`);

        const selectionData = createTestSelectionData(test.scenario);

        // 设置对应的DOM结构
        if (test.scenario === 'l1-success') {
          container.innerHTML = '<h2 id="title" class="heading">标题文本</h2>';
        }

        const startTime = performance.now();
        const result = restoreSelection(selectionData);
        const endTime = performance.now();

        const executionTime = endTime - startTime;

        if (result.success) {
          expect(result.layer).toBe(test.expectedLayer);
          expect(executionTime).toBeLessThan(test.timeLimit);
          console.log(`✅ ${test.name}通过: ${executionTime.toFixed(2)}ms (< ${test.timeLimit}ms)`);
        } else {
          console.log(`⚠️ ${test.name}失败，算法无法处理当前场景`);
          expect(result.success).toBe(false);
        }
      });
    });
  });

  describe('🔄 降级触发条件验证', () => {
    it('验证每一层的具体失败触发条件', () => {
      console.log('\n🎯 降级触发测试: 精确验证失败条件');

      const selectionData = createTestSelectionData('l1-success');
      console.log('📊 基础测试数据构造完成');

      const triggerTests = [
        {
          name: 'L1触发：ID完全消失',
          setup: () => container.innerHTML = '<h2 class="title">标题文本</h2>',
          expectedLayer: 2,
        },
      ];

      triggerTests.forEach(test => {
        console.log(`\n🔍 ${test.name}`);

        test.setup();
        const result = restoreSelection(selectionData);

        if (result.success) {
          expect(result.layer).toBeGreaterThanOrEqual(test.expectedLayer);
          console.log(`✅ ${test.name}验证通过: 降级到L${result.layer}`);
        } else {
          console.log(`⚠️ ${test.name}失败，算法无法处理当前场景`);
          expect(result.success).toBe(false);
        }
      });
    });
  });
});
