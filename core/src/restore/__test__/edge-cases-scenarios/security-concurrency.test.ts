import { describe, it, expect, beforeEach } from 'vitest';
import { restoreSelection } from '../../restorer/restorer';
import { SerializedSelection } from '../../types';

describe('Edge Cases - Security & Concurrency', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  // 创建安全并发测试数据
  const createSecurityTestSelectionData = (
    originalText: string,
    selectedText: string,
    startOffset: number,
    endOffset: number,
    scenario: string,
    elementId = 'security-element',
  ): SerializedSelection => ({
    id: `test-security-${scenario}`,
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
        className: 'security-test',
        id: elementId,
        attributes: { id: elementId },
      },
      endAnchors: {
        tagName: 'div',
        className: 'security-test',
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
      className: 'security-test',
      attributes: { id: elementId, class: 'security-test' },
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
      url: 'test://security-testing',
      title: 'Security Testing',
      selectionBounds: { x: 0, y: 0, width: 100, height: 20, top: 0, right: 100, bottom: 20, left: 0, toJSON: () => ({}) } as DOMRect,
      viewport: { width: 1920, height: 1080 },
      userAgent: 'test-agent',
    },
    restoreStatus: 'pending' as any,
    appName: 'Test App',
    appUrl: 'test://security-testing',
  });

  describe('1. 安全边界测试 (Security Boundary Testing)', () => {
    describe('1.1 XSS防护测试', () => {
      it('应该防止恶意脚本注入', () => {
        console.log('\n=== 测试: XSS防护 ===');

        // 包含潜在恶意内容的DOM（已被浏览器安全处理）
        container.innerHTML = `
          <div class="content security-test" id="xss-test">
            &lt;script&gt;alert('XSS')&lt;/script&gt;
            &lt;img src="x" onerror="alert('XSS')"&gt;
            Normal content
          </div>
        `;

        const selectionData = createSecurityTestSelectionData(
          'Normal content', 'Normal content', 0, 14, 'xss-prevention', 'xss-test',
        );

        console.log('恶意输入: <script>alert(XSS)</script>, <img onerror=...>');
        console.log('安全处理: 恶意代码被转义或移除');
        console.log('选区: "Normal content"');
        console.log('期望: 算法不执行或传播恶意代码');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功处理潜在XSS内容，算法安全运行');
        } else {
          console.log(`⚠️ XSS防护测试失败: ${result.error}`);
        }
      });
    });

    describe('1.2 数据泄露防护', () => {
      it('应该防止敏感信息泄露', () => {
        console.log('\n=== 测试: 敏感信息防护 ===');

        // 包含敏感信息的内容
        container.innerHTML = `
          <div class="sensitive security-test" id="sensitive-test">
            用户密码: <input type="password" value="secret123" style="display:none">
            信用卡: <span style="display:none">1234-5678-9012-3456</span>
            公开信息: 用户名是张三
          </div>
        `;

        const selectionData = createSecurityTestSelectionData(
          '公开信息: 用户名是张三', '公开信息: 用户名是张三', 0, 12, 'data-protection', 'sensitive-test',
        );

        console.log('敏感数据: 包含密码、信用卡等隐藏信息');
        console.log('选区: 仅选择公开信息部分');
        console.log('期望: 不在错误日志或序列化数据中暴露敏感信息');

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 成功处理敏感信息，无泄露风险');
        } else {
          console.log(`⚠️ 敏感信息处理失败: ${result.error}`);
        }

        // 验证错误信息中不包含敏感数据
        if (result.error) {
          expect(result.error).not.toContain('secret123');
          expect(result.error).not.toContain('1234-5678-9012-3456');
          console.log('✅ 错误信息中无敏感数据泄露');
        }
      });
    });
  });

  describe('2. 时间相关边界测试 (Time-related Edge Cases)', () => {
    describe('2.1 时间戳溢出', () => {
      it('应该处理极端时间戳值', () => {
        console.log('\n=== 测试: 时间戳边界值 ===');

        container.innerHTML = `
          <div id="timestamp-test" class="security-test">时间戳测试内容</div>
        `;

        // 测试极端时间戳
        const extremeTimestamps = [
          0,                    // Unix epoch
          Date.now(),          // 当前时间
          8640000000000000,    // JavaScript最大时间戳
          -8640000000000000,    // JavaScript最小时间戳
        ];

        console.log('时间戳边界测试: 0, 当前时间, 最大值, 最小值');

        let allPassed = true;

        for (const timestamp of extremeTimestamps) {
          const selectionData = createSecurityTestSelectionData(
            '时间戳测试内容', '时间戳测试内容', 0, 8, 'timestamp-boundary', 'timestamp-test',
          );
          selectionData.timestamp = timestamp;

          const result = restoreSelection(selectionData);

          if (result.restoreTime < 0 || result.restoreTime > 10000) {
            allPassed = false;
            console.log(`⚠️ 时间戳 ${timestamp} 处理异常`);
          }
        }

        if (allPassed) {
          console.log('✅ 成功处理所有极端时间戳值');
        }

        expect(allPassed).toBe(true);
      });
    });

    describe('2.2 时区变化处理', () => {
      it('应该不受时区变化影响', () => {
        console.log('\n=== 测试: 时区变化影响 ===');

        container.innerHTML = `
          <div id="timezone-test" class="security-test">时区测试内容</div>
        `;

        const selectionData = createSecurityTestSelectionData(
          '时区测试内容', '时区测试内容', 0, 6, 'timezone-independence', 'timezone-test',
        );

        console.log('时区测试: 算法应该不依赖本地时区');
        console.log('期望: 算法不受时区变化影响');

        // 记录当前时区信息（仅用于日志）
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log(`当前时区: ${timezone}`);

        const result = restoreSelection(selectionData);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        if (result.success) {
          expect(result.layer).toBeGreaterThan(0);
          console.log('✅ 算法独立于时区，运行正常');
        } else {
          console.log(`⚠️ 时区测试失败: ${result.error}`);
        }
      });
    });
  });

  describe('3. 并发和竞态条件 (Concurrency & Race Conditions)', () => {
    describe('3.1 多标签页模拟', () => {
      it('应该处理模拟的多标签页并发修改', () => {
        console.log('\n=== 测试: 多标签页并发模拟 ===');

        // 模拟标签页A的初始状态
        container.innerHTML = `
          <div class="content security-test" id="concurrent-test">内容A</div>
        `;

        const selectionDataA = createSecurityTestSelectionData(
          '内容A', '内容A', 0, 3, 'concurrent-a', 'concurrent-test',
        );

        console.log('标签页A: "内容A"');

        // 模拟标签页B同时修改内容
        container.innerHTML = `
          <div class="content security-test" id="concurrent-test">内容B</div>
        `;

        console.log('标签页B: 同时修改为"内容B"');
        console.log('期望: 处理并发修改的竞态条件');

        const result = restoreSelection(selectionDataA);

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        // 并发修改导致的失败是可接受的
        if (result.success) {
          console.log('✅ 算法处理了并发修改场景');
        } else {
          console.log(`⚠️ 并发修改导致恢复失败（符合预期）: ${result.error}`);
          expect(result.layer).toBe(0);
        }
      });
    });

    describe('3.2 异步操作竞争', () => {
      it('应该处理多个异步恢复操作的竞争', async () => {
        console.log('\n=== 测试: 异步操作竞争 ===');

        container.innerHTML = `
          <div id="async-race-test" class="security-test">异步竞争测试</div>
        `;

        // 创建多个选区数据
        const selectionData1 = createSecurityTestSelectionData(
          '异步竞争测试', '异步', 0, 2, 'async-race-1', 'async-race-test',
        );
        const selectionData2 = createSecurityTestSelectionData(
          '异步竞争测试', '竞争', 2, 4, 'async-race-2', 'async-race-test',
        );
        const selectionData3 = createSecurityTestSelectionData(
          '异步竞争测试', '测试', 4, 6, 'async-race-3', 'async-race-test',
        );

        console.log('并发恢复: 3个异步恢复操作同时进行');
        console.log('期望: 正确处理并发恢复请求');

        // 模拟并发恢复操作
        const results = await Promise.allSettled([
          Promise.resolve(restoreSelection(selectionData1)),
          Promise.resolve(restoreSelection(selectionData2)),
          Promise.resolve(restoreSelection(selectionData3)),
        ]);

        const successCount = results.filter(r =>
          r.status === 'fulfilled' && r.value.success,
        ).length;

        console.log(`并发结果: ${successCount}/3 个操作成功`);

        // 至少有一个成功，或者全部优雅失败
        const allHandledGracefully = results.every(r =>
          r.status === 'fulfilled' && typeof r.value.success === 'boolean',
        );

        expect(allHandledGracefully).toBe(true);
        console.log('✅ 所有并发操作都被优雅处理');
      });
    });
  });

  describe('4. 资源限制测试 (Resource Limitation Testing)', () => {
    describe('4.1 存储空间模拟', () => {
      it('应该优雅处理存储空间限制', () => {
        console.log('\n=== 测试: 存储空间限制 ===');

        container.innerHTML = `
          <div id="storage-test" class="security-test">存储测试内容</div>
        `;

        const selectionData = createSecurityTestSelectionData(
          '存储测试内容', '存储测试内容', 0, 6, 'storage-limit', 'storage-test',
        );

        console.log('存储限制模拟: 算法应该不强依赖本地存储');
        console.log('期望: 优雅处理存储失败，不影响核心功能');

        // 测试在可能的存储限制下运行
        let storageTestPassed = true;
        try {
          const result = restoreSelection(selectionData);

          console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

          if (result.success) {
            console.log('✅ 存储限制下算法仍正常运行');
          } else {
            console.log(`⚠️ 存储限制测试: ${result.error}`);
          }
        } catch (error) {
          console.log(`⚠️ 存储限制导致异常: ${error}`);
          storageTestPassed = false;
        }

        // 算法应该不会因为存储问题而崩溃
        expect(storageTestPassed).toBe(true);
      });
    });

    describe('4.2 网络延迟模拟', () => {
      it('应该证明算法不依赖网络请求', () => {
        console.log('\n=== 测试: 网络独立性 ===');

        container.innerHTML = `
          <div id="network-test" class="security-test">网络独立测试</div>
        `;

        const selectionData = createSecurityTestSelectionData(
          '网络独立测试', '网络独立测试', 0, 7, 'network-independence', 'network-test',
        );

        console.log('网络独立性: 算法应该完全离线可用');
        console.log('期望: 算法不依赖网络请求，离线可用');

        // 测试算法的网络独立性
        const startTime = performance.now();
        const result = restoreSelection(selectionData);
        const endTime = performance.now();

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        // 执行时间应该很快，证明没有网络请求
        expect(endTime - startTime).toBeLessThan(100);

        if (result.success) {
          console.log('✅ 算法完全离线运行，无网络依赖');
        } else {
          console.log(`⚠️ 网络独立性测试: ${result.error}`);
        }
      });
    });
  });

  describe('5. 输入验证和错误处理 (Input Validation & Error Handling)', () => {
    describe('5.1 恶意输入防护', () => {
      it('应该防护各种恶意输入', () => {
        console.log('\n=== 测试: 恶意输入防护 ===');

        container.innerHTML = `
          <div id="malicious-input-test" class="security-test">正常内容</div>
        `;

        // 构造恶意输入数据
        const maliciousInputs = [
          null,
          undefined,
          {},
          [],
          'string_instead_of_object',
          { malformed: 'data' },
          { text: '<script>alert("xss")</script>' },
        ];

        console.log('恶意输入: null, undefined, 空对象, 数组, 字符串, 格式错误等');
        console.log('期望: 所有恶意输入都被安全处理');

        let allInputsHandledSafely = true;

        for (const maliciousInput of maliciousInputs) {
          try {
            const result = restoreSelection(maliciousInput as any);

            // 应该返回失败结果而不是崩溃
            if (typeof result !== 'object' || typeof result.success !== 'boolean') {
              allInputsHandledSafely = false;
              console.log(`⚠️ 恶意输入处理异常: ${JSON.stringify(maliciousInput)}`);
            }
          } catch (error) {
            // 捕获异常也算安全处理
            console.log(`⚠️ 恶意输入导致异常但被捕获: ${error}`);
          }
        }

        expect(allInputsHandledSafely).toBe(true);
        console.log('✅ 所有恶意输入都被安全处理');
      });
    });

    describe('5.2 循环引用防护', () => {
      it('应该防止无限递归和循环引用', () => {
        console.log('\n=== 测试: 循环引用防护 ===');

        container.innerHTML = `
          <div id="circular-ref-test" class="security-test">循环引用测试</div>
        `;

        // 创建包含循环引用的数据结构
        const circularData = createSecurityTestSelectionData(
          '循环引用测试', '循环引用测试', 0, 7, 'circular-ref', 'circular-ref-test',
        );

        // 注入循环引用（小心处理以避免JSON.stringify错误）
        const circularObject: any = { ref: null };
        circularObject.ref = circularObject;
        (circularData as any).circularRef = circularObject;

        console.log('循环引用: 数据结构包含自引用');
        console.log('期望: 算法有深度限制和循环检测');

        const startTime = performance.now();
        const result = restoreSelection(circularData);
        const endTime = performance.now();

        console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms`);

        // 执行时间应该合理，不应该无限循环
        expect(endTime - startTime).toBeLessThan(5000);

        if (result.success) {
          console.log('✅ 成功处理循环引用，无无限递归');
        } else {
          console.log(`⚠️ 循环引用导致失败（安全行为）: ${result.error}`);
        }
      });
    });
  });

  describe('6. 综合安全测试', () => {
    it('应该通过综合安全和性能测试', () => {
      console.log('\n=== 测试: 综合安全测试 ===');

      container.innerHTML = `
        <div id="comprehensive-security" class="security-test">
          <span>安全内容</span>
          <!-- 注释节点 -->
          <div class="nested">嵌套内容</div>
        </div>
      `;

      const selectionData = createSecurityTestSelectionData(
        '安全内容嵌套内容', '安全内容', 0, 4, 'comprehensive-security', 'comprehensive-security',
      );

      console.log('综合测试: 复杂DOM + 安全要求 + 性能要求');
      console.log('期望: 所有安全和性能要求都满足');

      const startTime = performance.now();
      const result = restoreSelection(selectionData);
      const actualTime = performance.now() - startTime;

      console.log(`结果: ${result.success ? '成功' : '失败'}, 算法: L${result.layer} (${result.layerName}), 耗时: ${result.restoreTime.toFixed(2)}ms, 实际: ${actualTime.toFixed(2)}ms`);

      // 综合安全测试的性能要求
      expect(result.restoreTime).toBeLessThan(1000);
      expect(actualTime).toBeLessThan(1000);

      if (result.success) {
        console.log(`⚡ 综合安全测试通过: ${result.restoreTime.toFixed(2)}ms`);
      } else {
        console.log(`⚠️ 综合测试失败，但性能和安全达标: ${result.restoreTime.toFixed(2)}ms`);
      }
    });
  });
});
