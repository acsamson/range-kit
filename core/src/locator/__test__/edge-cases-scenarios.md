# 边界情况和异常场景测试

## 🎯 测试目标
验证选区恢复算法在各种边界情况、异常场景和极端条件下的鲁棒性和容错能力。

## 📋 测试场景分类

### 1. 数据边界测试（Data Boundary Testing）

#### 1.1 空内容场景
- **场景**: 处理空文本、空元素的情况
- **例子**:
  ```html
  <!-- 原始：空内容 -->
  <div></div>
  选区: 无选区
  
  <!-- 变化后：添加内容 -->
  <div><p>新增内容</p></div>
  期望: 无法恢复（没有原始选区）
  ```

#### 1.2 超长文本内容
- **场景**: 处理极长的文本内容
- **例子**:
  ```html
  <!-- 原始：包含10万字符的文本 -->
  <div class="long-content">
    <!-- 10万字符的文本内容 -->
    ...选区位于第50000-50010字符...
  </div>
  
  <!-- 变化：在开头插入1000字符 -->
  <div class="long-content">
    <!-- 新增1000字符 + 原10万字符 -->
    ...原选区应该在第51000-51010字符...
  </div>
  期望: 准确处理位置偏移
  ```

#### 1.3 单字符选区
- **场景**: 选区只包含一个字符
- **例子**:
  ```html
  <!-- 原始 -->
  <p>ABCDEFGHIJK</p>
  选区: "F" (位置5-6)
  
  <!-- 变化：前面插入文本 -->
  <p>XYABCDEFGHIJK</p>
  期望: 找到"F" (位置7-8)
  ```

#### 1.4 零宽度选区（光标位置）
- **场景**: 处理光标位置而非选中文本
- **例子**:
  ```html
  <!-- 原始 -->
  <p>Hello|World</p>  <!-- 光标在Hello和World之间 -->
  选区: 位置5，长度0
  
  <!-- 变化：在开头插入 -->
  <p>Hi Hello|World</p>
  期望: 光标位置调整到位置8
  ```

### 2. DOM结构极端情况（DOM Structure Extremes）

#### 2.1 深度嵌套结构
- **场景**: 超深层级的DOM嵌套（50+层）
- **例子**:
  ```html
  <!-- 极深嵌套：50层div -->
  <div><div><div>...<div>
    <span>深层文本</span>
  </div>...</div></div></div>
  选区: "深层文本"
  
  <!-- 结构变化后仍然很深 -->
  <section><article><header>...<main>
    <span>深层文本</span>
  </main>...</header></article></section>
  期望: 能够处理深层嵌套的路径计算
  ```

#### 2.2 大量兄弟元素
- **场景**: 同级存在数千个兄弟元素
- **例子**:
  ```html
  <!-- 原始：1000个兄弟元素 -->
  <div class="container">
    <div>元素1</div>
    <div>元素2</div>
    <!-- ... 997个元素 ... -->
    <div>元素1000</div>
    <p>目标元素</p>  <!-- 选区在这里 -->
  </div>
  选区: "目标元素"
  
  <!-- 变化：在中间插入新元素 -->
  <div class="container">
    <div>元素1</div>
    <!-- ... 500个元素 ... -->
    <div>新插入元素</div>
    <!-- ... 剩余元素 ... -->
    <p>目标元素</p>
  </div>
  期望: 在大量元素中准确定位
  ```

#### 2.3 复杂混合内容
- **场景**: 文本、元素、注释、脚本混合
- **例子**:
  ```html
  <!-- 原始：复杂混合内容 -->
  <div>
    文本节点1
    <!-- 注释节点 -->
    <span>元素1</span>
    文本节点2
    <script>var x = 1;</script>
    <b>目标文本</b>
    <!-- 另一个注释 -->
    文本节点3
  </div>
  选区: "文本节点1元素1文本节点2目标文本"
  
  <!-- 变化：移除脚本，添加新元素 -->
  <div>
    文本节点1
    <!-- 注释节点 -->
    <span>元素1</span>
    <em>新元素</em>
    文本节点2
    <b>目标文本</b>
    文本节点3
  </div>
  期望: 正确处理混合节点类型
  ```

### 3. 特殊字符和编码测试（Special Characters & Encoding）

