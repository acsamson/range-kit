import { ref, onMounted, onUnmounted, Ref, Component } from 'vue';
import { createRangeSDK } from '@ad-audit/range-sdk';
import {
  createDictionaryPlugin,
  type DictionaryAPI,
  type RangeSDKWithDictionary,
  type DictionaryPluginConfig,
} from '../src/plugin';
import type { HighlightStyle } from '../src/types';
import { RangeSdkAppId } from '@ad-audit/range-sdk';
// 导入词典卡片样式
import '../src/components/dictionary-card.scss';
import { generateMockData } from '../helpers/index';
import { MatchedWords, SimpleWord, WordData } from '../bam-auto-generate/bes.fe.web_core/namespaces/dictionary';

// 事件回调
export interface DictionaryEvents {
  // 高亮完成时
  onHighlightComplete?: (words: string[]) => void;
  // 搜索完成时
  onSearchComplete?: (results: WordData[]) => void;
  // 错误发生时
  onError?: (error: Error) => void;
}

// 自定义组件props接口 - 自定义组件需要接受这些props
export interface CustomCardComponentProps {
  // 关键词列表
  keywords: string[];
  // 数据加载器函数（可选，用于需要加载数据的自定义组件）
  dataLoader?: (keyword: string) => Promise<WordData | null>;
}

// 触发方式类型
export type TriggerMode = 'hover' | 'click';

// 使用 Pick 选择需要暴露的配置项
export interface UseDictionaryOptions extends Pick<
  DictionaryPluginConfig,
  'highlightStyle' | 'mockData'
> {
  // 应用ID (必传)
  appid: RangeSdkAppId | number;
  // 容器元素 (必传) - 支持 null/undefined 以便处理 ref 的情况
  container: Element | HTMLElement | string | null | undefined;
  // 是否自动初始化
  autoInit?: boolean;
  // 使用 mock 模式并指定词汇列表
  useMock?: string[];
  // 事件回调
  events?: DictionaryEvents;
  // 是否启用调试模式
  debug?: boolean;
  // 触发方式 - 控制卡片显示方式：hover(悬停) 或 click(点击)
  triggerMode?: TriggerMode;
  // 是否区分大小写 - 默认为 false，即不区分大小写
  caseSensitive?: boolean;
  // 自定义卡片组件 - 用于替换默认的词典卡片UI
  // 自定义组件需要实现 CustomCardComponentProps 接口
  // 示例: customCardComponent: defineComponent({ ... })
  customCardComponent?: Component;
  // 自定义卡片组件的额外属性 - 会传递给customCardComponent
  // 这些属性将与系统参数（keywords, dataLoader等）合并传递给自定义组件
  customCardComponentProps?: Record<string, any>;
  // 禁用默认的数据请求 - 当设为 true 时，不会发起默认的词典数据请求
  // 自定义组件可以通过 keywords 自行实现数据获取逻辑
  disableDefaultRequest?: boolean;
  // 扩展配置（供未来扩展使用）
  [key: string]: any;
}

export interface UseDictionaryReturn {
  rangeSDK: Ref<RangeSDKWithDictionary<DictionaryAPI> | null>;
  isReady: Ref<boolean>;
  matchedWords: Ref<WordData[]>;
  initDictionary: (options: { content?: string; words?: SimpleWord[] }) => Promise<void>;
  highlightKeywords: (container?: string) => Promise<void>;
  showDictionary: (target: HTMLElement) => void;
  hideDictionary: () => void;
  clearHighlights: () => void;
}

/**
 * 使用新版 RangeSDK 的词典功能
 */
