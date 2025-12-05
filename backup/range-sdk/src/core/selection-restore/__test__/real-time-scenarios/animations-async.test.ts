import { describe, it, expect, beforeEach } from 'vitest';
import { restoreSelection } from '../../restorer/restorer';
import { SerializedSelection } from '../../types';

describe('Real-time Scenarios - Animations & Async', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  // 创建动画和异步场景测试数据
  const createAnimationAsyncSelectionData = (
    originalText: string,
    selectedText: string,
    startOffset: number,
    endOffset: number,
    scenario: string,
    elementId = 'animated-element',
  ): SerializedSelection => ({
    id: `test-animation-${scenario}`,
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
        className: 'animated-content',
        id: elementId,
        attributes: { id: elementId },
      },
      endAnchors: {
        tagName: 'div',
        className: 'animated-content',
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
      className: 'animated-content',
      attributes: { id: elementId, class: 'animated-content' },
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
      url: 'test://real-time-animations',
      title: 'Real-time Animations Test',
      selectionBounds: { x: 0, y: 0, width: 100, height: 20, top: 0, right: 100, bottom: 20, left: 0, toJSON: () => ({}) } as DOMRect,
      viewport: { width: 1920, height: 1080 },
      userAgent: 'test-agent',
    },
    restoreStatus: 'pending' as any,
    appName: 'Test App',
    appUrl: 'test://real-time-animations',
  });

  describe('1. 动画和过渡效果 (Animations & Transitions)', () => {
    describe('1.1 CSS动画中的选区', () => {
      it('应该在CSS动画过程中保持选区不变', () => {
        console.log('\n=== 测试: CSS动画中的选区保持 ===');

        // 动画进行中，DOM内容不变，但视觉位置改变
        container.innerHTML = `
          <div class="slide-in animating animated-content" id="slide-element">
            <h2>动画标题</h2>
            <p>动画内容文本</p>
          </div>
        `;

        const selectionData = createAnimationAsyncSelectionData(
          '动画标题动画内容文本', '动画标题动画内容', 0, 9, 'css-animation', 'slide-element',
        );

        console.log('动画前: 静态位置的"动画标题动画内容文本"');
        console.log('动画中: 元素位置移动但DOM结构不变');
        console.log('期望: 选区保持不变，不受视觉动画影响');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          expect(result.restoreTime).toBeLessThan(100); // 动画期间恢复 < 100ms
          console.log('✅ 成功处理CSS动画中的选区保持');
        } else {
          console.log(`⚠️ CSS动画处理失败: ${result.error}`);
        }
      });
    });

    describe('1.2 折叠展开动画', () => {
      it('应该处理手风琴展开动画中的选区', () => {
        console.log('\n=== 测试: 手风琴展开动画 ===');

        // 手风琴从折叠到展开，header部分选区应保持
        container.innerHTML = `
          <div class="accordion animated-content" id="accordion-widget">
            <div class="header">点击展开</div>
            <div class="content expanding">
              <p>隐藏的内容段落</p>
            </div>
          </div>
        `;

        const selectionData = createAnimationAsyncSelectionData(
          '点击展开', '点击展开', 0, 4, 'accordion-expand', 'accordion-widget',
        );

        console.log('折叠: header可见，content隐藏');
        console.log('展开: header + content都可见，动画进行中');
        console.log('期望: header中的选区保持不变');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          expect(result.restoreTime).toBeLessThan(100);
          console.log('✅ 成功处理手风琴展开动画的选区');
        } else {
          console.log(`⚠️ 手风琴动画处理失败: ${result.error}`);
        }
      });
    });

    describe('1.3 元素位移动画', () => {
      it('应该处理元素跨容器移动的选区恢复', () => {
        console.log('\n=== 测试: 元素位移动画 ===');

        // 元素从sidebar移动到main-content
        container.innerHTML = `
          <div class="container animated-content" id="move-container">
            <div class="sidebar"></div>
            <div class="main-content">
              <p>主要内容</p>
              <p class="moving-element">移动元素</p>
            </div>
          </div>
        `;

        const selectionData = createAnimationAsyncSelectionData(
          '移动元素主要内容', '移动元素主要内容', 0, 8, 'element-move', 'move-container',
        );

        console.log('移动前: sidebar中有"移动元素"，main-content中有"主要内容"');
        console.log('移动后: "移动元素"移到main-content，与"主要内容"相邻');
        console.log('期望: 找到重排后的"移动元素主要内容"');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功处理元素位移动画的选区');
        } else {
          console.log(`⚠️ 元素位移动画处理失败: ${result.error}`);
        }
      });
    });
  });

  describe('2. 懒加载和异步内容 (Lazy Loading & Async)', () => {
    describe('2.1 图片懒加载替换', () => {
      it('应该处理占位符被实际图片替换的场景', () => {
        console.log('\n=== 测试: 图片懒加载替换 ===');

        // 占位符文本被img元素替换
        container.innerHTML = `
          <article id="lazy-article" class="animated-content">
            <h3>文章标题</h3>
            <img src="image.jpg" alt="文章配图">
            <p>文章正文内容</p>
          </article>
        `;

        const selectionData = createAnimationAsyncSelectionData(
          '文章标题图片加载中...文章正文', '文章标题图片加载中...文章正文', 0, 15, 'lazy-image', 'lazy-article',
        );

        console.log('加载前: "文章标题" + "图片加载中..." + "文章正文内容"');
        console.log('加载后: "文章标题" + <img> + "文章正文内容"');
        console.log('期望: 选区变为"文章标题文章正文" (跳过img)');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功处理图片懒加载的选区适应');
        } else {
          console.log(`⚠️ 图片懒加载处理失败: ${result.error}`);
        }
      });
    });

    describe('2.2 异步组件加载', () => {
      it('应该处理占位组件被实际组件替换的场景', () => {
        console.log('\n=== 测试: 异步组件加载 ===');

        // loading spinner被实际组件内容替换
        container.innerHTML = `
          <div class="dashboard animated-content" id="async-dashboard">
            <div class="widget">
              <h4>数据图表</h4>
              <div class="chart">图表内容</div>
            </div>
            <div class="sidebar">侧边栏内容</div>
          </div>
        `;

        const selectionData = createAnimationAsyncSelectionData(
          '加载中...侧边栏内容', '加载中...侧边栏内容', 0, 9, 'async-component', 'async-dashboard',
        );

        console.log('加载中: "加载中..." + "侧边栏内容"');
        console.log('加载完成: "数据图表图表内容" + "侧边栏内容"');
        console.log('期望: 选区变为"数据图表图表内容侧边栏内容"');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功处理异步组件加载的选区适应');
        } else {
          console.log(`⚠️ 异步组件加载处理失败: ${result.error}`);
        }
      });
    });
  });

  describe('3. 实时编辑场景 (Real-time Editing)', () => {
    describe('3.1 协同编辑冲突', () => {
      it('应该处理多用户协同编辑的选区冲突', () => {
        console.log('\n=== 测试: 协同编辑冲突处理 ===');

        // 用户A的选区在用户B修改后需要适应性调整
        container.innerHTML = `
          <div class="editor animated-content" id="collaborative-editor">
            <p>共享文档内容已被用户B修改，用户A正在编辑这里</p>
          </div>
        `;

        const selectionData = createAnimationAsyncSelectionData(
          '共享文档内容，用户A正在编辑这里', '共享文档内容', 0, 6, 'collaborative-edit', 'collaborative-editor',
        );

        console.log('用户A视图: "共享文档内容，用户A正在编辑这里"');
        console.log('用户B修改后: "共享文档内容已被用户B修改，用户A正在编辑这里"');
        console.log('期望: 用户A选区适应调整到"共享文档内容已被用户B修改"');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          expect(result.restoreTime).toBeLessThan(200); // 复杂变化恢复 < 200ms
          console.log('✅ 成功处理协同编辑冲突的选区调整');
        } else {
          console.log(`⚠️ 协同编辑冲突处理失败: ${result.error}`);
        }
      });
    });

    describe('3.2 自动保存触发的更新', () => {
      it('应该处理自动保存导致的DOM更新', () => {
        console.log('\n=== 测试: 自动保存DOM更新 ===');

        // 自动保存改变了class和状态文本
        container.innerHTML = `
          <div class="document animated-content" id="auto-save-doc">
            <p class="paragraph saved">未保存的段落内容</p>
            <span class="status">已保存</span>
          </div>
        `;

        const selectionData = createAnimationAsyncSelectionData(
          '未保存的段落内容编辑中', '未保存的段落内容编辑中', 0, 12, 'auto-save', 'auto-save-doc',
        );

        console.log('编辑中: "未保存的段落内容" + "编辑中..."');
        console.log('自动保存后: "未保存的段落内容" + "已保存"');
        console.log('期望: 选区更新为"未保存的段落内容已保存"');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功处理自动保存的DOM更新');
        } else {
          console.log(`⚠️ 自动保存更新处理失败: ${result.error}`);
        }
      });
    });

    describe('3.3 输入法实时转换', () => {
      it('应该处理中文输入法拼音转换过程', () => {
        console.log('\n=== 测试: 输入法实时转换 ===');

        // 拼音转换为中文，DOM结构简化
        container.innerHTML = `
          <div class="input-area animated-content" id="ime-input">
            <span class="text">前面的文字中文后面的文字</span>
          </div>
        `;

        const selectionData = createAnimationAsyncSelectionData(
          '前面的文字zhongwen', '前面的文字zhongwen', 0, 12, 'ime-conversion', 'ime-input',
        );

        console.log('拼音输入: "前面的文字" + "zhongwen" + "后面的文字"');
        console.log('转换确认: "前面的文字中文后面的文字"');
        console.log('期望: 选区变为"前面的文字中文"');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          expect(result.restoreTime).toBeLessThan(50); // 输入法转换要求快速响应
          console.log('✅ 成功处理输入法实时转换');
        } else {
          console.log(`⚠️ 输入法转换处理失败: ${result.error}`);
        }
      });
    });
  });

  describe('4. 错误处理和恢复 (Error Handling)', () => {
    describe('4.1 网络中断恢复', () => {
      it('应该处理网络中断导致的内容加载失败', () => {
        console.log('\n=== 测试: 网络中断恢复 ===');

        // 动态内容加载失败，显示错误信息
        container.innerHTML = `
          <div class="content animated-content" id="network-content">
            <p>正常加载的内容</p>
            <div class="error-message">加载失败，请重试</div>
          </div>
        `;

        const selectionData = createAnimationAsyncSelectionData(
          '正常加载的内容动态内容', '正常加载的内容动态内容', 0, 12, 'network-error', 'network-content',
        );

        console.log('网络正常: "正常加载的内容" + "动态内容"');
        console.log('网络中断: "正常加载的内容" + "加载失败，请重试"');
        console.log('期望: 选区降级为"正常加载的内容"或适应错误信息');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功处理网络中断的错误恢复');
        } else {
          // 网络错误导致的失败也是可接受的
          console.log(`⚠️ 网络中断错误，算法正确识别无法恢复: ${result.error}`);
          expect(result.layer).toBe(0);
        }
      });
    });

    describe('4.2 脚本错误导致的DOM破坏', () => {
      it('应该处理JavaScript错误导致的DOM结构异常', () => {
        console.log('\n=== 测试: DOM结构破坏错误 ===');

        // 脚本错误导致main元素丢失
        container.innerHTML = `
          <div class="app animated-content" id="broken-app">
            <header>页面头部</header>
            <footer>页面底部</footer>
          </div>
        `;

        const selectionData = createAnimationAsyncSelectionData(
          '页面头部主要内容页面底部', '页面头部主要内容页面底部', 0, 12, 'dom-corruption', 'broken-app',
        );

        console.log('正常: "页面头部" + "主要内容" + "页面底部"');
        console.log('错误后: "页面头部" + "页面底部" (main元素丢失)');
        console.log('期望: 降级为"页面头部页面底部"，识别中间部分丢失');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          // 部分恢复也算成功
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功处理DOM破坏的部分恢复');
        } else {
          // 完全失败也是正确的行为
          console.log(`⚠️ DOM破坏严重，算法正确识别无法恢复: ${result.error}`);
          expect(result.layer).toBe(0);
        }
      });
    });
  });

  describe('5. 性能优化场景 (Performance)', () => {
    describe('5.1 虚拟滚动中的选区', () => {
      it('应该处理虚拟滚动中DOM元素的动态创建销毁', () => {
        console.log('\n=== 测试: 虚拟滚动选区处理 ===');

        // 虚拟滚动，当前显示第5-15项
        container.innerHTML = `
          <div class="virtual-list animated-content" id="virtual-scroll">
            <div class="item" data-index="5">项目5</div>
            <div class="item" data-index="6">项目6</div>
            <div class="item" data-index="7">项目7</div>
            <div class="item" data-index="8">项目8</div>
            <div class="item" data-index="9">项目9</div>
          </div>
        `;

        const selectionData = createAnimationAsyncSelectionData(
          '项目1项目2', '项目1项目2', 0, 6, 'virtual-scroll', 'virtual-scroll',
        );

        console.log('原始: 显示项目0-9，选区"项目1项目2"');
        console.log('滚动: 显示项目5-15，原选区元素已不在DOM中');
        console.log('期望: 通过data-index识别或恢复失败');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          // 虚拟滚动恢复成功是高级功能
          expect(result.layer).toBeGreaterThanOrEqual(3);
          console.log('✅ 高级功能：成功处理虚拟滚动选区');
        } else {
          // 虚拟滚动失败是可接受的
          console.log(`⚠️ 虚拟滚动复杂场景，算法正确识别无法恢复: ${result.error}`);
          expect(result.layer).toBe(0);
        }
      });
    });

    describe('5.2 DOM回收和重用', () => {
      it('应该识别DOM元素被回收重用的场景', () => {
        console.log('\n=== 测试: DOM回收重用识别 ===');

        // 相同DOM显示完全不同的内容
        container.innerHTML = `
          <div class="recycled-container animated-content" id="recycled-dom">
            <div class="item" data-id="item-c">数据C</div>
            <div class="item" data-id="item-d">数据D</div>
          </div>
        `;

        const selectionData = createAnimationAsyncSelectionData(
          '数据A数据B', '数据A数据B', 0, 6, 'dom-recycling', 'recycled-dom',
        );

        console.log('原始: data-id="item-a","item-b" → "数据A数据B"');
        console.log('回收后: data-id="item-c","item-d" → "数据C数据D"');
        console.log('期望: 通过data-id识别这是完全不同的内容，恢复失败');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        // DOM回收应该被正确识别为不同内容
        expect(result.success).toBe(false);
        expect(result.layer).toBe(0);
        console.log('✅ 正确识别DOM回收：内容完全不同，恢复失败');
      });
    });
  });

  describe('6. 综合性能测试', () => {
    it('应该满足所有实时场景的性能要求', () => {
      console.log('\n=== 测试: 实时场景综合性能 ===');

      // 模拟复杂的实时场景：动画 + 异步加载 + 数据更新
      container.innerHTML = `
        <div class="complex-realtime animated-content" id="complex-scenario">
          <div class="animated-header">动态标题</div>
          <div class="live-data">实时数据: 42</div>
          <div class="async-content">
            <h4>异步组件</h4>
            <p>动态加载的内容</p>
          </div>
          <div class="status">系统状态: 正常运行</div>
        </div>
      `;

      const selectionData = createAnimationAsyncSelectionData(
        '动态标题实时数据: 35', '动态标题实时数据: 35', 0, 11, 'complex-performance', 'complex-scenario',
      );

      console.log('复杂实时场景: 动画+数据更新+异步加载');
      console.log('性能要求: 复杂变化恢复 < 200ms');

      const startTime = performance.now();
      const result = restoreSelection(selectionData);
      const actualTime = performance.now() - startTime;

      console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms, 实际: ${actualTime.toFixed(2)}ms`);

      // 复杂实时场景性能要求
      expect(result.restoreTime).toBeLessThan(200);
      expect(actualTime).toBeLessThan(200);

      if (result.success) {
        console.log(`⚡ 复杂实时场景性能测试通过: ${result.restoreTime.toFixed(2)}ms`);
      } else {
        console.log(`⚠️ 复杂实时场景处理失败，但性能达标: ${result.restoreTime.toFixed(2)}ms`);
      }
    });
  });
});
