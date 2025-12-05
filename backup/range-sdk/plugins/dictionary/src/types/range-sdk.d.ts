/**
 * @file range-sdk 类型声明
 * @description 声明 range-sdk 模块的类型
 */

declare module '@ad-audit/range-sdk/src/io' {
  export interface HttpClient {
    get<T = any>(url: string, params?: any): Promise<T>;
    post<T = any>(url: string, data?: any): Promise<T>;
  }
  
  export const http: HttpClient;
}

declare global {
  interface Window {
    __rangesdk__?: any;
    TEA?: any;
  }
}