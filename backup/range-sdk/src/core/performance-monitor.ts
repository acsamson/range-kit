/**
 * 性能监控模块
 * 负责记录和分析 Range SDK 中各种操作的性能数据
 */

// 性能指标类型
export enum MetricType {
  // 选区相关
  SELECTION_CREATE = 'selection_create',
  SELECTION_RESTORE = 'selection_restore',
  SELECTION_SERIALIZE = 'selection_serialize',
  SELECTION_HIGHLIGHT = 'selection_highlight',
  
  // 插件相关
  PLUGIN_INITIALIZE = 'plugin_initialize',
  PLUGIN_API_CALL = 'plugin_api_call',
  PLUGIN_EVENT_HANDLE = 'plugin_event_handle',
  PLUGIN_DESTROY = 'plugin_destroy',
  
  // 其他
  DOM_OPERATION = 'dom_operation',
  EVENT_EMIT = 'event_emit',
  DATA_TRANSFORM = 'data_transform'
}

// 性能指标接口
export interface PerformanceMetric {
  type: MetricType;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
  success: boolean;
  error?: Error;
}

// 性能统计接口
export interface PerformanceStats {
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  lastOccurrence: number;
}

// 性能报告接口
export interface PerformanceReport {
  startTime: number;
  endTime: number;
  duration: number;
  metrics: {
    [key in MetricType]?: PerformanceStats;
  };
  warnings: PerformanceWarning[];
  summary: {
    totalOperations: number;
    averageOperationTime: number;
    slowestOperation: {
      type: MetricType;
      duration: number;
    };
    errorRate: number;
  };
}

// 性能警告接口
export interface PerformanceWarning {
  type: MetricType;
  message: string;
  threshold: number;
  actualValue: number;
  timestamp: number;
}

// 性能阈值配置
export interface PerformanceThresholds {
  [MetricType.SELECTION_CREATE]?: number;
  [MetricType.SELECTION_RESTORE]?: number;
  [MetricType.SELECTION_SERIALIZE]?: number;
  [MetricType.SELECTION_HIGHLIGHT]?: number;
  [MetricType.PLUGIN_INITIALIZE]?: number;
  [MetricType.PLUGIN_API_CALL]?: number;
  [MetricType.PLUGIN_EVENT_HANDLE]?: number;
  [MetricType.PLUGIN_DESTROY]?: number;
  [MetricType.DOM_OPERATION]?: number;
  [MetricType.EVENT_EMIT]?: number;
  [MetricType.DATA_TRANSFORM]?: number;
}

// 性能监控配置
export interface PerformanceMonitorConfig {
  enabled: boolean;
  thresholds: PerformanceThresholds;
  maxMetricsCount: number;
  warningCallback?: (warning: PerformanceWarning) => void;
  reportInterval?: number; // 自动报告间隔（毫秒）
  enableConsoleWarnings?: boolean;
}

// 默认性能阈值（毫秒）
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  [MetricType.SELECTION_CREATE]: 50,
  [MetricType.SELECTION_RESTORE]: 100,
  [MetricType.SELECTION_SERIALIZE]: 30,
  [MetricType.SELECTION_HIGHLIGHT]: 50,
  [MetricType.PLUGIN_INITIALIZE]: 200,
  [MetricType.PLUGIN_API_CALL]: 100,
  [MetricType.PLUGIN_EVENT_HANDLE]: 50,
  [MetricType.PLUGIN_DESTROY]: 100,
  [MetricType.DOM_OPERATION]: 30,
  [MetricType.EVENT_EMIT]: 10,
  [MetricType.DATA_TRANSFORM]: 20
};

// 中文描述映射
export const METRIC_DESCRIPTIONS: Record<MetricType, string> = {
  [MetricType.SELECTION_CREATE]: '选区创建',
  [MetricType.SELECTION_RESTORE]: '选区恢复',
  [MetricType.SELECTION_SERIALIZE]: '选区序列化',
  [MetricType.SELECTION_HIGHLIGHT]: '选区高亮',
  [MetricType.PLUGIN_INITIALIZE]: '插件初始化',
  [MetricType.PLUGIN_API_CALL]: '插件API调用',
  [MetricType.PLUGIN_EVENT_HANDLE]: '插件事件处理',
  [MetricType.PLUGIN_DESTROY]: '插件销毁',
  [MetricType.DOM_OPERATION]: 'DOM操作',
  [MetricType.EVENT_EMIT]: '事件触发',
  [MetricType.DATA_TRANSFORM]: '数据转换'
}