#### 3.1 Unicode字符处理
- **场景**: 包含各种Unicode字符的文本
- **例子**:
  ```html
  <!-- 原始：多种Unicode字符 -->
  <p>🌟 Hello 世界 🚀 עברית العربية</p>
  选区: "🌟 Hello 世界" 
  
  <!-- 变化：插入更多Unicode -->
  <p>🎨 🌟 Hello 世界 🚀 עברית العربية 🎭</p>
  期望: 正确处理多字节字符的位置计算
  ```

#### 3.2 HTML实体字符
- **场景**: 包含HTML实体的内容
- **例子**:
  ```html
  <!-- 原始 -->
  <p>Price: &lt; $100 &amp; &gt; $50</p>
  选区: "< $100 & > $50"
  
  <!-- 变化：实体编码改变 -->
  <p>Price: < $100 &amp; > $50</p>
  期望: 正确处理实体字符的等价性
  ```

#### 3.3 空白字符处理
- **场景**: 各种空白字符的处理
- **例子**:
  ```html
  <!-- 原始：包含各种空白 -->
  <p>Text\t\tTabbed\n\nNewline&nbsp;&nbsp;NBSP</p>
  选区: "Text		Tabbed\n\nNewline  NBSP"
  
  <!-- 变化：空白字符标准化 -->
  <p>Text  Tabbed  Newline  NBSP</p>
  期望: 智能处理空白字符的等价性
  ```

### 4. 性能压力测试（Performance Stress Testing）

#### 4.1 高频率变化
- **场景**: 短时间内大量DOM变化
- **例子**:
  ```javascript
  // 1秒内进行100次DOM修改
  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      // 修改DOM内容
      document.querySelector('.target').textContent += ` 更新${i}`;
    }, i * 10);
  }
  期望: 算法能够处理高频变化而不崩溃
  ```

#### 4.2 内存压力测试
- **场景**: 在内存受限环境下的运行
- **例子**:
  ```html
  <!-- 创建大量DOM节点消耗内存 -->
  <div class="memory-pressure">
    <!-- 生成10万个节点 -->
    <div>节点1</div>
    <div>节点2</div>
    <!-- ... 99,998个节点 ... -->
    <div>节点100000</div>
  </div>
  期望: 在内存压力下仍能正常工作
  ```

#### 4.3 CPU密集型环境
- **场景**: CPU被其他任务占用时的性能
- **例子**:
  ```javascript
  // 模拟CPU密集型任务
  function cpuIntensiveTask() {
    for (let i = 0; i < 10000000; i++) {
      Math.random() * Math.random();
    }
  }
  
  // 在CPU繁忙时进行选区恢复
  setInterval(cpuIntensiveTask, 100);
  期望: 不影响选区恢复的正确性
  ```

### 5. 浏览器兼容性边界（Browser Compatibility Edge Cases）

#### 5.1 不同Selection API行为
- **场景**: 各浏览器Selection API的差异
- **例子**:
  ```javascript
  // 测试不同浏览器的Selection对象差异
  const selection = window.getSelection();
  
  // Edge case: 某些浏览器可能返回null
  if (!selection) {
    // 降级处理
  }
  
  // Edge case: range数量差异
  if (selection.rangeCount === 0) {
    // 没有选区的处理
  }
  期望: 兼容所有主流浏览器的差异
  ```

#### 5.2 DOM API兼容性
- **场景**: 不同浏览器DOM API的差异
- **例子**:
  ```javascript
  // 测试各种DOM遍历方法的兼容性
  const element = document.querySelector('.test');
  
  // 某些旧浏览器可能不支持某些API
  if (!element.closest) {
    // 降级实现
  }
  
  if (!element.matches) {
    // 使用其他方法
  }
  期望: 在各种浏览器环境下稳定运行
  ```

### 6. 异常输入处理（Invalid Input Handling）

#### 6.1 损坏的序列化数据
- **场景**: 处理损坏或不完整的序列化数据
- **例子**:
  ```javascript
  // 损坏的序列化数据
  const corruptedData = {
    selection: null,
    // 缺少必要字段
    // idAnchors: undefined,
    // paths: "invalid_path_format"
  };
  
  期望: 优雅地处理并返回错误信息
  ```

#### 6.2 无效的DOM状态
- **场景**: DOM处于无效或不一致状态
- **例子**:
  ```html
  <!-- 无效的HTML结构 -->
  <div>
    <p>段落开始
      <div>嵌套div（无效结构）</div>
    </p>
  </div>
  期望: 算法能够处理非标准DOM结构
  ```

