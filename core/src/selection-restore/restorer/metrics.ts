/**
 * ===================================================================
 * 性能统计收集模块
 * ===================================================================
 *
 * 收集四层恢复算法的性能指标，用于分析和优化
 *
 * 使用方法：
 * 1. recordLayerAttempt() - 记录每层的执行结果
 * 2. getMetrics() - 获取当前统计数据
 * 3. getMetricsReport() - 生成可读报告
 * 4. resetMetrics() - 重置统计数据
 */

/** 单层性能指标 */
export interface LayerMetrics {
  /** 尝试次数 */
  attempts: number;
  /** 成功次数 */
  successes: number;
  /** 总耗时（毫秒） */
  totalTime: number;
  /** 平均耗时（毫秒） */
  avgTime: number;
  /** 最短耗时（毫秒） */
  minTime: number;
  /** 最长耗时（毫秒） */
  maxTime: number;
}

/** 整体恢复性能指标 */
export interface RestoreMetrics {
  /** L1 ID锚点恢复层指标 */
  L1: LayerMetrics;
  /** L2 DOM路径恢复层指标 */
  L2: LayerMetrics;
  /** L3 多锚点恢复层指标 */
  L3: LayerMetrics;
  /** L4 结构指纹恢复层指标 */
  L4: LayerMetrics;
  /** 总恢复次数 */
  totalRestores: number;
  /** 总成功次数 */
  totalSuccesses: number;
  /** 总成功率 */
  successRate: number;
  /** 总平均耗时（毫秒） */
  avgRestoreTime: number;
  /** 上次更新时间 */
  lastUpdated: number;
}

/** 层级类型 */
export type LayerType = 'L1' | 'L2' | 'L3' | 'L4';

/** 创建空的层级指标 */
function createEmptyLayerMetrics(): LayerMetrics {
  return {
    attempts: 0,
    successes: 0,
    totalTime: 0,
    avgTime: 0,
    minTime: Infinity,
    maxTime: 0,
  };
}

/** 创建空的整体指标 */
function createEmptyMetrics(): RestoreMetrics {
  return {
    L1: createEmptyLayerMetrics(),
    L2: createEmptyLayerMetrics(),
    L3: createEmptyLayerMetrics(),
    L4: createEmptyLayerMetrics(),
    totalRestores: 0,
    totalSuccesses: 0,
    successRate: 0,
    avgRestoreTime: 0,
    lastUpdated: Date.now(),
  };
}

/** 全局性能指标实例 */
let metrics: RestoreMetrics = createEmptyMetrics();

/** 是否启用性能统计收集 */
let metricsEnabled = false;

/**
 * 启用性能统计收集
 */
export function enableMetrics(): void {
  metricsEnabled = true;
}

/**
 * 禁用性能统计收集
 */
export function disableMetrics(): void {
  metricsEnabled = false;
}

/**
 * 检查性能统计是否启用
 */
export function isMetricsEnabled(): boolean {
  return metricsEnabled;
}

/**
 * 记录层级尝试结果
 *
 * @param layer - 层级类型 ('L1' | 'L2' | 'L3' | 'L4')
 * @param success - 是否成功
 * @param time - 执行耗时（毫秒）
 */
export function recordLayerAttempt(layer: LayerType, success: boolean, time: number): void {
  if (!metricsEnabled) return;

  const layerMetrics = metrics[layer];

  // 更新层级指标
  layerMetrics.attempts++;
  if (success) {
    layerMetrics.successes++;
  }
  layerMetrics.totalTime += time;
  layerMetrics.avgTime = layerMetrics.totalTime / layerMetrics.attempts;
  layerMetrics.minTime = Math.min(layerMetrics.minTime, time);
  layerMetrics.maxTime = Math.max(layerMetrics.maxTime, time);

  metrics.lastUpdated = Date.now();
}

/**
 * 记录完整恢复操作结果
 *
 * @param success - 是否成功
 * @param totalTime - 总耗时（毫秒）
 * @param successLayer - 成功的层级（可选）
 */
export function recordRestoreResult(success: boolean, totalTime: number, successLayer?: LayerType): void {
  if (!metricsEnabled) return;

  metrics.totalRestores++;
  if (success) {
    metrics.totalSuccesses++;
  }

  // 更新整体成功率
  metrics.successRate = metrics.totalRestores > 0
    ? metrics.totalSuccesses / metrics.totalRestores
    : 0;

  // 更新平均恢复时间
  const currentTotalTime = metrics.avgRestoreTime * (metrics.totalRestores - 1) + totalTime;
  metrics.avgRestoreTime = currentTotalTime / metrics.totalRestores;

  metrics.lastUpdated = Date.now();
}

/**
 * 获取当前性能指标
 */
export function getMetrics(): Readonly<RestoreMetrics> {
  return { ...metrics };
}

/**
 * 重置所有性能指标
 */
export function resetMetrics(): void {
  metrics = createEmptyMetrics();
}

/**
 * 生成可读的性能报告
 */
export function getMetricsReport(): string {
  const formatTime = (time: number): string => {
    if (time === Infinity || time === 0) return 'N/A';
    return `${time.toFixed(2)}ms`;
  };

  const formatRate = (rate: number): string => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const formatLayerReport = (name: string, layer: LayerMetrics): string => {
    const successRate = layer.attempts > 0
      ? formatRate(layer.successes / layer.attempts)
      : 'N/A';

    return [
      `  ${name}:`,
      `    尝试次数: ${layer.attempts}`,
      `    成功次数: ${layer.successes}`,
      `    成功率: ${successRate}`,
      `    平均耗时: ${formatTime(layer.avgTime)}`,
      `    最短耗时: ${formatTime(layer.minTime)}`,
      `    最长耗时: ${formatTime(layer.maxTime)}`,
    ].join('\n');
  };

  const report = [
    '===== 选区恢复性能报告 =====',
    '',
    '【整体统计】',
    `  总恢复次数: ${metrics.totalRestores}`,
    `  总成功次数: ${metrics.totalSuccesses}`,
    `  整体成功率: ${formatRate(metrics.successRate)}`,
    `  平均恢复耗时: ${formatTime(metrics.avgRestoreTime)}`,
    '',
    '【各层级统计】',
    formatLayerReport('L1 (ID锚点恢复)', metrics.L1),
    '',
    formatLayerReport('L2 (DOM路径恢复)', metrics.L2),
    '',
    formatLayerReport('L3 (多锚点恢复)', metrics.L3),
    '',
    formatLayerReport('L4 (结构指纹恢复)', metrics.L4),
    '',
    `最后更新: ${new Date(metrics.lastUpdated).toLocaleString()}`,
    '=============================',
  ].join('\n');

  return report;
}

/**
 * 获取层级分布统计
 * 返回各层成功恢复的占比
 */
export function getLayerDistribution(): Record<LayerType, number> {
  const total = metrics.totalSuccesses;
  if (total === 0) {
    return { L1: 0, L2: 0, L3: 0, L4: 0 };
  }

  return {
    L1: metrics.L1.successes / total,
    L2: metrics.L2.successes / total,
    L3: metrics.L3.successes / total,
    L4: metrics.L4.successes / total,
  };
}