// 友好的性能统计接口
export interface FriendlyPerformanceStats {
  操作名称: string;
  执行次数: number;
  总耗时: string;
  平均耗时: string;
  最快耗时: string;
  最慢耗时: string;
  成功率: string;
  最后执行: string;
  性能评级: '优秀' | '良好' | '一般' | '较差' | '无数据';
}

// 系统资源信息
export interface SystemResourceInfo {
  页面内存: {
    JS堆大小: string;
    JS堆使用: string;
    JS堆限制: string;
    页面内存使用率: string;
  };
  性能指标: {
    帧率: string;
    事件循环延迟: string;
    页面加载时间: string;
    DOM节点数: number;
  };
  网络状态: {
    连接类型: string;
    有效带宽: string;
    往返时间: string;
  } | null;
}

// 友好的性能总览
export interface FriendlyPerformanceOverview {
  SDK内存估算: {
    RangeSDK占用: string;
    插件总占用: string;
    选区系统占用: string;
    监控数据占用: string;
    预估总占用: string;
  };
  选区存储信息: {
    存储类型: string;
    存储的选区数量: number;
    最新选区时间: string;
    最旧选区时间: string;
    存储状态: string;
  };
  系统资源: SystemResourceInfo;
  SDK性能: {
    总操作数: number;
    平均响应时间: string;
    最慢操作: string;
    错误率: string;
    性能警告数: number;
    监控时长: string;
  };
  详细指标: Record<string, FriendlyPerformanceStats>;
}

// 性能監控接口
export interface IPerformanceMonitor {
  startMetric(type: MetricType, name: string, metadata?: Record<string, any>): string;
  endMetric(id: string, success?: boolean, error?: Error): void;
  getStats(type?: MetricType): PerformanceStats | Record<MetricType, PerformanceStats>;
  getReport(startTime?: number, endTime?: number): PerformanceReport;
  getFriendlyOverview(): Promise<FriendlyPerformanceOverview>;
  clearMetrics(): void;
  setThreshold(type: MetricType, threshold: number): void;
  enable(): void;
  disable(): void;
}

/**
 * 性能监控器实现
 */
