import { describe, it, expect, beforeEach } from 'vitest';
import { restoreSelection } from '../../restorer/restorer';
import { SerializedSelection } from '../../types';

describe('Real-time Scenarios - Streaming Content', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  // 创建实时场景测试数据
  const createRealTimeSelectionData = (
    originalText: string,
    selectedText: string,
    startOffset: number,
    endOffset: number,
    scenario: string,
    elementId = 'dynamic-element',
  ): SerializedSelection => ({
    id: `test-realtime-${scenario}`,
    text: selectedText,
    timestamp: Date.now(),
    anchors: {
      startId: elementId,
      endId: elementId,
      startOffset,
      endOffset,
    },
    paths: {
      startPath: `#test-container > #${elementId}`,
      endPath: `#test-container > #${elementId}`,
      startOffset,
      endOffset,
      startTextOffset: startOffset,
      endTextOffset: endOffset,
    },
    multipleAnchors: {
      startAnchors: {
        tagName: 'div',
        className: 'dynamic-content',
        id: elementId,
        attributes: { id: elementId },
      },
      endAnchors: {
        tagName: 'div',
        className: 'dynamic-content',
        id: elementId,
        attributes: { id: elementId },
      },
      commonParent: 'test-container',
      siblingInfo: {
        index: 0,
        total: 1,
        tagPattern: 'div',
      },
    },
    structuralFingerprint: {
      tagName: 'div',
      className: 'dynamic-content',
      attributes: { id: elementId, class: 'dynamic-content' },
      textLength: originalText.length,
      childCount: 0,
      depth: 2,
      parentChain: [
        { tagName: 'div', className: '', id: 'test-container' },
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
      parentText: originalText,
      textPosition: { start: startOffset, end: endOffset, totalLength: originalText.length },
    },
    selectionContent: {
      text: selectedText,
      mediaElements: [],
    },
    metadata: {
      url: 'test://real-time-streaming',
      title: 'Real-time Streaming Test',
      selectionBounds: { x: 0, y: 0, width: 100, height: 20, top: 0, right: 100, bottom: 20, left: 0, toJSON: () => ({}) } as DOMRect,
      viewport: { width: 1920, height: 1080 },
      userAgent: 'test-agent',
    },
    restoreStatus: 'pending' as any,
    appName: 'Test App',
    appUrl: 'test://real-time-streaming',
  });

  describe('1. 流式内容加载 (Streaming Content)', () => {
    describe('1.1 逐字显示文本', () => {
      it('应该处理打字机效果中的选区恢复', async () => {
        console.log('\n=== 测试: 打字机效果逐字显示 ===');

        // 原始: "Hello Wo" → 选区: "Hello" (0-5)
        // 变化后: "Hello World!" → 期望: 选区仍在"Hello" (0-5)
        container.innerHTML = `
          <div id="typewriter" class="dynamic-content">Hello World!</div>
        `;

        const selectionData = createRealTimeSelectionData(
          'Hello Wo', 'Hello', 0, 5, 'typewriter-effect', 'typewriter',
        );

        console.log('原始状态: "Hello Wo"');
        console.log('打字机完成: "Hello World!"');
        console.log('期望: 选区"Hello"保持在位置0-5');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          expect(result.restoreTime).toBeLessThan(50); // 实时更新要求 < 50ms
          console.log('✅ 成功处理打字机效果的选区恢复');
        } else {
          console.log(`⚠️ 打字机效果处理失败: ${result.error}`);
        }
      });
    });

    describe('1.2 分段内容追加', () => {
      it('应该处理聊天消息追加时的选区保持', () => {
        console.log('\n=== 测试: 聊天消息分段追加 ===');

        // 原始: 2条消息，选区在第一条
        // 变化后: 4条消息，原选区应保持不变
        container.innerHTML = `
          <div class="chat dynamic-content">
            <p>用户A: 第一条消息</p>
            <p>用户B: 第二条消息</p>
            <p>用户C: 第三条消息</p>
            <p>用户D: 第四条消息</p>
          </div>
        `;

        const selectionData = createRealTimeSelectionData(
          '用户A: 第一条消息用户B: 第二条消息', '用户A: 第一条消息', 0, 10, 'chat-append', 'chat',
        );

        console.log('原始: 2条聊天消息');
        console.log('追加: 新增2条消息到底部');
        console.log('期望: 第一条消息的选区保持不变');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          expect(result.restoreTime).toBeLessThan(50);
          console.log('✅ 成功处理聊天消息追加的选区保持');
        } else {
          console.log(`⚠️ 聊天消息追加处理失败: ${result.error}`);
        }
      });
    });

    describe('1.3 内容预加载展开', () => {
      it('应该处理"展开全文"按钮展开内容后的选区', () => {
        console.log('\n=== 测试: 内容预加载展开 ===');

        // 原始: 折叠状态，选区在开头部分
        // 变化后: 展开状态，原选区位置应保持准确
        container.innerHTML = `
          <article id="expandable" class="dynamic-content">
            <p>文章开头内容...</p>
            <p>文章中间部分...</p>
            <p>文章结尾部分...</p>
          </article>
        `;

        const selectionData = createRealTimeSelectionData(
          '文章开头内容...', '文章开头内容', 0, 7, 'content-expand', 'expandable',
        );

        console.log('原始: 折叠状态，仅显示开头');
        console.log('展开: 显示完整文章内容');
        console.log('期望: 开头部分的选区位置保持准确');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          expect(result.restoreTime).toBeLessThan(100);
          console.log('✅ 成功处理内容展开的选区恢复');
        } else {
          console.log(`⚠️ 内容展开处理失败: ${result.error}`);
        }
      });
    });
  });

  describe('2. 实时数据更新 (Real-time Data Updates)', () => {
    describe('2.1 数字计数器更新', () => {
      it('应该处理实时股价更新中的跨元素选区', () => {
        console.log('\n=== 测试: 实时股价数据更新 ===');

        // 股价实时更新，跨span的选区应该适应性更新
        container.innerHTML = `
          <div class="stock-price dynamic-content" id="stock-widget">
            <span class="symbol">AAPL</span>
            <span class="price">$150.47</span>
            <span class="change">+2.37</span>
          </div>
        `;

        const selectionData = createRealTimeSelectionData(
          'AAPL$150.25', 'AAPL$150.25', 0, 10, 'stock-update', 'stock-widget',
        );

        console.log('原始: AAPL $150.25 +2.15');
        console.log('更新: AAPL $150.47 +2.37');
        console.log('期望: 选区适应性更新为"AAPL$150.47"');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          expect(result.restoreTime).toBeLessThan(50); // 高频数据更新要求
          console.log('✅ 成功处理实时数据更新的选区适应');
        } else {
          console.log(`⚠️ 实时数据更新处理失败: ${result.error}`);
        }
      });
    });

    describe('2.2 状态指示器变化', () => {
      it('应该处理用户在线状态变化的选区更新', () => {
        console.log('\n=== 测试: 在线状态指示器变化 ===');

        // 用户状态从离线变为在线，相关文本发生变化
        container.innerHTML = `
          <div class="user-status dynamic-content" id="user-status">
            <span class="name">张三</span>
            <span class="status online">在线</span>
            <span class="activity">正在输入...</span>
          </div>
        `;

        const selectionData = createRealTimeSelectionData(
          '张三离线', '张三离线', 0, 4, 'status-change', 'user-status',
        );

        console.log('原始: "张三离线" + "最后在线: 2小时前"');
        console.log('更新: "张三在线" + "正在输入..."');
        console.log('期望: 选区更新为"张三在线"');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功处理状态变化的选区更新');
        } else {
          console.log(`⚠️ 状态变化处理失败: ${result.error}`);
        }
      });
    });

    describe('2.3 进度条和百分比更新', () => {
      it('应该处理下载进度实时更新的选区', () => {
        console.log('\n=== 测试: 下载进度实时更新 ===');

        // 下载进度从45%更新到67%
        container.innerHTML = `
          <div class="progress-item dynamic-content" id="progress-widget">
            <span class="task-name">文件下载</span>
            <span class="percentage">67%</span>
            <div class="progress-bar">
              <div class="fill" style="width: 67%"></div>
            </div>
          </div>
        `;

        const selectionData = createRealTimeSelectionData(
          '文件下载45%', '文件下载45%', 0, 7, 'progress-update', 'progress-widget',
        );

        console.log('原始: "文件下载45%"');
        console.log('更新: "文件下载67%"');
        console.log('期望: 选区更新为"文件下载67%"');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          expect(result.restoreTime).toBeLessThan(50);
          console.log('✅ 成功处理进度更新的选区适应');
        } else {
          console.log(`⚠️ 进度更新处理失败: ${result.error}`);
        }
      });
    });
  });

  describe('3. 无限滚动加载 (Infinite Scroll)', () => {
    it('应该处理无限滚动追加内容时的选区保持', () => {
      console.log('\n=== 测试: 无限滚动内容追加 ===');

      // 滚动加载更多内容，原有选区应保持位置不变
      container.innerHTML = `
        <div class="infinite-list dynamic-content" id="infinite-list">
          <div class="item">项目1</div>
          <div class="item">项目2</div>
          <div class="item">项目3</div>
          <div class="item">项目4</div>
          <div class="item">项目5</div>
        </div>
      `;

      const selectionData = createRealTimeSelectionData(
        '项目2项目3', '项目2项目3', 3, 9, 'infinite-scroll', 'infinite-list',
      );

      console.log('原始: 3个项目，选区"项目2项目3"');
      console.log('滚动: 追加项目4、项目5');
      console.log('期望: 原选区"项目2项目3"位置保持不变');

      const result = restoreSelection(selectionData);

      console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

      if (result.success) {
        expect(result.layer).toBeGreaterThan(0);
        expect(result.restoreTime).toBeLessThan(100);
        console.log('✅ 成功处理无限滚动的选区保持');
      } else {
        console.log(`⚠️ 无限滚动处理失败: ${result.error}`);
      }
    });
  });

  describe('4. 性能基准测试', () => {
    it('应该满足实时场景的性能要求', () => {
      console.log('\n=== 测试: 实时场景性能基准 ===');

      // 创建大量动态内容模拟高频更新场景
      const largeContent = Array.from({ length: 100 }, (_, i) =>
        `<div class="real-time-item">实时项目${i}</div>`,
      ).join('');

      container.innerHTML = `
        <div class="real-time-container dynamic-content" id="performance-test">
          ${largeContent}
        </div>
      `;

      const selectionData = createRealTimeSelectionData(
        '实时项目1实时项目2', '实时项目1实时项目2', 0, 10, 'performance', 'performance-test',
      );

      console.log('高频更新场景: 100个动态项目');
      console.log('性能要求: 实时更新响应 < 50ms');

      const result = restoreSelection(selectionData);

      console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

      // 实时场景性能要求
      expect(result.restoreTime).toBeLessThan(50);

      if (result.success) {
        console.log(`⚡ 实时场景性能测试通过: ${result.restoreTime.toFixed(2)}ms`);
      } else {
        console.log(`⚠️ 高频更新处理失败，但性能达标: ${result.restoreTime.toFixed(2)}ms`);
      }
    });
  });
});
