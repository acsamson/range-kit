import Tea from 'byted-tea-sdk';
import type { RangeData } from '../types';
import type { IPerformanceMonitor } from '../core/performance-monitor';
import { TeaEventName } from './constants';

// 埋点地址： https://data.bytedance.net/tea-next/project/31034701/data-manage/origin-events
export const initTea = (): void => {
  window.RANGE_SDK_TEA = Tea;
  Tea.init({
    app_id: 678910,
    channel: 'cn',
    log: false,
    autotrack: { custom: 'tea' },
  });
  Tea.start();

  // 延迟初始化埋点数据存储，确保在window.__rangesdk__创建后
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      if (!(window as any).__rangesdk__) {
        (window as any).__rangesdk__ = {};
      }
      if (!(window as any).__rangesdk__.tea) {
        (window as any).__rangesdk__.tea = [];
        // 延迟创建 tea 数组
      } else {
        // tea 数组已存在
      }
    }
  }, 0);
};

// 埋点数据接口
export interface TeaEventData {
  event_name: string;
  appid: number | string;
  page_url: string;
  selection_type: string;
  plugin_name?: string;
  selection_count: number;
  selection_data: any;
  timestamp: number;
  clicked_selection_id?: string; // 仅用于点击事件
}

// 性能埋点数据接口
export interface TeaPerformanceEventData {
  event_name: string;
  appid: number | string;
  page_url: string;
  plugin_name?: string;
  performance_data: string; // JSON 字符串格式，包含完整的性能信息
  timestamp: number;
}


// Tea 埋点管理器
export class TeaTracker {
  private teaEvents: (TeaEventData | TeaPerformanceEventData)[] = [];

  constructor() {
    // 确保全局存储可用
    if (typeof window !== 'undefined') {
      if (!(window as any).__rangesdk__) {
        (window as any).__rangesdk__ = {};
      }
      if (!(window as any).__rangesdk__.tea) {
        (window as any).__rangesdk__.tea = [];
        // 创建 tea 数组
      } else {
        // tea 数组已存在
      }
    }
  }

  /**
   * 上报选区展示事件
   */
  async trackRangeShow(params: {
    appid: number | string;
    rangeData: RangeData;
    pluginName?: string;
    selectionCount: number;
    performanceMonitor?: IPerformanceMonitor;
    additionalData?: { [key: string]: any }; // 额外的数据字段
  }) {
    const eventData = await this.buildEventData({
      eventName: TeaEventName.RANGE_SDK_SHOW,
      ...params
    });

    this.sendEvent(eventData);

    // 同时上报性能埋点（如果有性能监控器）
    if (params.performanceMonitor) {
      await this.trackPerformance({
        appid: params.appid,
        pluginName: params.pluginName,
        performanceMonitor: params.performanceMonitor
      });
    }
  }

