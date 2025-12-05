import { TeaEventName } from './constants';

// 埋点地址： https://data.bytedance.net/tea-next/project/31034701/data-manage/origin-events
export const sendTeaEvent = (eventName: TeaEventName, eventData: {
  // 选区信息
  section: Record<string, any>,
  // 事件数据
  data: any
}) => {
  if (!window?.RANGE_SDK_TEA) {
    console.log('[RANGE_SDK][dictionary][TEA] 未初始化');
    return;
  }
  try {
    window?.RANGE_SDK_TEA?.event(eventName, eventData);
  } catch (error) {
    console.log('[RANGE_SDK][dictionary][TEA] 发送事件失败', error);
  }
}