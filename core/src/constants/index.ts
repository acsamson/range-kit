import { RangeSdkAppId } from '../types';

// 重新导出类型
export { RangeSdkAppId } from '../types';

// 应用ID与名称的映射
export const RangeSdkAppIdNameMap = {
  [RangeSdkAppId.COMMON]: '通用',
  [RangeSdkAppId.PMS]: 'PMS',
} as const;
