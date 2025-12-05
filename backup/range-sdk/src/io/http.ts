/**
 * @file HTTP 请求模块
 * @description 使用 @ad-audit/orz-ui-next 提供的 axios 实例
 */

import { useAxios, useInitAxios } from '@ad-audit/orz-ui-next';

// 初始化 axios
useInitAxios();

// 获取 axios 实例
const { axios } = useAxios();

// HTTP 客户端
export const http = {
  get: async <T = any>(url: string, params?: any): Promise<T> => {
    const response = await axios.get(url, { params });
    return response.data;
  },
  
  post: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await axios.post(url, data);
    return response.data;
  }
};

export default http;