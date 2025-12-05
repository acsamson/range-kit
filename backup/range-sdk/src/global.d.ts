import type { RangeSDK } from './core/range-sdk-with-plugins'
import type { IPerformanceMonitor } from './core/performance-monitor'
import type { TeaEventData } from './tea'
import type Tea from 'byted-tea-sdk';

export declare global {
  interface Window {
    __rangesdk__?: RangeSDK & {
      performance?: IPerformanceMonitor;
      tea?: TeaEventData[];
    } & Record<string, any>;
    RANGE_SDK_TEA?: Tea;
  }

  // CSS Highlight API type definitions
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
