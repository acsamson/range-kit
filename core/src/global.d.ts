import type { RangeSDK } from './core/range-sdk-with-plugins'
import type { IPerformanceMonitor } from './core/performance-monitor'

export declare global {
  interface Window {
    __rangesdk__?: RangeSDK & {
      performance?: IPerformanceMonitor;
    } & Record<string, any>;
  }

  // CSS Highlight API type definitions
  // 浏览器原生 API，但在某些 TS 环境中可能缺失
  class Highlight {
    constructor(...ranges: AbstractRange[]);
    add(range: AbstractRange): void;
    clear(): void;
    delete(range: AbstractRange): boolean;
    entries(): IterableIterator<[AbstractRange, AbstractRange]>;
    forEach(callbackfn: (value: AbstractRange, value2: AbstractRange, set: Highlight) => void, thisArg?: any): void;
    has(range: AbstractRange): boolean;
    keys(): IterableIterator<AbstractRange>;
    values(): IterableIterator<AbstractRange>;
    [Symbol.iterator](): IterableIterator<AbstractRange>;
    readonly size: number;
  }

  namespace CSS {
    const highlights: Map<string, Highlight>;
  }
}