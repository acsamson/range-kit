# 性能监控 API

Range SDK 内置了强大的性能监控系统，可以帮助你了解 SDK 的运行状况和性能表现。

## 获取性能监控器

性能监控器通过 `window.__rangesdk__.performance` 全局访问：

```javascript
// 获取性能监控器实例
const performanceMonitor = window.__rangesdk__.performance;

// 检查是否可用
if (!performanceMonitor) {
  console.log('性能监控未启用');
}
```

## 快速查看性能

### 获取友好的性能总览

```javascript
// 获取完整的性能总览（异步方法）
const overview = await window.__rangesdk__.performance.getFriendlyOverview();

console.log('=== SDK 性能总览 ===');
console.log('内存占用:', overview.SDK内存估算);
console.log('选区存储:', overview.选区存储信息);
console.log('系统资源:', overview.系统资源);
console.log('SDK性能:', overview.SDK性能);
console.log('详细指标:', overview.详细指标);
```

### 性能总览数据结构

```typescript
interface FriendlyPerformanceOverview {
  SDK内存估算: {
    RangeSDK占用: string;        // 核心 SDK 占用
    插件总占用: string;          // 所有插件占用
    选区系统占用: string;        // 选区系统占用
    监控数据占用: string;        // 性能监控数据占用
    预估总占用: string;          // 总内存占用估算
  };
  选区存储信息: {
    存储类型: string;            // 存储类型（内存存储）
    存储的选区数量: number;      // 选区数量
    最新选区时间: string;        // 最新选区创建时间
    最旧选区时间: string;        // 最旧选区创建时间
    存储状态: string;            // 存储系统状态
  };
  系统资源: {
    页面内存: {
      JS堆大小: string;          // JS 堆总大小
      JS堆使用: string;          // JS 堆使用量
      JS堆限制: string;          // JS 堆限制
      页面内存使用率: string;    // 内存使用百分比
    };
    性能指标: {
      帧率: string;              // 当前帧率
      事件循环延迟: string;      // 事件循环延迟
      页面加载时间: string;      // 页面加载时间
      DOM节点数: number;         // DOM 节点总数
    };
    网络状态: {
      连接类型: string;          // 网络连接类型
      有效带宽: string;          // 带宽信息
      往返时间: string;          // RTT
    } | null;
  };
  SDK性能: {
    总操作数: number;            // 总操作次数
    平均响应时间: string;        // 平均响应时间
    最慢操作: string;            // 最慢的操作
    错误率: string;              // 错误率百分比
    性能警告数: number;          // 性能警告数量
    监控时长: string;            // 监控运行时长
  };
  详细指标: Record<string, FriendlyPerformanceStats>;
}
```

## 性能指标类型

Range SDK 监控以下类型的性能指标：

```javascript
const MetricType = {
  // 选区相关
  SELECTION_CREATE: 'selection_create',      // 选区创建
  SELECTION_RESTORE: 'selection_restore',    // 选区恢复
  SELECTION_SERIALIZE: 'selection_serialize', // 选区序列化
  SELECTION_HIGHLIGHT: 'selection_highlight', // 选区高亮
  
  // 插件相关
  PLUGIN_INITIALIZE: 'plugin_initialize',    // 插件初始化
  PLUGIN_API_CALL: 'plugin_api_call',       // 插件 API 调用
  PLUGIN_EVENT_HANDLE: 'plugin_event_handle', // 插件事件处理
  PLUGIN_DESTROY: 'plugin_destroy',         // 插件销毁
  
  // 其他
  DOM_OPERATION: 'dom_operation',           // DOM 操作
  EVENT_EMIT: 'event_emit',                 // 事件触发
  DATA_TRANSFORM: 'data_transform'          // 数据转换
};
```

## 获取性能统计

### 获取所有性能统计

```javascript
// 获取所有类型的性能统计
const allStats = window.__rangesdk__.performance.getStats();

// 遍历显示每种操作的统计
Object.entries(allStats).forEach(([type, stats]) => {
  console.log(`${type}:`, {
    执行次数: stats.count,
    平均耗时: `${stats.averageDuration.toFixed(2)}ms`,
    最慢耗时: `${stats.maxDuration.toFixed(2)}ms`,
    成功率: `${stats.successRate.toFixed(1)}%`
  });
});
```

### 获取特定类型的性能统计

```javascript
// 只获取选区创建的性能统计
const selectionStats = window.__rangesdk__.performance.getStats('selection_create');

console.log('选区创建性能:', {
  执行次数: selectionStats.count,
  总耗时: `${selectionStats.totalDuration.toFixed(2)}ms`,
  平均耗时: `${selectionStats.averageDuration.toFixed(2)}ms`,
  最快耗时: `${selectionStats.minDuration.toFixed(2)}ms`,
  最慢耗时: `${selectionStats.maxDuration.toFixed(2)}ms`,
  成功率: `${selectionStats.successRate.toFixed(1)}%`
});
```

## 获取性能报告

### 获取完整性能报告

```javascript
// 获取从监控开始到现在的完整报告
const report = window.__rangesdk__.performance.getReport();

console.log('性能报告:', {
  监控时长: `${(report.duration / 1000).toFixed(1)}s`,
  总操作数: report.summary.totalOperations,
  平均操作时间: `${report.summary.averageOperationTime.toFixed(2)}ms`,
  最慢操作: {
    类型: report.summary.slowestOperation.type,
    耗时: `${report.summary.slowestOperation.duration.toFixed(2)}ms`
  },
  错误率: `${report.summary.errorRate.toFixed(1)}%`,
  性能警告: report.warnings.length
});
```

