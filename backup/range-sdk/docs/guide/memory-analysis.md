# 内存分析指南

## 使用内存诊断工具

### 1. 在浏览器控制台中使用

由于 SDK 已经加载，你可以直接使用全局对象：

```javascript
// 方法1：使用内存诊断工具
if (window.__rangesdk__ && window.__rangesdk__.MemoryDiagnostic) {
  const analysis = await window.__rangesdk__.MemoryDiagnostic.analyzeMemory();
  console.log('内存分析结果:', analysis);
  
  const recommendations = window.__rangesdk__.MemoryDiagnostic.getMemoryRecommendations(analysis);
  console.log('优化建议:', recommendations);
}

// 方法2：使用便捷函数
if (window.__rangesdk__ && window.__rangesdk__.diagnoseMemory) {
  const result = await window.__rangesdk__.diagnoseMemory();
}
```

### 2. 分析 Chrome 堆快照

#### 加载堆快照
1. 打开 Chrome DevTools (F12)
2. 切换到 Memory 标签
3. 点击 "Load" 按钮，选择你的 .heapsnapshot 文件

#### 重点关注区域

##### Summary 视图
- 按 **Retained Size** 排序，找出占用内存最多的对象
- 常见的内存占用大户：
  - `(array)` - 数组对象
  - `(string)` - 字符串
  - `(system)` - 系统对象
  - `Object` - 普通对象
  - `HTMLDivElement` 等 - DOM 元素

##### 搜索关键词
在 Class filter 中搜索：
- `detached` - 分离的 DOM 节点（内存泄漏常见原因）
- `EventListener` - 事件监听器
- `Timer` - 定时器
- `RangeSDK` - SDK 相关对象
- `Selection` - 选区相关对象

#### 分析步骤

1. **识别内存泄漏**
   ```
   - 搜索 "detached"
   - 如果发现大量 detached DOM nodes，说明存在 DOM 泄漏
   - 点击对象查看 Retainers（谁在引用它）
   ```

2. **查找大对象**
   ```
   - 在 Summary 视图按 Retained Size 排序
   - 查看前 10 个最大的对象
   - 分析它们的引用链
   ```

3. **检查 RangeSDK**
   ```
   - 搜索 "RangeSDK"
   - 检查实例数量（应该只有 1 个）
   - 查看其 Retained Size
   ```

### 3. 常见内存问题及解决方案

#### DOM 泄漏
**症状**：大量 detached DOM nodes
**解决**：
```javascript
// 错误示例
element.addEventListener('click', handler);
element.remove(); // handler 仍然持有 element 的引用

// 正确示例
element.addEventListener('click', handler);
element.removeEventListener('click', handler);
element.remove();
```

#### 事件监听器泄漏
**症状**：EventListener 数量持续增长
**解决**：
```javascript
// 使用 AbortController
const controller = new AbortController();
element.addEventListener('click', handler, { signal: controller.signal });
// 清理时
controller.abort();
```

#### 定时器泄漏
**症状**：Timer 对象累积
**解决**：
```javascript
// 保存定时器 ID
const timerId = setInterval(() => {}, 1000);
// 清理时
clearInterval(timerId);
```

### 4. 内存优化建议

1. **使用 WeakMap/WeakSet**
   ```javascript
   // 使用 WeakMap 存储 DOM 相关数据
   const domData = new WeakMap();
   domData.set(element, data);
   // 当 element 被垃圾回收时，data 也会被回收
   ```

2. **实现数据上限**
   ```javascript
   class LimitedCache {
     constructor(maxSize = 100) {
       this.maxSize = maxSize;
       this.cache = new Map();
     }
     
     set(key, value) {
       if (this.cache.size >= this.maxSize) {
         const firstKey = this.cache.keys().next().value;
         this.cache.delete(firstKey);
       }
       this.cache.set(key, value);
     }
   }
   ```

3. **及时清理大数据**
   ```javascript
   // 清理不再使用的大数组
   largeArray.length = 0;
   largeArray = null;
   
   // 清理对象属性
   delete object.largeProperty;
   ```

### 5. 性能监控

使用 RangeSDK 的性能监控：

```javascript
// 获取性能概览
const overview = await window.__rangesdk__.performance.getFriendlyOverview();
console.log('性能概览:', overview);

// 获取详细报告
const report = window.__rangesdk__.performance.getReport();
console.log('性能报告:', report);

// 清理旧数据
window.__rangesdk__.performance.clearMetrics();
```

### 6. 内存分析检查清单

- [ ] JS 堆使用率是否超过 80%？
- [ ] 是否有 detached DOM nodes？
- [ ] EventListener 数量是否合理？
- [ ] 是否有未清理的定时器？
- [ ] 大数组/对象是否有清理机制？
- [ ] RangeSDK 实例是否只有一个？
- [ ] 选区数据是否定期清理？
- [ ] 性能监控数据是否有上限？

### 7. 使用 Performance Profiler

除了堆快照，还可以使用 Performance 面板：

1. 打开 DevTools > Performance
2. 点击录制按钮
3. 执行一些操作
4. 停止录制
5. 查看 Memory 图表，观察内存增长趋势

如果内存持续增长而不下降，说明存在内存泄漏。