  /**
   * 上报性能埋点
   */
  async trackPerformance(params: {
    appid: number | string;
    pluginName?: string;
    performanceMonitor: IPerformanceMonitor;
  }) {
    try {
      // 获取性能数据
      const basicReport = params.performanceMonitor.getReport();
      
      // 获取内存信息
      const memoryInfo = (performance as any)?.memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;

      // 获取更详细的性能数据
      const performanceData = JSON.stringify({
        // 基础性能报告
        summary: basicReport.summary,
        warnings: basicReport.warnings,
        duration: basicReport.duration,
        
        // SDK 内存信息
        memory: memoryInfo,
        
        // 运行时信息
        runtime: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        },
        
        // 页面性能信息
        pagePerformance: performance.getEntriesByType('navigation')[0] || null,
        
        // 时间戳信息
        timestamps: {
          report_generated: Date.now(),
          performance_now: performance.now(),
          sdk_init_time: (window as any).__rangesdk__?.initTime || null
        }
      });

      const performanceEventData: TeaPerformanceEventData = {
        event_name: TeaEventName.RANGE_SDK_PERFORMANCE,
        appid: params.appid,
        page_url: window.location.href,
        plugin_name: params.pluginName,
        performance_data: performanceData,
        timestamp: Date.now()
      };

      this.sendPerformanceEvent(performanceEventData);

      // 异步获取详细数据（不等待）
      params.performanceMonitor.getFriendlyOverview().then(() => {
        console.log('[RANGE_SDK][TEA] 性能监控完成');
      }).catch(error => {
        console.warn('[RANGE_SDK][TEA] 获取性能数据失败:', error);
      });
    } catch (error) {
      console.error('[RANGE_SDK][TEA] 性能埋点上报失败:', error);
    }
  }

  /**
   * 上报选区点击事件
   */
  async trackRangeClick(params: {
    appid: number | string;
    rangeData: RangeData;
    clickedSelectionId: string;
    pluginName?: string;
    selectionCount: number;
    performanceMonitor?: IPerformanceMonitor;
    additionalData?: { [key: string]: any }; // 额外的数据字段
  }) {
    const eventData = await this.buildEventData({
      eventName: TeaEventName.RANGE_SDK_CLICK,
      ...params
    });

    this.sendEvent(eventData);
  }

  /**
   * 构建埋点数据
   */
  private async buildEventData(params: {
    eventName: string;
    appid: number | string;
    rangeData: RangeData;
    pluginName?: string;
    selectionCount: number;
    clickedSelectionId?: string;
    additionalData?: { [key: string]: any };
  }): Promise<TeaEventData> {
    const {
      eventName,
      appid,
      rangeData,
      pluginName,
      selectionCount,
      clickedSelectionId,
      additionalData
    } = params;

    // 性能数据已移到独立的性能埋点中，这里不再处理

    // 确定选区类型
    let selectionType = 'text_selection';
    if (pluginName) {
      selectionType = `plugin_${pluginName}`;
    }

    const eventData: TeaEventData = {
      event_name: eventName,
      appid,
      page_url: window.location.href,
      selection_type: selectionType,
      plugin_name: pluginName,
      selection_count: selectionCount,
      selection_data: {
        id: rangeData.id,
        selectedText: rangeData.selectedText,
        startContainerPath: rangeData.startContainerPath,
        startOffset: rangeData.startOffset,
        endContainerPath: rangeData.endContainerPath,
        endOffset: rangeData.endOffset,
        pageUrl: rangeData.pageUrl,
        timestamp: rangeData.timestamp,
        rect: rangeData.rect,
        contextBefore: rangeData.contextBefore,
        contextAfter: rangeData.contextAfter,
        // 添加额外数据
        ...(additionalData || {})
      },
      timestamp: Date.now()
    };

    // 性能数据已移到独立的性能埋点中

    // 如果是点击事件，添加点击的选区ID
    if (clickedSelectionId) {
      eventData.clicked_selection_id = clickedSelectionId;
    }

    return eventData;
  }

  /**
   * 发送埋点事件
   */
  private sendEvent(eventData: TeaEventData) {
    try {
      // 准备发送埋点事件

      // 检查Tea是否可用
      if (typeof window !== 'undefined' && window.RANGE_SDK_TEA) {
        // 发送到 TEA
        window.RANGE_SDK_TEA.event(eventData.event_name, eventData);
        console.log(`[RANGE_SDK][TEA] 事件已发送: ${eventData.event_name}`);
      } else {
        console.warn('[RANGE_SDK][TEA] Tea SDK 不可用');
      }

      // 存储到内部数组
      this.teaEvents.push(eventData);
      // 已存储到内部数组

      // 确保全局存储存在并存储
      if (typeof window !== 'undefined') {
        if (!(window as any).__rangesdk__) {
          // 创建 window.__rangesdk__
          (window as any).__rangesdk__ = {};
        }
        if (!(window as any).__rangesdk__.tea) {
          // 创建 window.__rangesdk__.tea 数组
          (window as any).__rangesdk__.tea = [];
        }
        (window as any).__rangesdk__.tea.push(eventData);
        // 已存储到全局数组
      }

    } catch (error) {
      console.error('[RANGE_SDK][TEA] 发送事件失败:', error);
    }
  }

  /**
   * 发送性能埋点事件
   */
  private sendPerformanceEvent(eventData: TeaPerformanceEventData) {
    try {
      // 准备发送性能埋点事件

      // 检查Tea是否可用
      if (typeof window !== 'undefined' && window.RANGE_SDK_TEA) {
        // 发送到 TEA
        window.RANGE_SDK_TEA.event(eventData.event_name, eventData);
        console.log(`[RANGE_SDK][TEA] 性能事件已发送: ${eventData.event_name}`);
      } else {
        console.warn('[RANGE_SDK][TEA] Tea SDK 不可用');
      }

      // 存储到内部数组
      this.teaEvents.push(eventData);
      // 已存储性能埋点到内部数组

      // 确保全局存储存在并存储
      if (typeof window !== 'undefined') {
        if (!(window as any).__rangesdk__) {
          // 创建 window.__rangesdk__
          (window as any).__rangesdk__ = {};
        }
        if (!(window as any).__rangesdk__.tea) {
          // 创建 window.__rangesdk__.tea 数组
          (window as any).__rangesdk__.tea = [];
        }
        (window as any).__rangesdk__.tea.push(eventData);
        // 已存储性能埋点到全局数组
      }

    } catch (error) {
      console.error('[RANGE_SDK][TEA] 发送性能事件失败:', error);
    }
  }

  /**
   * 获取所有埋点事件
   */
  getEvents(): (TeaEventData | TeaPerformanceEventData)[] {
    return [...this.teaEvents];
  }

  /**
   * 清空埋点事件
   */
  clearEvents() {
    this.teaEvents = [];
    if (typeof window !== 'undefined' && (window as any).__rangesdk__?.tea) {
      (window as any).__rangesdk__.tea = [];
    }
  }
}

// 全局 TEA 追踪器实例
export const globalTeaTracker = new TeaTracker();