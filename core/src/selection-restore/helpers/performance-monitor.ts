/**
 * 性能监控器
 * 用于监控和分析事件处理性能
 */

import { logWarn, logInfo } from '../debug/logger';

export interface PerformanceStats {
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  count: number;
  slowCount: number; // 超过16ms的次数
}

/**
 * 性能监控类
 */
export class PerformanceMonitor {
  private samples: number[] = [];
  private maxSamples = 1000; // 最多保留1000个样本
  private slowThreshold = 16; // 16ms = 1帧时间
  private enabled = true;

  constructor(options: { enabled?: boolean; slowThreshold?: number } = {}) {
    this.enabled = options.enabled ?? true;
    this.slowThreshold = options.slowThreshold ?? 16;
  }

  /**
   * 测量函数执行时间
   */
  measure<T extends (...args: any[]) => any>(
    name: string,
    fn: T,
  ): T {
    if (!this.enabled) return fn;

    return ((...args: Parameters<T>) => {
      const start = performance.now();
      try {
        const result = fn(...args);
        const duration = performance.now() - start;
        this.recordSample(name, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        this.recordSample(name, duration);
        throw error;
      }
    }) as T;
  }

  /**
   * 记录样本
   */
  private recordSample(name: string, duration: number): void {
    this.samples.push(duration);

    // 保持样本数量在限制内
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    // 警告慢操作
    if (duration > this.slowThreshold) {
      logWarn('performance', `慢操作检测: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
        threshold: `${this.slowThreshold}ms`,
      });
    }

    // 每100个样本输出一次统计
    if (this.samples.length % 100 === 0) {
      const stats = this.getStats();
      logInfo('performance', `性能统计: ${name}`, {
        samples: this.samples.length,
        avgDuration: `${stats.avgDuration.toFixed(2)}ms`,
        maxDuration: `${stats.maxDuration.toFixed(2)}ms`,
        slowRate: `${((stats.slowCount / stats.count) * 100).toFixed(1)}%`,
      });
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): PerformanceStats {
    if (this.samples.length === 0) {
      return {
        avgDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        count: 0,
        slowCount: 0,
      };
    }

    const sum = this.samples.reduce((a, b) => a + b, 0);
    const slowCount = this.samples.filter(d => d > this.slowThreshold).length;

    return {
      avgDuration: sum / this.samples.length,
      maxDuration: Math.max(...this.samples),
      minDuration: Math.min(...this.samples),
      count: this.samples.length,
      slowCount,
    };
  }

  /**
   * 重置统计
   */
  reset(): void {
    this.samples = [];
  }

  /**
   * 启用/禁用监控
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}
