/**
 * 内存诊断工具
 */
export class MemoryDiagnostic {
  /**
   * 分析内存使用情况
   */
  static async analyzeMemory() {
    const analysis: any = {
      timestamp: new Date().toISOString(),
      heap: {},
      dom: {},
      eventListeners: {},
      globalVariables: {},
      rangeSDK: {}
    };

    // 获取堆内存信息
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      analysis.heap = {
        usedJSHeapSize: this.formatBytes(memory.usedJSHeapSize),
        totalJSHeapSize: this.formatBytes(memory.totalJSHeapSize),
        jsHeapSizeLimit: this.formatBytes(memory.jsHeapSizeLimit),
        usage: ((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100).toFixed(1) + '%'
      };
    }

    // 分析 DOM 节点
    analysis.dom = {
      totalNodes: document.getElementsByTagName('*').length,
      images: document.images.length,
      scripts: document.scripts.length,
      stylesheets: document.styleSheets.length,
      iframes: document.getElementsByTagName('iframe').length
    };

    // 检查事件监听器（需要 Chrome DevTools）
    analysis.eventListeners = {
      warning: '需要在 Chrome DevTools 中使用 getEventListeners() 分析'
    };

    // 检查全局变量
    const globalKeys = Object.keys(window);
    const suspiciousGlobals = globalKeys.filter(key => {
      // 过滤掉标准的全局变量
      const standardGlobals = ['console', 'document', 'window', 'navigator', 'location'];
      return !standardGlobals.includes(key) && 
             !key.startsWith('webkit') && 
             !key.startsWith('on') &&
             key.toLowerCase().includes('sdk');
    });
    analysis.globalVariables = {
      total: globalKeys.length,
      suspicious: suspiciousGlobals
    };

    // 分析 RangeSDK 相关
    if ((window as any).__rangesdk__) {
      const sdk = (window as any).__rangesdk__;
      analysis.rangeSDK = {
        instances: this.countSDKInstances(),
        plugins: sdk.plugins ? Object.keys(sdk.plugins).length : 0,
        performance: await sdk.performance?.getFriendlyOverview()
      };
    }

    // 检查可能的内存泄漏源
    analysis.potentialLeaks = this.detectPotentialLeaks();

    return analysis;
  }

  /**
   * 统计 SDK 实例数量
   */
  private static countSDKInstances(): number {
    let count = 0;
    const checked = new WeakSet();
    
    function countObject(obj: any): void {
      if (!obj || typeof obj !== 'object' || checked.has(obj)) return;
      checked.add(obj);
      
      if (obj.constructor?.name === 'RangeSDK') {
        count++;
      }
      
      Object.values(obj).forEach(value => {
        if (typeof value === 'object' && value !== null) {
          countObject(value);
        }
      });
    }
    
    // 检查全局变量
    Object.values(window).forEach(value => {
      if (typeof value === 'object' && value !== null) {
        countObject(value);
      }
    });
    
    return count;
  }

  /**
   * 检测潜在的内存泄漏
   */
  private static detectPotentialLeaks(): any {
    const leaks: any = {
      detachedNodes: 0,
      largeArrays: [],
      largeObjects: [],
      timers: {
        intervals: 0,
        timeouts: 0
      }
    };

    // 检查大型数组和对象
    const checkObject = (obj: any, path: string, depth: number = 0) => {
      if (depth > 3 || !obj || typeof obj !== 'object') return;
      
      if (Array.isArray(obj) && obj.length > 1000) {
        leaks.largeArrays.push({
          path,
          length: obj.length
        });
      } else if (obj && typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length > 100) {
          leaks.largeObjects.push({
            path,
            keys: keys.length
          });
        }
      }
    };

    // 检查全局对象
    Object.entries(window).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        checkObject(value, `window.${key}`);
      }
    });

    return leaks;
  }

  /**
   * 格式化字节数
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 执行垃圾回收（需要开启 --expose-gc 标志）
   */
  static forceGC(): void {
    if ((window as any).gc) {
      console.log('执行垃圾回收...');
      (window as any).gc();
      console.log('垃圾回收完成');
    } else {
      console.warn('垃圾回收不可用。在 Chrome 中使用 --js-flags="--expose-gc" 启动');
    }
  }

  /**
   * 生成内存快照建议
   */
  static getMemoryRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    
    // 基于分析结果提供建议
    if (analysis.heap && parseFloat(analysis.heap.usage) > 80) {
      recommendations.push('内存使用率过高，建议检查内存泄漏');
    }
    
    if (analysis.dom.totalNodes > 1500) {
      recommendations.push(`DOM 节点过多 (${analysis.dom.totalNodes})，建议优化页面结构`);
    }
    
    if (analysis.globalVariables.suspicious.length > 10) {
      recommendations.push('全局变量过多，可能存在内存泄漏');
    }
    
    analysis.potentialLeaks.largeArrays.forEach((arr: any) => {
      recommendations.push(`发现大型数组: ${arr.path} (长度: ${arr.length})`);
    });
    
    return recommendations;
  }
}

// 导出便捷函数
export async function diagnoseMemory() {
  const analysis = await MemoryDiagnostic.analyzeMemory();
  const recommendations = MemoryDiagnostic.getMemoryRecommendations(analysis);
  
  console.group('🔍 内存诊断报告');
  console.log('分析结果:', analysis);
  console.log('建议:', recommendations);
  console.groupEnd();
  
  return { analysis, recommendations };
}