# 任务 005: 增加性能统计收集

## 优先级
低

## 状态
待开始

## 问题描述
当前只有单次恢复的耗时记录，没有统计分析功能，无法了解各层级的恢复效率和成功率。

## 改造方案

### 新建 `restorer/metrics.ts`
```typescript
/**
 * 选区恢复性能指标收集器
 */

interface LayerMetrics {
  attempts: number;       // 尝试次数
  successes: number;      // 成功次数
  totalTime: number;      // 总耗时(ms)
  avgTime: number;        // 平均耗时(ms)
  minTime: number;        // 最小耗时(ms)
  maxTime: number;        // 最大耗时(ms)
}

interface RestoreMetrics {
  L1: LayerMetrics;
  L2: LayerMetrics;
  L3: LayerMetrics;
  L4: LayerMetrics;
  totalRestores: number;
  overallSuccessRate: number;
  lastUpdated: number;
}

// 初始化空指标
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

// 指标存储
export const metrics: RestoreMetrics = {
  L1: createEmptyLayerMetrics(),
  L2: createEmptyLayerMetrics(),
  L3: createEmptyLayerMetrics(),
  L4: createEmptyLayerMetrics(),
  totalRestores: 0,
  overallSuccessRate: 0,
  lastUpdated: Date.now(),
};

/**
 * 记录层级尝试
 */
export function recordLayerAttempt(
  layer: 1 | 2 | 3 | 4,
  success: boolean,
  timeMs: number
): void {
  const layerKey = `L${layer}` as keyof Pick<RestoreMetrics, 'L1' | 'L2' | 'L3' | 'L4'>;
  const layerMetrics = metrics[layerKey];

  layerMetrics.attempts++;
  layerMetrics.totalTime += timeMs;
  layerMetrics.avgTime = layerMetrics.totalTime / layerMetrics.attempts;
  layerMetrics.minTime = Math.min(layerMetrics.minTime, timeMs);
  layerMetrics.maxTime = Math.max(layerMetrics.maxTime, timeMs);

  if (success) {
    layerMetrics.successes++;
    metrics.totalRestores++;
  }

  // 更新整体成功率
  const totalAttempts = metrics.L1.attempts + metrics.L2.attempts +
                        metrics.L3.attempts + metrics.L4.attempts;
  const totalSuccesses = metrics.L1.successes + metrics.L2.successes +
                         metrics.L3.successes + metrics.L4.successes;
  metrics.overallSuccessRate = totalAttempts > 0 ? totalSuccesses / totalAttempts : 0;
  metrics.lastUpdated = Date.now();
}

/**
 * 生成指标报告
 */
export function getMetricsReport(): string {
  const lines: string[] = [
    '=== 选区恢复性能报告 ===',
    `总恢复次数: ${metrics.totalRestores}`,
    `整体成功率: ${(metrics.overallSuccessRate * 100).toFixed(1)}%`,
    '',
    '--- 各层级统计 ---',
  ];

  ['L1', 'L2', 'L3', 'L4'].forEach((layer) => {
    const m = metrics[layer as keyof Pick<RestoreMetrics, 'L1' | 'L2' | 'L3' | 'L4'>];
    const successRate = m.attempts > 0 ? (m.successes / m.attempts * 100).toFixed(1) : 0;
    lines.push(`${layer}: 尝试${m.attempts}次, 成功${m.successes}次 (${successRate}%), 平均${m.avgTime.toFixed(2)}ms`);
  });

  return lines.join('\n');
}

/**
 * 重置指标
 */
export function resetMetrics(): void {
  metrics.L1 = createEmptyLayerMetrics();
  metrics.L2 = createEmptyLayerMetrics();
  metrics.L3 = createEmptyLayerMetrics();
  metrics.L4 = createEmptyLayerMetrics();
  metrics.totalRestores = 0;
  metrics.overallSuccessRate = 0;
  metrics.lastUpdated = Date.now();
}
```

### 在 `restorer.ts` 中集成
```typescript
import { recordLayerAttempt } from './metrics';

// 在每层尝试后记录
try {
  const layerStart = performance.now();
  const l1Result = restoreByIdAnchors(data, containerConfig);
  const layerTime = performance.now() - layerStart;
  recordLayerAttempt(1, l1Result.success, layerTime);
  // ...
}
```

## 涉及文件
- `src/selection-restore/restorer/metrics.ts` (新建)
- `src/selection-restore/restorer/restorer.ts`
- `src/selection-restore/restorer/index.ts` (导出)

## 验收标准
- [ ] 新建 metrics.ts 模块
- [ ] 在 restorer.ts 中集成指标收集
- [ ] 提供 getMetricsReport() 函数生成报告
- [ ] 生产环境可选禁用（性能考虑）
- [ ] 添加单元测试