export function useDictionary(options: UseDictionaryOptions): UseDictionaryReturn {
  const {
    container,
    appid,
    autoInit = false,
    mockData,
    useMock,
    highlightStyle,
    events,
    debug = false,
    triggerMode = 'hover',
    caseSensitive = false,
    customCardComponent,
    customCardComponentProps = {},
    disableDefaultRequest = false,
    ...extraOptions
  } = options;

  const rangeSDK = ref<RangeSDKWithDictionary<DictionaryAPI> | null>(null);
  const isReady = ref(false);
  const matchedWords = ref<WordData[]>([]);

  // 确定最终的 mock 数据
  const finalMockData = useMock
    ? generateMockData(appid, useMock)
    : mockData;

  // 获取容器元素
  const getContainer = (): HTMLElement => {
    // 处理 null/undefined 的情况，直接抛出错误
    if (!container) {
      console.error(`[useDictionary] Container is required but got:`, container);
      throw new Error(`Container is required. Please provide a valid DOM element, element selector string, or HTMLElement.`);
    }

    if (typeof container === 'string') {
      const element = document.querySelector(container);
      if (!element) {
        console.error(`[useDictionary] Container element not found: ${container}`);
        throw new Error(`Container element not found: ${container}`);
      }
      console.log(`[useDictionary] Found container element:`, element);
      return element as HTMLElement;
    }

    // 如果是 Element 或 HTMLElement，直接返回
    if (container instanceof Element) {
      console.log(`[useDictionary] Using provided Element:`, container);
      return container as HTMLElement;
    }

    // 如果还是其他类型，抛出错误
    console.error(`[useDictionary] Invalid container type:`, typeof container, container);
    throw new Error(`Invalid container type: ${typeof container}`);
  };

  // 初始化 RangeSDK
  const initSDK = async () => {
    if (rangeSDK.value) return;

    // 获取容器元素并创建 RangeSDK 实例
    const containerElement = getContainer();
    console.log('[useDictionary] 初始化 RangeSDK，容器:', containerElement);
    
    const sdk = createRangeSDK({
      appid,
      container: containerElement,
      debug,
    });

    // 合并默认高亮样式和用户自定义样式
    const defaultHighlightStyle: HighlightStyle = {
      color: '#3370ff',
      borderBottom: '1px dashed #3370ff',
      cursor: 'pointer',
      hoverBackgroundColor: '#e8f0ff',
      hoverBorderBottom: '2px solid #2860e0',
      transition: 'all 0.2s ease',
      padding: '0 2px',
      lineHeight: '1.5',
    };

    // 创建词典插件，设置默认的 searchRequest
    const dictionaryPlugin = createDictionaryPlugin({
      searchRequest: {
        appid: appid as number,
      },
      mockData: finalMockData,
      container: getContainer(),
      highlightStyle: { ...defaultHighlightStyle, ...highlightStyle },
      triggerMode, // 传递触发方式配置
      caseSensitive, // 传递大小写敏感配置
      customCardComponent, // 传递自定义组件
      customCardComponentProps, // 传递自定义组件属性
      disableDefaultRequest, // 传递禁用默认请求选项
      ...extraOptions, // 传递其他扩展配置
    });

    // 注册插件并获得类型安全的 SDK 实例
    await sdk.registerPlugin(dictionaryPlugin);
    rangeSDK.value = sdk as any;

    // 监听选区事件
    rangeSDK.value?.on('range-selected', rangeData => {
      const selectedText = rangeData.selectedText.trim();

      if (selectedText && selectedText.length > 0 && selectedText.length < 50) {
        if (debug) {
          console.log('选中了文本:', selectedText);
        }
      }
    });
  };

  // 解析初始化参数
  const parseInitOptions = (options?: string | { content?: string; words?: SimpleWord[] }) => {
    let content: string | undefined;
    let words: SimpleWord[] | undefined;

    if (typeof options === 'string') {
      content = options;
    } else if (options) {
      content = options.content;
      words = options.words;
    }

    return { content, words };
  };

  // 使用模拟数据搜索（支持content和words）
  const searchWithMock = async (options: { content?: string; words?: string[] }) => {
    const { content, words } = options;
    let targetWords: string[] = [];

    if (words && words.length > 0) {
      // 直接使用传入的词汇列表
      targetWords = words;
    } else if (content && finalMockData) {
      // 从模拟数据中查找匹配的词汇
      const availableWords = Object.keys(finalMockData);
      targetWords = availableWords.filter(word => content.includes(word));
    }

    if (targetWords.length > 0) {
      await rangeSDK.value!.dictionary.search({
        words: targetWords,
        container: getContainer(),
      });

      matchedWords.value = targetWords.map((word, index) => ({
        id: index + 1,
        word,
      }));

      if (debug) {
        console.log('使用模拟数据初始化词典，词汇：', targetWords);
      }
    }
  };

  const searchWordData = async (params: {
    content?: string,
    words?: SimpleWord[],
  }) => {
    const { content, words } = params;
    const result = await rangeSDK.value!.dictionary.search({
      searchConfig: {
        appid: appid as number,
        content: content,
      },
      wordsWithAppid: words,
      container: getContainer(),
    });

    if (result?.matchData && result?.matchData?.length > 0) {
      matchedWords.value = result?.matchData || [];
    }
  };

  const getFilteredWords = () => {
    return matchedWords.value?.filter(m => m.word)?.map(m => m.word || '');
  }

  // 触发事件回调
  const triggerEvents = () => {
    if (events?.onSearchComplete) {
      events.onSearchComplete(matchedWords.value);
    }

    if (events?.onHighlightComplete) {
      events.onHighlightComplete(getFilteredWords());
    }
  };

  // 初始化词典（支持内容搜索或词汇列表搜索）
  const initDictionary = async (options: { content?: string; words?: SimpleWord[] }) => {
    try {
      await initSDK();

      if (!rangeSDK.value?.dictionary) {
        console.error('词典插件未正确初始化');
        return;
      }

      const { content, words } = parseInitOptions(options);

      // 如果禁用了默认请求，生成模拟数据并执行高亮，不发起网络请求
      if (disableDefaultRequest) {
        let targetWords: string[] = [];

        if (words && words.length > 0) {
          targetWords = words.map(item => item.word || item as any);
          matchedWords.value = words.map((word, index) => ({
            id: index + 1,
            word: word.word || word as any,
          }));
        } else if (content && useMock && useMock.length > 0) {
          targetWords = useMock;
          matchedWords.value = useMock.map((word, index) => ({
            id: index + 1,
            word,
          }));
        }

        if (targetWords.length > 0) {
          // 为当前词汇生成模拟数据并动态设置到插件中
          const mockDataForWords = generateMockData(appid as number, targetWords);
          rangeSDK.value.dictionary.setMockData(mockDataForWords);

          // 使用模拟数据执行高亮，不发起网络请求
          await rangeSDK.value.dictionary.search({
            words: targetWords,
            container: getContainer(),
            useMock: true,
          });
        }

        if (debug) {
          console.log('禁用默认请求模式，生成模拟数据并执行高亮：', targetWords);
        }
      } else {
        // 正常的数据请求逻辑
        if (finalMockData) {
          await searchWithMock({ content, words: words?.map(item => item.word) as string[] });
        } else {
          await searchWordData({ content, words });
        }
      }

      isReady.value = true;
      // 可选回调
      triggerEvents();
    } catch (error) {
      console.error('词典初始化失败:', error);

      if (events?.onError) {
        events.onError(error as Error);
      }
    }
  };

  // // 使用词汇列表初始化
  // const initWithWords = async (words: string[]) => {
  //   try {
  //     await initSDK();

  //     if (!rangeSDK.value?.dictionary) {
  //       console.error('词典插件未正确初始化');
  //       return;
  //     }

  //     // 使用词汇列表搜索
  //     await rangeSDK.value.dictionary.search({
  //       words,
  //       container: getContainer(),
  //     });

  //     matchedWords.value = words.map((word, index) => ({
  //       word,
  //       id: index + 1,
  //     }));

  //     isReady.value = true;
  //   } catch (error) {
  //     console.error('词典初始化失败:', error);
  //   }
  // };

  // 高亮关键词 - 使用匹配的词条
  const highlightKeywords = async (targetContainer?: string) => {
    if (!isReady.value || !rangeSDK.value?.dictionary) return;

    // 等待 DOM 更新
    await new Promise(resolve => setTimeout(resolve, 100));

    const containerEl = targetContainer
      ? document.querySelector(targetContainer) as HTMLElement
      : getContainer();

    if (containerEl) {
      // 如果有匹配的词条，使用词汇列表高亮
      if (matchedWords.value.length > 0) {
        await rangeSDK.value.dictionary.search({
          words: getFilteredWords(),
          container: containerEl,
        });
      } else if (finalMockData) {
        // 否则使用模拟数据高亮
        await rangeSDK.value.dictionary.search({
          useMock: true,
          container: containerEl,
        });
      }
    }
  };

  // 手动显示词典卡片
  const showDictionary = (target: HTMLElement) => {
    if (!rangeSDK.value?.dictionary) return;

    // 新版 SDK 中，词典卡片由插件内部管理
    // 这里可以触发一个点击事件来显示卡片
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    target.dispatchEvent(event);
  };

  // 隐藏词典卡片
  const hideDictionary = () => {
    // 新版 SDK 中，卡片会自动隐藏
    // 通常点击外部或按 ESC 键会触发隐藏
  };

  // 清除高亮
  const clearHighlights = () => {
    if (rangeSDK.value?.dictionary) {
      rangeSDK.value.dictionary.clearHighlights(getContainer());
    }
  };

  // 生命周期钩子
  onMounted(async () => {
    if (autoInit) {
      await initSDK();
    }
  });

  onUnmounted(() => {
    if (rangeSDK.value) {
      rangeSDK.value.destroy();
    }
  });

  return {
    rangeSDK,
    isReady,
    matchedWords,
    initDictionary,
    highlightKeywords,
    showDictionary,
    hideDictionary,
    clearHighlights,
  };
}

/**
 * 向后兼容的导出
 */
export default useDictionary;