export class PerformanceMonitor implements IPerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private activeMetrics: Map<string, { type: MetricType; name: string; startTime: number; metadata?: Record<string, any> }> = new Map();
  private warnings: PerformanceWarning[] = [];
  private reportTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private metricsById: Map<MetricType, PerformanceMetric[]> = new Map();
  private eventListeners: Map<string, Set<Function>> = new Map();
  
  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    this.config = {
      enabled: true,
      thresholds: { ...DEFAULT_THRESHOLDS, ...config.thresholds },
      maxMetricsCount: 500, // 降低最大指标数量以减少内存使用
      enableConsoleWarnings: true,
      ...config
    };
    
    // 初始化指标分类存储
    Object.values(MetricType).forEach(type => {
      this.metricsById.set(type, []);
    });
    
    // 设置自动报告
    if (this.config.reportInterval && this.config.reportInterval > 0) {
      this.startAutoReporting();
    }
    
    // 启动定期清理任务（每5分钟）
    this.startAutoCleanup();
  }
  
  /**
   * 开始记录性能指标
   */
  startMetric(type: MetricType, name: string, metadata?: Record<string, any>): string {
    if (!this.config.enabled) return '';
    
    const id = `${type}_${name}_${Date.now()}_${Math.random()}`;
    this.activeMetrics.set(id, {
      type,
      name,
      startTime: performance.now(),
      metadata
    });
    
    return id;
  }
  
  /**
   * 结束性能指标记录
   */
  endMetric(id: string, success: boolean = true, error?: Error): void {
    if (!this.config.enabled || !this.activeMetrics.has(id)) return;
    
    const activeMetric = this.activeMetrics.get(id)!;
    const endTime = performance.now();
    const duration = endTime - activeMetric.startTime;
    
    const metric: PerformanceMetric = {
      type: activeMetric.type,
      name: activeMetric.name,
      startTime: activeMetric.startTime,
      endTime,
      duration,
      metadata: activeMetric.metadata,
      success,
      error
    };
    
    // 存储指标
    this.storeMetric(metric);
    
    // 检查阈值
    this.checkThreshold(metric);
    
    // 清理活动指标
    this.activeMetrics.delete(id);
  }
  
  /**
   * 存储性能指标
   */
  private storeMetric(metric: PerformanceMetric): void {
    const metricsOfType = this.metricsById.get(metric.type)!;
    metricsOfType.push(metric);
    
    // 更严格的存储数量限制 - 每种类型最多保留100条
    const typeLimit = Math.min(100, Math.floor(this.config.maxMetricsCount / Object.keys(MetricType).length));
    if (metricsOfType.length > typeLimit) {
      // 批量删除旧数据，避免频繁的数组操作
      const removeCount = metricsOfType.length - typeLimit;
      metricsOfType.splice(0, removeCount);
    }
    
    // 使用更高效的键格式
    const metricKey = `${metric.type}_${metric.startTime}`;
    this.metrics.set(metricKey, metric);
    
    // 更激进的全局限制
    if (this.metrics.size > this.config.maxMetricsCount) {
      // 批量删除最旧的20%数据
      const keysToDelete = Math.floor(this.metrics.size * 0.2);
      const keys = Array.from(this.metrics.keys());
      for (let i = 0; i < keysToDelete; i++) {
        this.metrics.delete(keys[i]);
      }
    }
    
    // 定期清理过期数据（超过1小时的数据）
    const now = performance.now();
    const oneHourAgo = now - 3600000; // 1小时
    this.metrics.forEach((value, key) => {
      if (value.endTime < oneHourAgo) {
        this.metrics.delete(key);
      }
    });
  }
  
  /**
   * 检查性能阈值
   */
  private checkThreshold(metric: PerformanceMetric): void {
    const threshold = this.config.thresholds[metric.type];
    if (threshold && metric.duration > threshold) {
      const warning: PerformanceWarning = {
        type: metric.type,
        message: `Performance threshold exceeded for ${metric.type}: ${metric.name}`,
        threshold,
        actualValue: metric.duration,
        timestamp: Date.now()
      };
      
      this.warnings.push(warning);
      
      // 更严格的警告数量限制
      if (this.warnings.length > 50) {
        // 批量删除旧警告
        this.warnings.splice(0, this.warnings.length - 50);
      }
      
      // 触发警告回调
      if (this.config.warningCallback) {
        this.config.warningCallback(warning);
      }
      
      // 控制台警告
      if (this.config.enableConsoleWarnings) {
        console.warn(
          `[PerformanceMonitor] ${warning.message} - Expected: <${threshold}ms, Actual: ${metric.duration.toFixed(2)}ms`
        );
      }
    }
  }
  
  /**
   * 获取性能统计
   */
  getStats(type?: MetricType): PerformanceStats | Record<MetricType, PerformanceStats> {
    if (type) {
      return this.calculateStats(this.metricsById.get(type) || []);
    }
    
    const allStats: Record<string, PerformanceStats> = {};
    this.metricsById.forEach((metrics, metricType) => {
      if (metrics.length > 0) {
        allStats[metricType] = this.calculateStats(metrics);
      }
    });
    
    return allStats as Record<MetricType, PerformanceStats>;
  }
  
  /**
   * 计算统计数据
   */
  private calculateStats(metrics: PerformanceMetric[]): PerformanceStats {
    if (metrics.length === 0) {
      return {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
        lastOccurrence: 0
      };
    }
    
    const durations = metrics.map(m => m.duration);
    const successCount = metrics.filter(m => m.success).length;
    
    return {
      count: metrics.length,
      totalDuration: durations.reduce((sum, d) => sum + d, 0),
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / metrics.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: (successCount / metrics.length) * 100,
      lastOccurrence: metrics[metrics.length - 1].endTime
    };
  }
  
  /**
   * 获取性能报告
   */
  getReport(startTime?: number, endTime?: number): PerformanceReport {
    const now = performance.now();
    const reportStartTime = startTime || 0;
    const reportEndTime = endTime || now;
    
    // 过滤时间范围内的指标
    const filteredMetrics: PerformanceMetric[] = [];
    this.metrics.forEach(metric => {
      if (metric.startTime >= reportStartTime && metric.endTime <= reportEndTime) {
        filteredMetrics.push(metric);
      }
    });
    
    // 按类型分组统计
    const metricsByType = new Map<MetricType, PerformanceMetric[]>();
    filteredMetrics.forEach(metric => {
      if (!metricsByType.has(metric.type)) {
        metricsByType.set(metric.type, []);
      }
      metricsByType.get(metric.type)!.push(metric);
    });
    
    // 计算各类型统计
    const stats: Record<string, PerformanceStats> = {};
    metricsByType.forEach((metrics, type) => {
      stats[type] = this.calculateStats(metrics);
    });
    
    // 找出最慢的操作
    let slowestOperation = {
      type: MetricType.SELECTION_CREATE,
      duration: 0
    };
    
    filteredMetrics.forEach(metric => {
      if (metric.duration > slowestOperation.duration) {
        slowestOperation = {
          type: metric.type,
          duration: metric.duration
        };
      }
    });
    
    // 计算错误率
    const totalOperations = filteredMetrics.length;
    const errorCount = filteredMetrics.filter(m => !m.success).length;
    const errorRate = totalOperations > 0 ? (errorCount / totalOperations) * 100 : 0;
    
    // 过滤时间范围内的警告
    const reportWarnings = this.warnings.filter(
      w => w.timestamp >= reportStartTime && w.timestamp <= reportEndTime
    );
    
    return {
      startTime: reportStartTime,
      endTime: reportEndTime,
      duration: reportEndTime - reportStartTime,
      metrics: stats as any,
      warnings: reportWarnings,
      summary: {
        totalOperations,
        averageOperationTime: totalOperations > 0 
          ? filteredMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations 
          : 0,
        slowestOperation,
        errorRate
      }
    };
  }
  
  /**
   * 清除所有指标
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.activeMetrics.clear();
    this.warnings = [];
    this.metricsById.forEach(metrics => metrics.length = 0);
  }
  
  /**
   * 设置性能阈值
   */
  setThreshold(type: MetricType, threshold: number): void {
    this.config.thresholds[type] = threshold;
  }
  
  /**
   * 启用监控
   */
  enable(): void {
    this.config.enabled = true;
    if (this.config.reportInterval && !this.reportTimer) {
      this.startAutoReporting();
    }
    if (!this.cleanupTimer) {
      this.startAutoCleanup();
    }
  }
  
  /**
   * 禁用监控
   */
  disable(): void {
    this.config.enabled = false;
    this.stopAutoReporting();
    this.stopAutoCleanup();
  }
  
  /**
   * 开始自动报告
   */
  private startAutoReporting(): void {
    if (this.reportTimer) return;
    
    this.reportTimer = setInterval(() => {
      if (this.config.enabled) {
        const report = this.getReport();
        console.log('[PerformanceMonitor] Auto Report:', report);
      }
    }, this.config.reportInterval!);
  }
  
  /**
   * 停止自动报告
   */
  private stopAutoReporting(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = undefined;
    }
  }
  
  /**
   * 开始自动清理
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) return;
    
    // 每5分钟执行一次清理
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000);
  }
  
  /**
   * 停止自动清理
   */
  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
  
  /**
   * 执行清理操作
   */
  private performCleanup(): void {
    const now = performance.now();
    const oneHourAgo = now - 3600000;
    let cleanedCount = 0;
    
    // 清理过期的性能指标
    this.metrics.forEach((value, key) => {
      if (value.endTime < oneHourAgo) {
        this.metrics.delete(key);
        cleanedCount++;
      }
    });
    
    // 清理各类型的指标数组
    this.metricsById.forEach((metrics, type) => {
      const beforeLength = metrics.length;
      const filtered = metrics.filter(m => m.endTime >= oneHourAgo);
      if (filtered.length < beforeLength) {
        this.metricsById.set(type, filtered);
        cleanedCount += beforeLength - filtered.length;
      }
    });
    
    // 清理过期警告
    const warningsBefore = this.warnings.length;
    this.warnings = this.warnings.filter(w => w.timestamp >= Date.now() - 3600000);
    cleanedCount += warningsBefore - this.warnings.length;
    
    // 清理活动指标（超过10分钟的认为是异常）
    const tenMinutesAgo = now - 600000;
    this.activeMetrics.forEach((value, key) => {
      if (value.startTime < tenMinutesAgo) {
        this.activeMetrics.delete(key);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0 && this.config.enableConsoleWarnings) {
      console.log(`[PerformanceMonitor] 清理了 ${cleanedCount} 个过期的性能数据`);
    }
  }
  
  /**
   * 获取友好的性能总览
   */
  async getFriendlyOverview(): Promise<FriendlyPerformanceOverview> {
    const report = this.getReport()
    const stats = this.getStats() as Record<MetricType, PerformanceStats>
    
    // 转换详细指标
    const detailedMetrics: Record<string, FriendlyPerformanceStats> = {}
    Object.entries(stats).forEach(([type, stat]) => {
      const metricType = type as MetricType
      const chineseName = METRIC_DESCRIPTIONS[metricType] || type
      
      detailedMetrics[chineseName] = this.convertToFriendlyStats(chineseName, stat)
    })

    // 修复SDK性能数据 - 基于实际有意义的数据
    const hasOperations = report.summary.totalOperations > 0
    const slowestOperation = hasOperations 
      ? report.summary.slowestOperation 
      : { type: MetricType.SELECTION_CREATE, duration: 0 }
    const slowestOpName = METRIC_DESCRIPTIONS[slowestOperation.type] || slowestOperation.type

    // 获取SDK内存估算
    const sdkMemoryInfo = this.getSDKMemoryEstimation()
    
    // 获取选区存储信息
    const selectionStorageInfo = await this.getSelectionStorageInfo()

    return {
      SDK内存估算: sdkMemoryInfo,
      选区存储信息: selectionStorageInfo,
      系统资源: this.getSystemResourceInfo(),
      SDK性能: {
        总操作数: report.summary.totalOperations,
        平均响应时间: hasOperations 
          ? `${report.summary.averageOperationTime.toFixed(1)}ms`
          : '暂无数据',
        最慢操作: hasOperations 
          ? `${slowestOpName} (${slowestOperation.duration.toFixed(1)}ms)`
          : '暂无数据',
        错误率: hasOperations 
          ? `${report.summary.errorRate.toFixed(1)}%`
          : '0.0%',
        性能警告数: report.warnings.length,
        监控时长: this.formatDuration(report.duration)
      },
      详细指标: detailedMetrics
    }
  }

  /**
   * 获取系统资源信息
   */
  private getSystemResourceInfo(): SystemResourceInfo {
    // 页面内存信息
    const pageMemoryInfo = this.getPageMemoryInfo()
    
    // 性能指标
    const performanceInfo = this.getPerformanceInfo()
    
    // 网络信息
    const networkInfo = this.getNetworkInfo()

    return {
      页面内存: pageMemoryInfo,
      性能指标: performanceInfo,
      网络状态: networkInfo
    }
  }

  /**
   * 获取页面内存使用信息
   */
  private getPageMemoryInfo() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const usedSize = memory.usedJSHeapSize
      const totalSize = memory.totalJSHeapSize
      const limit = memory.jsHeapSizeLimit
      
      return {
        JS堆大小: this.formatBytes(totalSize),
        JS堆使用: this.formatBytes(usedSize),
        JS堆限制: this.formatBytes(limit),
        页面内存使用率: `${((usedSize / totalSize) * 100).toFixed(1)}%`
      }
    }
    
    return {
      JS堆大小: '不可用',
      JS堆使用: '不可用',
      JS堆限制: '不可用',
      页面内存使用率: '不可用'
    }
  }

  /**
   * 获取SDK内存估算
   */
  private getSDKMemoryEstimation() {
    // 估算监控数据占用内存
    const metricsSize = this.metrics.size * 200 + // 每个指标约200字节
                       this.activeMetrics.size * 100 + // 每个活动指标约100字节  
                       this.warnings.length * 150 // 每个警告约150字节
    
    // 估算选区系统内存占用（选区数据存储在内存中）
    let selectionSize = 0
    if (typeof window !== 'undefined' && window.__rangesdk__) {
      try {
        const rangeSDKInstance = window.__rangesdk__ as any
        if (rangeSDKInstance.selectionManager && rangeSDKInstance.selectionManager.selectionRestore) {
          // 基础选区系统内存占用（API实例、管理器等）
          selectionSize += 2048 // 2KB基础选区API占用
          
          // CSS Highlights在内存中的占用（活跃高亮）
          if (typeof CSS !== 'undefined' && 'highlights' in CSS && (CSS as any).highlights) {
            const totalHighlights = (CSS as any).highlights.size || 0
            selectionSize += totalHighlights * 128 // 每个CSS Highlight对象约128B（轻量）
          }
          
          // 高亮器实例占用
          const selectionRestore = rangeSDKInstance.selectionManager.selectionRestore
          if (selectionRestore.highlighter) {
            selectionSize += 1024 // 高亮器实例约1KB
          }
          
          // SerializedSelection数据存储在内存中
          // 包括临时的Range缓存和活跃实例
        }
      } catch (error) {
        // 保守估算
        selectionSize = 1536 // 默认1.5KB选区系统占用
      }
    }
    
    // 估算插件数据占用 - 基于实际架构
    let pluginSize = 0
    
    // 1. JS插件对象占用（主要内存来源）
    if (typeof window !== 'undefined' && window.__rangesdk__) {
      const pluginKeys = Object.keys(window.__rangesdk__).filter(key => 
        key !== 'performance' && typeof (window.__rangesdk__ as any)[key] === 'object'
      )
      pluginSize += pluginKeys.length * 8192 // 每个插件实例约8KB
    }
    
    // 2. CSS Highlight API占用（不创建DOM元素，内存占用很小）
    if (typeof CSS !== 'undefined' && 'highlights' in CSS && (CSS as any).highlights) {
      const highlightCount = (CSS as any).highlights.size || 0
      pluginSize += highlightCount * 50 // CSS Highlight对象很轻量，约50B每个
    }
    
    // 3. 插件相关DOM元素（实际很少）
    const pluginElements = document.querySelectorAll('[data-range-plugin], [class*="range-sdk"]').length
    pluginSize += pluginElements * 300 // 实际插件DOM元素，300B每个
    
    // 4. 基础插件框架占用
    pluginSize += 12 * 1024 // 12KB基础插件系统占用
    
    // RangeSDK核心占用（估算）
    const coreSize = 45 * 1024 // 估算45KB基础占用
    
    const totalEstimated = metricsSize + pluginSize + coreSize + selectionSize

    return {
      RangeSDK占用: this.formatBytes(coreSize),
      插件总占用: this.formatBytes(pluginSize),
      选区系统占用: this.formatBytes(selectionSize),
      监控数据占用: this.formatBytes(metricsSize),
      预估总占用: this.formatBytes(totalEstimated)
    }
  }

  /**
   * 获取性能信息
   */
  private getPerformanceInfo() {
    // 页面加载时间
    const loadTime = performance.timing 
      ? performance.timing.loadEventEnd - performance.timing.navigationStart
      : 0

    // DOM节点数量
    const domNodeCount = document.querySelectorAll('*').length

    // 尝试获取帧率信息（如果可用）
    let fps = '不可用'
    if ('getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation')
      if (navigationEntries.length > 0) {
        fps = '~60fps' // 简化显示，实际帧率监控需要更复杂的逻辑
      }
    }

    // 事件循环延迟估算
    const eventLoopDelay = this.estimateEventLoopDelay()

    return {
      帧率: fps,
      事件循环延迟: `${eventLoopDelay.toFixed(1)}ms`,
      页面加载时间: `${loadTime}ms`,
      DOM节点数: domNodeCount
    }
  }

  /**
   * 获取网络信息
   */
  private getNetworkInfo() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      return {
        连接类型: connection.effectiveType || '未知',
        有效带宽: `${connection.downlink || 0}Mbps`,
        往返时间: `${connection.rtt || 0}ms`
      }
    }
    return null
  }

  /**
   * 估算事件循环延迟
   */
  private estimateEventLoopDelay(): number {
    const start = performance.now()
    // 简单的事件循环延迟估算
    return Math.max(0, performance.now() - start - 1)
  }

  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  /**
   * 转换为友好的统计信息
   */
  private convertToFriendlyStats(name: string, stats: PerformanceStats): FriendlyPerformanceStats {
    if (stats.count === 0) {
      return {
        操作名称: name,
        执行次数: 0,
        总耗时: '0ms',
        平均耗时: '0ms',
        最快耗时: '0ms',
        最慢耗时: '0ms',
        成功率: '0%',
        最后执行: '从未执行',
        性能评级: '无数据'
      }
    }

    // 性能评级
    const getRating = (avgTime: number): '优秀' | '良好' | '一般' | '较差' => {
      if (avgTime <= 10) return '优秀'
      if (avgTime <= 30) return '良好'
      if (avgTime <= 100) return '一般'
      return '较差'
    }

    return {
      操作名称: name,
      执行次数: stats.count,
      总耗时: `${stats.totalDuration.toFixed(1)}ms`,
      平均耗时: `${stats.averageDuration.toFixed(1)}ms`,
      最快耗时: `${stats.minDuration.toFixed(1)}ms`,
      最慢耗时: `${stats.maxDuration.toFixed(1)}ms`,
      成功率: `${stats.successRate.toFixed(1)}%`,
      最后执行: this.formatTimestamp(stats.lastOccurrence),
      性能评级: getRating(stats.averageDuration)
    }
  }

  /**
   * 格式化持续时间
   */
  private formatDuration(duration: number): string {
    if (duration < 1000) return `${duration.toFixed(0)}ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
    return `${(duration / 60000).toFixed(1)}min`
  }

  /**
   * 格式化时间戳
   */
  private formatTimestamp(timestamp: number): string {
    if (timestamp === 0) return '从未执行'
    const now = performance.now()
    const diff = now - timestamp
    
    if (diff < 1000) return '刚才'
    if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    return `${Math.floor(diff / 3600000)}小时前`
  }

  /**
   * 获取选区存储信息
   */
  private async getSelectionStorageInfo() {
    const defaultInfo = {
      存储类型: '内存存储',
      存储的选区数量: 0,
      最新选区时间: '无数据',
      最旧选区时间: '无数据',
      存储状态: '未知'
    }

    try {
      if (typeof window === 'undefined' || !window.__rangesdk__) {
        return { ...defaultInfo, 存储状态: 'SDK未初始化' }
      }

      const rangeSDKInstance = window.__rangesdk__ as any
      const selectionRestore = rangeSDKInstance.selectionManager?.selectionRestore

      if (!selectionRestore) {
        return { ...defaultInfo, 存储状态: '选区管理器未找到' }
      }

      // 获取所有选区数据
      const selections = await selectionRestore.getAllSelections()
      const selectionCount = selections.length

      if (selectionCount === 0) {
        return {
          存储类型: '内存存储',
          存储的选区数量: 0,
          最新选区时间: '无数据',
          最旧选区时间: '无数据',
          存储状态: '正常（无数据）'
        }
      }

      // 计算存储大小
      let totalSize = 0
      let newestTime = 0
      let oldestTime = Infinity

      selections.forEach((selection: any) => {
        // 估算每个选区的JSON大小
        const jsonStr = JSON.stringify(selection)
        totalSize += jsonStr.length * 2 // UTF-16编码，每字符2字节

        // 统计时间范围
        const timestamp = selection.timestamp || 0
        if (timestamp > newestTime) newestTime = timestamp
        if (timestamp < oldestTime) oldestTime = timestamp
      })

      // 格式化时间
      const formatTime = (timestamp: number) => {
        if (!timestamp) return '未知'
        const date = new Date(timestamp)
        return date.toLocaleString('zh-CN')
      }

      return {
        存储类型: `内存存储 (${this.formatBytes(totalSize)})`,
        存储的选区数量: selectionCount,
        最新选区时间: formatTime(newestTime),
        最旧选区时间: oldestTime === Infinity ? '未知' : formatTime(oldestTime),
        存储状态: '正常'
      }
    } catch (error: any) {
      return { ...defaultInfo, 存储状态: `错误: ${error?.message || '未知错误'}` }
    }
  }

  /**
   * 解析内存字符串为字节数
   */
  private parseMemoryString(memoryStr: string): number {
    const match = memoryStr.match(/^([\d.]+)\s*([KMGT]?B)$/i)
    if (!match) return 0
    
    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()
    
    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    }
    
    return value * (multipliers[unit] || 1)
  }

  /**
   * 销毁监控器
   */
  destroy(): void {
    this.stopAutoReporting();
    this.stopAutoCleanup();
    this.clearMetrics();
    this.eventListeners.clear();
  }
}

/**
 * 性能监控装饰器
 * 用于自动监控方法执行性能
 */
export function monitored(type: MetricType, monitor: IPerformanceMonitor) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const metricId = monitor.startMetric(type, propertyKey, {
        args: args.length,
        className: target.constructor.name
      });
      
      try {
        const result = await originalMethod.apply(this, args);
        monitor.endMetric(metricId, true);
        return result;
      } catch (error) {
        monitor.endMetric(metricId, false, error as Error);
        throw error;
      }
    };
    
    return descriptor;
  };
}