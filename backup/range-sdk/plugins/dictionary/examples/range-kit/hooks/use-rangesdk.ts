import { useDictionary } from '../../../hooks/use-dictionary'
import { nextTick, Ref, watch, defineComponent, h, type Component } from 'vue';
import DictionaryCard from '../components/dictionary-card.vue';

interface IUseRangeSdkOptions {
  data?: Ref<Record<string, any>>;
  containerRef?: Ref<any>; // 使用 any 来避免复杂的 DOM 类型推断问题
  words?: string[];
  appid?: number;
  autoInit?: boolean;
  disableDefaultRequest?: boolean; // 禁用默认请求，使用模拟数据
  // 自定义卡片组件的额外参数
  customCardProps?: Record<string, any>;
}

export const useRangeSdk = (options: IUseRangeSdkOptions) => {
  const {
    data,
    containerRef,
    words = ['测试', '虚假'],
    appid = 5,
    autoInit = true,
    disableDefaultRequest = false,
    customCardProps = {}
  } = options;

  let hasInitDictionary = false;
  let dictionaryHook: any = null;

  // 创建带自定义参数的组件包装器
  const createEnhancedCard = (): Component => {
    // 如果没有自定义参数，直接返回原组件
    if (Object.keys(customCardProps).length === 0) {
      return DictionaryCard;
    }

    // 创建包装组件，确保正确透传所有系统参数
    return defineComponent({
      name: 'EnhancedDictionaryCard',
      emits: ['close'], // 声明事件
      setup(props, { emit, attrs }) {
        console.log('增强组件接收到的props:', props);
        console.log('增强组件接收到的attrs:', attrs);
        console.log('自定义参数:', customCardProps);

        return () => {
          // 构建传递给子组件的props对象
          const baseProps = { ...props, ...attrs };

          // 安全地合并自定义属性
          const mergedProps: Record<string, any> = {
            ...baseProps,
            ...customCardProps
          };

          // 添加事件处理器
          mergedProps.onClose = () => {
            console.log('增强组件关闭事件触发');
            emit('close');
          };

          console.log('传递给DictionaryCard的最终props:', mergedProps);

          // 使用类型断言解决Vue类型问题
          return h(DictionaryCard, mergedProps as any);
        };
      }
    });
  };

  // 获取容器值并进行类型检查的函数
  const getContainerValue = () => {
    const containerValue = containerRef?.value;
    console.log('[useRangeSdk] 获取容器参数:', containerValue, typeof containerValue);

    // 运行时类型验证（可选，用于调试）
    if (containerValue !== null && containerValue !== undefined) {
      if (typeof containerValue !== 'string' && !(containerValue instanceof Element)) {
        console.warn('[useRangeSdk] 容器参数类型可能不正确，但将继续尝试使用:', containerValue);
      }
    }

    return containerValue;
  };

  // 延迟初始化词典功能
  const initDictionaryHook = () => {
    if (dictionaryHook) return dictionaryHook;

    const containerValue = getContainerValue();
    if (!containerValue) {
      throw new Error('[useRangeSdk] 容器元素未准备好，请确保在 DOM 挂载后调用');
    }

    dictionaryHook = useDictionary({
      appid,
      container: containerValue,
      customCardComponent: createEnhancedCard(),
      autoInit: false,
      disableDefaultRequest,
    });

    return dictionaryHook;
  };

  // 手动初始化函数
  const manualInit = async (customWords?: string[]) => {
    if (hasInitDictionary) return;

    try {
      hasInitDictionary = true;
      const wordsToInit = customWords || words;

      await nextTick();

      // 延迟初始化词典 hook
      const hook = initDictionaryHook();
      await hook.initDictionary({
        words: wordsToInit.map(word => ({ word, appid })),
      });
      console.log(`✅ Range SDK 初始化完成，词汇：${wordsToInit.join(', ')}`);
    } catch (error) {
      console.error('词典初始化失败：', error);
      hasInitDictionary = false; // 重置状态以便重试
    }
  };

  // 如果有 data 参数，则监听其变化
  if (data) {
    watch(() => data, val => {
      if (val && containerRef?.value && autoInit && !hasInitDictionary) {
        manualInit();
      }
    }, { immediate: true, deep: true });
  }

  // 返回代理对象，延迟获取词典功能
  const createProxyMethod = (methodName: string) => {
    return (...args: any[]) => {
      if (!dictionaryHook) {
        console.warn(`[useRangeSdk] 尝试调用 ${methodName}，但词典尚未初始化`);
        return;
      }
      return dictionaryHook[methodName](...args);
    };
  };

  return {
    // 代理所有词典方法
    rangeSDK: dictionaryHook?.rangeSDK || { value: null },
    isReady: dictionaryHook?.isReady || { value: false },
    matchedWords: dictionaryHook?.matchedWords || { value: [] },
    initDictionary: createProxyMethod('initDictionary'),
    highlightKeywords: createProxyMethod('highlightKeywords'),
    showDictionary: createProxyMethod('showDictionary'),
    hideDictionary: createProxyMethod('hideDictionary'),
    clearHighlights: createProxyMethod('clearHighlights'),
    // 自定义方法
    manualInit,
    isInitialized: () => hasInitDictionary,
  };
};