### 获取特定时间段的报告

```javascript
// 获取过去 5 分钟的性能报告
const fiveMinutesAgo = performance.now() - 5 * 60 * 1000;
const now = performance.now();

const timedReport = window.__rangesdk__.performance.getReport(
  fiveMinutesAgo,
  now
);

// 显示性能警告
timedReport.warnings.forEach(warning => {
  console.warn(`[性能警告] ${warning.type}: 期望 <${warning.threshold}ms, 实际 ${warning.actualValue.toFixed(2)}ms`);
});
```

## 性能阈值管理

### 设置性能阈值

```javascript
// 设置选区创建的性能阈值为 100ms
window.__rangesdk__.performance.setThreshold('selection_create', 100);

// 设置多个阈值
const thresholds = {
  'selection_create': 100,
  'selection_restore': 200,
  'plugin_initialize': 500
};

Object.entries(thresholds).forEach(([type, threshold]) => {
  window.__rangesdk__.performance.setThreshold(type, threshold);
});
```

## 性能监控控制

### 启用/禁用监控

```javascript
// 禁用性能监控（减少开销）
window.__rangesdk__.performance.disable();

// 重新启用性能监控
window.__rangesdk__.performance.enable();
```

### 清除性能数据

```javascript
// 清除所有收集的性能数据
window.__rangesdk__.performance.clearMetrics();

// 手动触发性能数据清理（清理过期数据）
window.__rangesdk__.performance.performCleanup();
```

## 实用示例

### 1. 性能监控仪表板

```javascript
// 创建一个简单的性能监控仪表板
async function showPerformanceDashboard() {
  const overview = await window.__rangesdk__.performance.getFriendlyOverview();
  
  console.group('🚀 Range SDK 性能监控');
  
  // 内存使用情况
  console.group('💾 内存使用');
  console.table(overview.SDK内存估算);
  console.groupEnd();
  
  // SDK 性能
  console.group('⚡ SDK 性能');
  console.table(overview.SDK性能);
  console.groupEnd();
  
  // 系统资源
  console.group('🖥️ 系统资源');
  console.table(overview.系统资源.页面内存);
  console.groupEnd();
  
  // 详细指标
  console.group('📊 操作性能详情');
  Object.entries(overview.详细指标).forEach(([name, stats]) => {
    if (stats.执行次数 > 0) {
      console.log(`${name}: ${stats.平均耗时} (${stats.性能评级})`);
    }
  });
  console.groupEnd();
  
  console.groupEnd();
}

// 运行仪表板
showPerformanceDashboard();
```

### 2. 性能问题诊断

```javascript
// 诊断性能问题
async function diagnosePerformance() {
  const overview = await window.__rangesdk__.performance.getFriendlyOverview();
  const report = window.__rangesdk__.performance.getReport();
  
  const issues = [];
  
  // 检查内存使用
  const memoryUsage = overview.系统资源.页面内存.页面内存使用率;
  const memoryPercent = parseFloat(memoryUsage);
  if (memoryPercent > 90) {
    issues.push(`⚠️ 内存使用率过高: ${memoryUsage}`);
  }
  
  // 检查慢操作
  if (report.summary.slowestOperation.duration > 500) {
    issues.push(`⚠️ 存在慢操作: ${report.summary.slowestOperation.type} (${report.summary.slowestOperation.duration.toFixed(0)}ms)`);
  }
  
  // 检查错误率
  if (report.summary.errorRate > 5) {
    issues.push(`⚠️ 错误率偏高: ${report.summary.errorRate.toFixed(1)}%`);
  }
  
  // 检查性能警告
  if (report.warnings.length > 10) {
    issues.push(`⚠️ 性能警告过多: ${report.warnings.length} 个`);
  }
  
  if (issues.length > 0) {
    console.warn('发现性能问题:');
    issues.forEach(issue => console.warn(issue));
  } else {
    console.log('✅ 性能状况良好');
  }
  
  return issues;
}

// 运行诊断
diagnosePerformance();
```

### 3. 性能监控定时报告

```javascript
// 每分钟输出一次性能报告
function startPerformanceReporting(interval = 60000) {
  const reportInterval = setInterval(async () => {
    const overview = await window.__rangesdk__.performance.getFriendlyOverview();
    
    console.log(`[${new Date().toLocaleTimeString()}] 性能快照:`, {
      内存占用: overview.SDK内存估算.预估总占用,
      总操作数: overview.SDK性能.总操作数,
      平均响应: overview.SDK性能.平均响应时间,
      错误率: overview.SDK性能.错误率
    });
  }, interval);
  
  // 返回停止函数
  return () => clearInterval(reportInterval);
}

// 开始监控
const stopReporting = startPerformanceReporting();

// 停止监控
// stopReporting();
```

## 性能优化建议

基于性能监控数据，你可以：

1. **识别性能瓶颈** - 找出最慢的操作类型
2. **监控内存使用** - 防止内存泄漏
3. **设置合理阈值** - 及时发现性能退化
4. **定期清理数据** - 保持 SDK 轻量运行

## 注意事项

- 性能监控本身也会消耗一定资源，在生产环境可以考虑禁用
- 性能数据会自动清理，超过 1 小时的数据会被删除
- 内存估算是基于算法的近似值，不是精确的内存占用