#### 6.3 循环引用和无限递归
- **场景**: 防止算法陷入无限循环
- **例子**:
  ```javascript
  // 创建可能导致无限递归的结构
  const element = document.createElement('div');
  element.appendChild(element); // 自引用（虽然浏览器会阻止）
  
  期望: 算法有深度限制和循环检测
  ```

### 7. 资源限制测试（Resource Limitation Testing）

#### 7.1 网络延迟影响
- **场景**: 在网络延迟或中断时的表现
- **例子**:
  ```javascript
  // 模拟网络延迟
  function simulateNetworkDelay() {
    return new Promise(resolve => {
      setTimeout(resolve, Math.random() * 5000); // 0-5秒延迟
    });
  }
  
  期望: 算法不依赖网络请求，离线可用
  ```

#### 7.2 磁盘空间限制
- **场景**: 本地存储空间不足时的处理
- **例子**:
  ```javascript
  try {
    // 尝试存储大量数据直到超出限制
    localStorage.setItem('test', 'x'.repeat(10000000));
  } catch (e) {
    // 处理存储空间不足
  }
  
  期望: 优雅处理存储失败，不影响核心功能
  ```

### 8. 安全边界测试（Security Boundary Testing）

#### 8.1 XSS防护测试
- **场景**: 防止恶意脚本注入
- **例子**:
  ```html
  <!-- 恶意输入尝试 -->
  <div class="content">
    <script>alert('XSS')</script>
    <img src="x" onerror="alert('XSS')">
    Normal content
  </div>
  选区: "Normal content"
  
  期望: 算法不执行或传播恶意代码
  ```

#### 8.2 数据泄露防护
- **场景**: 防止敏感信息泄露
- **例子**:
  ```html
  <!-- 包含敏感信息的内容 -->
  <div class="sensitive">
    用户密码: <input type="password" value="secret123">
    信用卡: 1234-5678-9012-3456
  </div>
  
  期望: 不在错误日志或序列化数据中暴露敏感信息
  ```

### 9. 时间相关边界测试（Time-related Edge Cases）

#### 9.1 时间戳溢出
- **场景**: 处理极端时间戳值
- **例子**:
  ```javascript
  // 测试时间戳边界值
  const extremeTimestamps = [
    0,                    // Unix epoch
    Date.now(),          // 当前时间
    8640000000000000,    // JavaScript最大时间戳
    -8640000000000000    // JavaScript最小时间戳
  ];
  
  期望: 正确处理所有有效时间戳范围
  ```

#### 9.2 时区变化处理
- **场景**: 系统时区变化时的影响
- **例子**:
  ```javascript
  // 模拟时区变化
  const originalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // 模拟时间相关的边界情况
  期望: 算法不受时区变化影响
  ```

### 10. 并发和竞态条件（Concurrency & Race Conditions）

#### 10.1 多标签页同步
- **场景**: 多个标签页同时操作相同内容
- **例子**:
  ```javascript
  // 模拟多标签页并发修改
  // 标签页A：修改内容
  document.querySelector('.content').textContent = '内容A';
  
  // 标签页B：同时修改内容
  document.querySelector('.content').textContent = '内容B';
  
  期望: 处理并发修改的竞态条件
  ```

#### 10.2 异步操作竞争
- **场景**: 多个异步操作的竞争条件
- **例子**:
  ```javascript
  // 多个异步恢复操作同时进行
  Promise.all([
    restoreSelection(data1),
    restoreSelection(data2),
    restoreSelection(data3)
  ]);
  
  期望: 正确处理并发恢复请求
  ```

## 🔧 测试实现策略

### 自动化测试框架
1. **边界值自动生成**: 自动生成各种边界输入值
2. **压力测试套件**: 自动化性能和稳定性测试
3. **兼容性矩阵**: 跨浏览器自动化测试

### 错误注入测试
1. **故障模拟**: 主动注入各种故障条件
2. **资源耗尽模拟**: 模拟各种资源限制场景
3. **网络条件模拟**: 模拟各种网络状况

### 监控和日志
1. **异常捕获**: 完整的异常捕获和报告
2. **性能监控**: 实时性能指标监控
3. **内存泄露检测**: 长期运行内存监控

## 📊 容错标准

### 错误处理要求
- 任何输入都不应导致崩溃
- 错误信息应准确且有意义
- 降级策略应该优雅且可预测

### 性能边界
- 最坏情况执行时间 < 5秒
- 内存使用增长 < 100MB
- CPU使用率 < 50% (短时间峰值)

### 兼容性要求
- 支持主流浏览器最近3个版本
- 移动端浏览器兼容
- 无障碍功能兼容 