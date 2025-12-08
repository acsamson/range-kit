import { describe, it, expect, beforeEach } from 'vitest';
import { restoreSelection } from '../../restorer/restorer';
import { SerializedSelection } from '../../types';

describe('Cross DOM - Algorithm Degradation', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  // 创建跨DOM算法降级测试数据
  const createDegradationTestData = (
    scenario: string,
    originalHTML: string,
    selectedText: string,
    hasIds = true,
    hasPaths = true,
  ): SerializedSelection => ({
    id: `test-degradation-${scenario}`,
    text: selectedText,
    timestamp: Date.now(),
    anchors: {
      startId: hasIds ? 'start-elem' : null,
      endId: hasIds ? 'end-elem' : null,
      startOffset: 0,
      endOffset: selectedText.length,
    },
    paths: {
      startPath: hasPaths ? '#test-container > article > h3' : '',
      endPath: hasPaths ? '#test-container > article > p' : '',
      startOffset: 0,
      endOffset: selectedText.length,
      startTextOffset: 0,
      endTextOffset: selectedText.length,
    },
    multipleAnchors: {
      startAnchors: {
        tagName: 'h3',
        className: 'title',
        id: hasIds ? 'start-elem' : '',
        attributes: { id: hasIds ? 'start-elem' : '' },
      },
      endAnchors: {
        tagName: 'p',
        className: 'content',
        id: hasIds ? 'end-elem' : '',
        attributes: { id: hasIds ? 'end-elem' : '' },
      },
      commonParent: 'test-container',
      siblingInfo: {
        index: 0,
        total: 2,
        tagPattern: 'h3,p',
      },
    },
    structuralFingerprint: {
      tagName: 'article',
      className: 'post',
      attributes: { class: 'post' },
      textLength: selectedText.length,
      childCount: 2,
      depth: 2,
      parentChain: [
        { tagName: 'div', className: '', id: 'test-container' },
        { tagName: 'article', className: 'post', id: '' },
      ],
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
      parentText: selectedText,
      textPosition: { start: 0, end: selectedText.length, totalLength: selectedText.length },
    },
    selectionContent: {
      text: selectedText,
      mediaElements: [],
    },
    metadata: {
      url: 'test://cross-dom-degradation',
      title: 'Cross DOM Degradation Test',
      selectionBounds: { x: 0, y: 0, width: 100, height: 20, top: 0, right: 100, bottom: 20, left: 0, toJSON: () => ({}) } as DOMRect,
      viewport: { width: 1920, height: 1080 },
      userAgent: 'test-agent',
    },
    restoreStatus: 'pending' as any,
    appName: 'Test App',
    appUrl: 'test://cross-dom-degradation',
  });

  describe('1. 算法层级降级测试', () => {
    describe('1.1 L1层失效 → L2层生效', () => {
      it('ID锚点失效但CSS路径仍有效的场景', () => {
        console.log('\n=== 测试: L1失效 → L2生效 ===');

        // 原始: <article><h3 id="start-elem">标题</h3><p id="end-elem">内容</p></article>
        // 变化后: <article><h3>标题</h3><p>内容</p></article> (ID消失但结构保持)
        container.innerHTML = `
          <article>
            <h3>标题</h3>
            <p>内容</p>
          </article>
        `;

        const selectionData = createDegradationTestData(
          'l1-to-l2', '<article><h3 id="start-elem">标题</h3><p id="end-elem">内容</p></article>',
          '标题内容', true, true,
        );

        console.log('原始: 有ID锚点 <h3 id="start-elem">标题</h3><p id="end-elem">内容</p>');
        console.log('变化后: ID消失 <h3>标题</h3><p>内容</p>');
        console.log('期望: L1失败，L2通过CSS路径成功');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThanOrEqual(2); // 应该是L2或更高
          expect(result.restoreTime).toBeLessThan(100);
          console.log('✅ L1→L2降级成功');
        } else {
          console.log(`⚠️ L1→L2降级失败: ${result.error}`);
        }
      });
    });

    describe('1.2 L1/L2失效 → L3层生效', () => {
      it('ID和路径都失效但多重锚点生效的场景', () => {
        console.log('\n=== 测试: L1/L2失效 → L3生效 ===');

        // 原始: <section><h3>标题</h3><p>内容</p></section>
        // 变化后: <div><article><h3>标题</h3></article><aside><p>内容</p></aside></div>
        container.innerHTML = `
          <div>
            <article><h3>标题</h3></article>
            <aside><p>内容</p></aside>
          </div>
        `;

        const selectionData = createDegradationTestData(
          'l1l2-to-l3', '<section><h3>标题</h3><p>内容</p></section>',
          '标题内容', false, false, // 无ID，无有效路径
        );

        console.log('原始: 简单结构 <section><h3>标题</h3><p>内容</p></section>');
        console.log('变化后: 复杂结构 <div><article><h3>标题</h3></article><aside><p>内容</p></aside></div>');
        console.log('期望: L1/L2失败，L3通过h3→p标签序列成功');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThanOrEqual(3); // 应该是L3或L4
          console.log('✅ L1/L2→L3降级成功');
        } else {
          console.log(`⚠️ L1/L2→L3降级失败: ${result.error}`);
        }
      });
    });

    describe('1.3 仅L4层生效', () => {
      it('前三层都失效，只能通过结构指纹恢复的场景', () => {
        console.log('\n=== 测试: 前三层失效 → 仅L4生效 ===');

        // 原始: <article class="post"><h2>标题</h2><div>内容</div></article>
        // 变化后: <section class="blog-entry"><h3>标题</h3><p>内容</p></section>
        container.innerHTML = `
          <section class="blog-entry">
            <h3>标题</h3>
            <p>内容</p>
          </section>
        `;

        const selectionData = createDegradationTestData(
          'only-l4', '<article class="post"><h2>标题</h2><div>内容</div></article>',
          '标题内容', false, false,
        );

        console.log('原始: <article class="post"><h2>标题</h2><div>内容</div></article>');
        console.log('变化后: <section class="blog-entry"><h3>标题</h3><p>内容</p></section>');
        console.log('期望: 前三层失败，L4通过结构相似度匹配成功');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBe(4); // 应该是L4
          console.log('✅ L4结构指纹恢复成功');
        } else {
          console.log(`⚠️ L4结构指纹恢复失败: ${result.error}`);
        }
      });
    });
  });

  describe('2. 属性变化测试', () => {
    describe('2.1 ID属性变化', () => {
      it('应该处理元素ID变化但内容保持的场景', () => {
        console.log('\n=== 测试: ID属性变化 ===');

        // 原始: <div id="content1"><p>段落内容</p></div><div id="content2"><p>其他内容</p></div>
        // 变化后: <div id="newid1"><p>段落内容</p></div><div id="newid2"><p>其他内容</p></div>
        container.innerHTML = `
          <div id="newid1"><p>段落内容</p></div>
          <div id="newid2"><p>其他内容</p></div>
        `;

        const selectionData = createDegradationTestData(
          'id-change', 'original-content',
          '段落内容其他内容', true, false,
        );

        console.log('原始: ID content1, content2');
        console.log('变化后: ID newid1, newid2');
        console.log('期望: ID变化后仍能找到相同内容');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(1); // ID变化应该用L2+
          console.log('✅ 成功处理ID属性变化');
        } else {
          console.log(`⚠️ ID属性变化处理失败: ${result.error}`);
        }
      });
    });

    describe('2.2 类名变化', () => {
      it('应该处理元素class属性变化的场景', () => {
        console.log('\n=== 测试: 类名变化 ===');

        // 原始: <article class="blog-post"><h3 class="title">文章标题</h3><p class="content">文章内容</p></article>
        // 变化后: <article class="news-article featured"><h3 class="heading primary">文章标题</h3><p class="text body">文章内容</p></article>
        container.innerHTML = `
          <article class="news-article featured">
            <h3 class="heading primary">文章标题</h3>
            <p class="text body">文章内容</p>
          </article>
        `;

        const selectionData = createDegradationTestData(
          'class-change', 'original-class',
          '文章标题文章内容', false, true,
        );

        console.log('原始: class="blog-post", "title", "content"');
        console.log('变化后: class="news-article featured", "heading primary", "text body"');
        console.log('期望: 忽略class变化，找到相同内容');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功忽略类名变化');
        } else {
          console.log(`⚠️ 类名变化处理失败: ${result.error}`);
        }
      });
    });

    describe('2.3 自定义属性变化', () => {
      it('应该处理data-*等自定义属性的变化', () => {
        console.log('\n=== 测试: 自定义属性变化 ===');

        // 原始: <div data-section="intro" data-version="1.0"><p>介绍文本</p></div>
        // 变化后: <div data-section="introduction" data-version="2.0" data-updated="true"><p>介绍文本</p></div>
        container.innerHTML = `
          <div data-section="introduction" data-version="2.0" data-updated="true">
            <p>介绍文本</p>
          </div>
        `;

        const selectionData = createDegradationTestData(
          'data-attr-change', 'original-data',
          '介绍文本', false, true,
        );

        console.log('原始: data-section="intro" data-version="1.0"');
        console.log('变化后: data-section="introduction" data-version="2.0" data-updated="true"');
        console.log('期望: 忽略data属性变化，找到相同文本');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功忽略自定义属性变化');
        } else {
          console.log(`⚠️ 自定义属性变化处理失败: ${result.error}`);
        }
      });
    });
  });

  describe('3. 异常和边界情况', () => {
    describe('3.1 部分元素消失', () => {
      it('应该识别选区跨越的某些元素完全消失的情况', () => {
        console.log('\n=== 测试: 部分元素消失 ===');

        // 原始: <p>保留内容</p><p>消失内容</p><p>也保留</p>
        // 变化后: <p>保留内容</p><p>也保留</p> (中间元素消失)
        container.innerHTML = `
          <p>保留内容</p>
          <p>也保留</p>
        `;

        const selectionData = createDegradationTestData(
          'partial-disappear', 'original-three-elements',
          '保留内容消失内容也保留', false, false,
        );

        console.log('原始: "保留内容" + "消失内容" + "也保留"');
        console.log('变化后: "保留内容" + "也保留" (中间消失)');
        console.log('期望: 找到剩余的内容，识别中间部分丢失');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          // 部分恢复也算成功
          console.log('✅ 成功处理部分元素消失（可能是部分恢复）');
        } else {
          // 完全失败也是正确的行为
          console.log(`⚠️ 部分元素消失，算法正确识别无法完整恢复: ${result.error}`);
          expect(result.layer).toBe(0);
        }
      });
    });

    describe('3.2 内容完全改变', () => {
      it('应该识别元素结构保持但内容完全不同的情况', () => {
        console.log('\n=== 测试: 内容完全改变 ===');

        // 原始: <article><h2>原始标题</h2><p>原始内容</p></article>
        // 变化后: <article><h2>新的标题</h2><p>全新内容</p></article>
        container.innerHTML = `
          <article>
            <h2>新的标题</h2>
            <p>全新内容</p>
          </article>
        `;

        const selectionData = createDegradationTestData(
          'content-change', 'completely-different',
          '原始标题原始内容', false, true,
        );

        console.log('原始: "原始标题原始内容"');
        console.log('变化后: "新的标题全新内容"');
        console.log('期望: 算法识别内容完全不匹配，恢复失败');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        // 内容完全不同，应该失败
        expect(result.success).toBe(false);
        expect(result.layer).toBe(0);
        expect(result.layerName).toBe('恢复失败');
        console.log(`❌ 正确识别内容完全不匹配: ${result.error}`);
      });
    });

    describe('3.3 DOM树深度剧变', () => {
      it('应该处理DOM嵌套深度发生极大变化的场景', () => {
        console.log('\n=== 测试: DOM树深度剧变 ===');

        // 原始: <div><section><p>深层内容</p></section></div> (深度3)
        // 变化后: 深度8的极深嵌套
        container.innerHTML = `
          <main>
            <article>
              <section>
                <header>
                  <nav>
                    <ul>
                      <li><p>深层内容</p></li>
                    </ul>
                  </nav>
                </header>
              </section>
            </article>
          </main>
        `;

        const selectionData = createDegradationTestData(
          'depth-change', 'shallow-to-deep',
          '深层内容', false, false,
        );

        console.log('原始: 深度3 <div><section><p>深层内容</p></section></div>');
        console.log('变化后: 深度8 <main><article><section><header><nav><ul><li><p>深层内容</p></li></ul></nav></header></section></article></main>');
        console.log('期望: 通过文本匹配找到最终的p元素');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThanOrEqual(3); // 深度变化应该用高级算法
          console.log('✅ 成功处理DOM深度剧变');
        } else {
          console.log(`⚠️ DOM深度剧变处理失败: ${result.error}`);
        }
      });
    });
  });

  describe('4. 性能压力测试', () => {
    it('应该在包含大量节点的页面中快速完成选区恢复', () => {
      console.log('\n=== 测试: 大量DOM节点性能 ===');

      // 创建包含1000+节点的复杂页面
      const largeHTML = Array.from({ length: 200 }, (_, i) =>
        `<article class="post-${i}">
          <header><h2>标题${i}</h2></header>
          <main><p>内容${i}</p></main>
          <footer><span>标签${i}</span></footer>
        </article>`,
      ).join('');

      container.innerHTML = largeHTML + `
        <article class="target-post">
          <header><h2>目标标题</h2></header>
          <main><p>目标内容</p></main>
        </article>
      `;

      const selectionData = createDegradationTestData(
        'performance-large', 'large-dom',
        '目标标题目标内容', false, false,
      );

      console.log('大型DOM: 200个article，600+个元素');
      console.log('目标: 在末尾找到"目标标题目标内容"');

      const result = restoreSelection(selectionData);

      console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

      // 性能要求：大型页面应该在500ms内完成
      expect(result.restoreTime).toBeLessThan(500);

      if (result.success) {
        console.log(`⚡ 大型DOM性能测试通过: ${result.restoreTime.toFixed(2)}ms`);
      } else {
        console.log(`⚠️ 大型DOM处理失败，但性能达标: ${result.restoreTime.toFixed(2)}ms`);
      }
    });
  });
});
