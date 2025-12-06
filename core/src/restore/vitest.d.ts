/// <reference types="vitest" />

declare module 'vitest' {
  export * from '@vitest/runner';
  export const expect: any;
}

// 扩展自定义匹配器类型
interface CustomMatchers<R = unknown> {
  toBeWithinRange(floor: number, ceiling: number): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
