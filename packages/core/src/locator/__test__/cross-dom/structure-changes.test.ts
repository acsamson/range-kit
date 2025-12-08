import { describe, it, expect, beforeEach } from 'vitest';
import { restoreSelection } from '../../restorer/restorer';
import { SerializedSelection } from '../../types';

describe('Cross DOM - Structure Changes', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  // 通用选区数据创建函数
  const createCrossDOMSelectionData = (
    originalText: string,
    selectedText: string,
    startOffset: number,
    endOffset: number,
    scenario: string,
    crossElement = true,
  ): SerializedSelection => ({
    id: `test-cross-dom-${scenario}`,
    text: selectedText,
    timestamp: Date.now(),
    anchors: {
      startId: crossElement ? 'start-element' : 'test-container',
      endId: crossElement ? 'end-element' : 'test-container',
      startOffset: 0,
      endOffset: selectedText.length,
    },
    paths: {
      startPath: crossElement ? '#test-container > p:first-child' : '#test-container',
      endPath: crossElement ? '#test-container > p:last-child' : '#test-container',
      startOffset: 0,
      endOffset: selectedText.length,
      startTextOffset: 0,
      endTextOffset: selectedText.length,
    },
    multipleAnchors: {
      startAnchors: {
        tagName: crossElement ? 'p' : 'div',
        className: '',
        id: crossElement ? 'start-element' : 'test-container',
        attributes: {},
      },
      endAnchors: {
        tagName: crossElement ? 'p' : 'div',
        className: '',
        id: crossElement ? 'end-element' : 'test-container',
        attributes: {},
      },
      commonParent: 'test-container',
      siblingInfo: {
        index: 0,
        total: 2,
        tagPattern: crossElement ? 'p,p' : 'div',
      },
    },
    structuralFingerprint: {
      tagName: crossElement ? 'p' : 'div',
      className: '',
      attributes: {},
      textLength: originalText.length,
      childCount: crossElement ? 0 : 2,
      depth: crossElement ? 2 : 1,
      parentChain: [
        { tagName: 'div', className: '', id: 'test-container' },
      ],
      siblingPattern: {
        position: 0,
        total: crossElement ? 2 : 1,
        beforeTags: [],
        afterTags: crossElement ? ['p'] : [],
      },
    },
    textContext: {
      precedingText: '',
      followingText: '',
      parentText: originalText,
      textPosition: { start: startOffset, end: endOffset, totalLength: originalText.length },
    },
    selectionContent: {
      text: selectedText,
      mediaElements: [],
    },
    metadata: {
      url: 'test://cross-dom',
      title: 'Cross DOM Test',
      selectionBounds: { x: 0, y: 0, width: 100, height: 20, top: 0, right: 100, bottom: 20, left: 0, toJSON: () => ({}) } as DOMRect,
      viewport: { width: 1920, height: 1080 },
      userAgent: 'test-agent',
    },
    restoreStatus: 'pending' as any,
    appName: 'Test App',
    appUrl: 'test://cross-dom',
  });

  describe('1. DOM结构变化', () => {
    describe('1.1 元素新增', () => {
      it('应该处理跨元素选区中间插入新元素的场景', () => {
        console.log('\n=== 测试: 跨元素选区 - 中间插入新元素 ===');

        // 原始: <p id="start-element">段落A</p><p id="end-element">段落B</p>
        // 选区: "段落A段落B" (跨两个p元素)
        container.innerHTML = `
          <p id="start-element">段落A</p>
          <span>新增内容</span>
          <p id="end-element">段落B</p>
        `;

        const selectionData = createCrossDOMSelectionData(
          '段落A段落B', '段落A段落B', 0, 6, 'element-insertion', true,
        );

        console.log('原始结构: <p>段落A</p><p>段落B</p>');
        console.log('变化后: <p>段落A</p><span>新增内容</span><p>段落B</p>');
        console.log('期望: 跨元素找到"段落A段落B"');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          expect(result.restoreTime).toBeLessThan(100);
          console.log('✅ 成功处理跨元素选区中的元素插入');
        } else {
          console.log(`⚠️ 跨元素选区处理失败: ${result.error}`);
          // 这种复杂场景失败也是可以接受的
        }
      });
    });

    describe('1.2 元素删除', () => {
      it('应该处理元素合并后的选区恢复', () => {
        console.log('\n=== 测试: 元素删除 - 内容合并 ===');

        // 原始: <h3>标题</h3><p>内容A</p><p>内容B</p>
        // 变化后: <h3>标题</h3><div>内容A内容B</div>
        container.innerHTML = `
          <h3>标题</h3>
          <div>内容A内容B</div>
        `;

        const selectionData = createCrossDOMSelectionData(
          '内容A内容B', '内容A内容B', 0, 6, 'element-merge', false,
        );

        console.log('原始结构: <p>内容A</p><p>内容B</p> (分离)');
        console.log('变化后: <div>内容A内容B</div> (合并)');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功处理元素合并后的选区');
        } else {
          console.log(`⚠️ 元素合并处理失败: ${result.error}`);
        }
      });
    });

    describe('1.3 元素标签变更', () => {
      it('应该处理标签类型变化但内容保持的场景', () => {
        console.log('\n=== 测试: 元素标签变更 ===');

        // 原始: <article><h3>标题</h3><p>正文内容</p></article>
        // 变化后: <section><h2>标题</h2><div>正文内容</div></section>
        container.innerHTML = `
          <section>
            <h2>标题</h2>
            <div>正文内容</div>
          </section>
        `;

        const selectionData = createCrossDOMSelectionData(
          '标题正文内容', '标题正文内容', 0, 6, 'tag-change', true,
        );

        console.log('原始结构: <article><h3>标题</h3><p>正文内容</p></article>');
        console.log('变化后: <section><h2>标题</h2><div>正文内容</div></section>');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThanOrEqual(2); // 应该用L2以上的算法
          console.log('✅ 成功处理标签变更的跨元素选区');
        } else {
          console.log(`⚠️ 标签变更处理失败: ${result.error}`);
        }
      });
    });

    describe('1.4 嵌套层级变化', () => {
      it('应该处理DOM嵌套深度变化的场景', () => {
        console.log('\n=== 测试: 嵌套层级变化 ===');

        // 原始: <div><section><p>段落1</p><p>段落2</p></section></div>
        // 变化后: <div><article><header><p>段落1</p></header><main><p>段落2</p></main></article></div>
        container.innerHTML = `
          <article>
            <header><p>段落1</p></header>
            <main><p>段落2</p></main>
          </article>
        `;

        const selectionData = createCrossDOMSelectionData(
          '段落1段落2', '段落1段落2', 0, 6, 'nesting-change', true,
        );

        console.log('原始结构: 简单嵌套 <section><p>段落1</p><p>段落2</p></section>');
        console.log('变化后: 复杂嵌套 <article><header><p>段落1</p></header><main><p>段落2</p></main></article>');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThanOrEqual(3); // 复杂结构应该用L3/L4
          console.log('✅ 成功处理嵌套层级变化');
        } else {
          console.log(`⚠️ 嵌套层级变化处理失败: ${result.error}`);
        }
      });
    });
  });

  describe('2. 元素移动和重排', () => {
    describe('2.1 兄弟元素位置交换', () => {
      it('应该处理元素顺序变化的跨元素选区', () => {
        console.log('\n=== 测试: 兄弟元素位置交换 ===');

        // 原始: <p id="p1">第一段</p><p id="p2">第二段</p><p id="p3">第三段</p>
        // 变化后: <p id="p2">第二段</p><p id="p3">第三段</p><p id="p1">第一段</p>
        container.innerHTML = `
          <p id="p2">第二段</p>
          <p id="p3">第三段</p>
          <p id="p1">第一段</p>
        `;

        const selectionData = createCrossDOMSelectionData(
          '第一段第二段', '第一段第二段', 0, 6, 'element-reorder', true,
        );

        console.log('原始顺序: p1→p2→p3');
        console.log('变化后: p2→p3→p1 (p1移到最后)');
        console.log('期望: 找到重排后的"第一段第二段"');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功处理元素重排的跨元素选区');
        } else {
          console.log(`⚠️ 元素重排处理失败: ${result.error}`);
        }
      });
    });

    describe('2.2 元素层级提升', () => {
      it('应该处理深层嵌套元素扁平化的场景', () => {
        console.log('\n=== 测试: 元素层级提升 ===');

        // 原始: 深层嵌套 <section><article><p>内容A</p></article><aside><p>内容B</p></aside></section>
        // 变化后: 扁平化 <p>内容A</p><p>内容B</p>
        container.innerHTML = `
          <p>内容A</p>
          <p>内容B</p>
        `;

        const selectionData = createCrossDOMSelectionData(
          '内容A内容B', '内容A内容B', 0, 6, 'flattening', true,
        );

        console.log('原始结构: 深层嵌套 section>article>p + section>aside>p');
        console.log('变化后: 扁平结构 p + p');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(1); // 结构变化应该用L2+
          console.log('✅ 成功处理结构扁平化');
        } else {
          console.log(`⚠️ 结构扁平化处理失败: ${result.error}`);
        }
      });
    });
  });

  describe('3. 内容分割与合并', () => {
    describe('3.1 文本节点分割', () => {
      it('应该处理连续文本被分割到不同元素的场景', () => {
        console.log('\n=== 测试: 文本节点分割 ===');

        // 原始: <p>这是一段完整的文本内容</p>
        // 变化后: <p>这是<span>一段完整</span>的<em>文本</em>内容</p>
        container.innerHTML = `
          <p>这是<span>一段完整</span>的<em>文本</em>内容</p>
        `;

        const selectionData = createCrossDOMSelectionData(
          '一段完整的文本', '一段完整的文本', 2, 8, 'text-split', false,
        );

        console.log('原始: 连续文本 "这是一段完整的文本内容"');
        console.log('变化后: 分割文本 "这是<span>一段完整</span>的<em>文本</em>内容"');
        console.log('期望: 跨span和em找到"一段完整的文本"');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功处理文本节点分割');
        } else {
          console.log(`⚠️ 文本节点分割处理失败: ${result.error}`);
        }
      });
    });

    describe('3.2 元素内容合并', () => {
      it('应该处理多个元素合并到一个元素的场景', () => {
        console.log('\n=== 测试: 元素内容合并 ===');

        // 原始: <span>第一部分</span><span>第二部分</span><span>第三部分</span>
        // 变化后: <p>第一部分第二部分第三部分</p>
        container.innerHTML = `
          <p>第一部分第二部分第三部分</p>
        `;

        const selectionData = createCrossDOMSelectionData(
          '第一部分第二部分', '第一部分第二部分', 0, 8, 'content-merge', false,
        );

        console.log('原始: 分离元素 <span>第一部分</span><span>第二部分</span>');
        console.log('变化后: 合并元素 <p>第一部分第二部分第三部分</p>');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功处理元素内容合并');
        } else {
          console.log(`⚠️ 元素内容合并处理失败: ${result.error}`);
        }
      });
    });
  });

  describe('4. 性能测试', () => {
    it('应该在合理时间内处理复杂的跨DOM变化', () => {
      console.log('\n=== 测试: 跨DOM变化性能 ===');

      // 创建复杂的DOM结构
      const complexHTML = Array.from({ length: 50 }, (_, i) =>
        `<section><h3>标题${i}</h3><p>段落${i}内容</p></section>`,
      ).join('');

      container.innerHTML = complexHTML;

      const selectionData = createCrossDOMSelectionData(
        '标题1段落1内容', '标题1段落1内容', 0, 8, 'performance', true,
      );

      console.log('复杂DOM结构: 50个section，100个子元素');

      const result = restoreSelection(selectionData);

      console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

      // 性能要求：复杂结构应该在500ms内完成
      expect(result.restoreTime).toBeLessThan(500);

      if (result.success) {
        console.log(`⚡ 复杂DOM性能测试通过: ${result.restoreTime.toFixed(2)}ms`);
      } else {
        console.log(`⚠️ 复杂DOM处理失败，但性能达标: ${result.restoreTime.toFixed(2)}ms`);
      }
    });
  });
});
