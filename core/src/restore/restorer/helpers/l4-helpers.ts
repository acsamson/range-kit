// 语义标签分组常量 - 抽离重复代码，提高可维护性
const TAG_GROUPS = {
  // 核心通用标签
  BASIC: ['div', 'span', 'p'],

  // 标题标签
  HEADINGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

  // 语义容器标签
  CONTAINERS: ['section', 'article', 'main', 'aside'],

  // 结构标签
  STRUCTURE: ['header', 'footer', 'nav'],

  // 行内强调标签
  INLINE_EMPHASIS: ['strong', 'em', 'i', 'b', 'mark'],

  // 行内通用标签
  INLINE_BASIC: ['span', 'small', 'label'],

  // 列表标签
  LISTS: ['ul', 'ol', 'li'],

  // 定义列表标签
  DEF_LISTS: ['dl', 'dt', 'dd'],

  // 表格标签
  TABLE: ['table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption'],

  // 表单标签
  FORM: ['form', 'fieldset', 'legend', 'label'],

  // 引用标签
  QUOTE: ['blockquote', 'q'],

  // 多媒体标签
  MEDIA: ['figure', 'figcaption'],

  // 代码标签
  CODE: ['code', 'pre', 'kbd', 'samp', 'var'],

  // 其他语义标签
  MISC: ['address', 'time', 'sub', 'sup'],
} as const;

/**
 * 获取与给定标签语义相关的所有可能标签
 * @param originalTag 原始标签名
 * @returns 包含原始标签和语义相关标签的数组，按优先级排序
 */
export const getSemanticTags = (originalTag: string): string[] => {
  const tags = [originalTag]; // 原始标签优先

  // 辅助函数：添加其他标签（排除自身）
  const addOthers = (group: readonly string[]) => {
    tags.push(...group.filter(tag => tag !== originalTag));
  };

  // 辅助函数：添加指定标签组
  const addGroups = (...groups: (readonly string[])[]) => {
    groups.forEach(group => tags.push(...group));
  };

  switch (originalTag) {
    // 段落类标签：与容器和列表项兼容
    case 'p':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.CONTAINERS, TAG_GROUPS.INLINE_BASIC, TAG_GROUPS.QUOTE);
      tags.push('dd', 'dt', 'li');
      break;

    // 标题类标签：所有标题互相兼容，也支持强调标签
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
      addOthers(TAG_GROUPS.HEADINGS);
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.INLINE_EMPHASIS, TAG_GROUPS.STRUCTURE);
      tags.push('title');
      break;

    // div：最通用的容器，与几乎所有标签兼容
    case 'div':
      addGroups(
        TAG_GROUPS.CONTAINERS, TAG_GROUPS.STRUCTURE, TAG_GROUPS.BASIC.slice(1), // 排除div自身
        TAG_GROUPS.HEADINGS, TAG_GROUPS.QUOTE, TAG_GROUPS.MEDIA,
      );
      break;

    // 语义容器：相互兼容
    case 'section': case 'article': case 'main': case 'aside':
      addOthers(TAG_GROUPS.CONTAINERS);
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.STRUCTURE);
      break;

    // 行内基础标签
    case 'span':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.INLINE_EMPHASIS, TAG_GROUPS.INLINE_BASIC.slice(1));
      break;

    // 行内强调标签：相互兼容，也支持标题
    case 'strong': case 'em': case 'i': case 'b':
      addOthers(TAG_GROUPS.INLINE_EMPHASIS);
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.INLINE_BASIC, TAG_GROUPS.HEADINGS);
      break;

    // 结构标签
    case 'header':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.CONTAINERS, TAG_GROUPS.HEADINGS);
      break;
    case 'footer':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.CONTAINERS);
      break;
    case 'nav':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.CONTAINERS, TAG_GROUPS.LISTS.slice(0, 2)); // ul, ol
      break;

    // 列表标签
    case 'ul': case 'ol':
      addOthers(TAG_GROUPS.LISTS.slice(0, 2)); // ul, ol
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.CONTAINERS);
      tags.push('nav');
      break;
    case 'li':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.DEF_LISTS.slice(1)); // dt, dd
      break;

    // 定义列表
    case 'dl':
      addGroups(TAG_GROUPS.LISTS.slice(0, 2), TAG_GROUPS.BASIC, TAG_GROUPS.CONTAINERS);
      break;
    case 'dt': case 'dd':
      addOthers(TAG_GROUPS.DEF_LISTS.slice(1)); // dt, dd
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.INLINE_BASIC);
      tags.push('li');
      break;

    // 引用标签
    case 'blockquote':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.CONTAINERS);
      break;
    case 'q':
      addGroups(TAG_GROUPS.INLINE_BASIC, TAG_GROUPS.BASIC, TAG_GROUPS.QUOTE);
      break;

    // 多媒体标签
    case 'figure':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.CONTAINERS);
      break;
    case 'figcaption':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.INLINE_BASIC);
      tags.push('caption');
      break;

    // 表格标签
    case 'table':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.CONTAINERS);
      break;
    case 'thead':
      tags.push('div', 'header');
      break;
    case 'tbody':
      tags.push('div', 'main');
      break;
    case 'tfoot':
      tags.push('div', 'footer');
      break;
    case 'tr':
      addGroups(TAG_GROUPS.BASIC);
      break;
    case 'td':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.INLINE_BASIC);
      tags.push('th');
      break;
    case 'th':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.INLINE_BASIC, TAG_GROUPS.INLINE_EMPHASIS);
      tags.push('td');
      break;
    case 'caption':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.INLINE_BASIC);
      tags.push('figcaption');
      break;

    // 表单标签
    case 'form': case 'fieldset':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.CONTAINERS);
      break;
    case 'legend':
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.INLINE_BASIC, TAG_GROUPS.HEADINGS);
      break;
    case 'label':
      addGroups(TAG_GROUPS.INLINE_BASIC, TAG_GROUPS.BASIC);
      break;

    // 代码相关标签
    case 'code':
      addGroups(TAG_GROUPS.INLINE_BASIC, TAG_GROUPS.BASIC);
      tags.push('pre');
      break;
    case 'pre':
      addGroups(TAG_GROUPS.BASIC);
      tags.push('code');
      break;
    case 'kbd': case 'samp':
      addGroups(TAG_GROUPS.INLINE_BASIC, TAG_GROUPS.BASIC);
      tags.push('code');
      break;
    case 'var':
      addGroups(TAG_GROUPS.INLINE_BASIC, TAG_GROUPS.BASIC, TAG_GROUPS.INLINE_EMPHASIS.slice(1, 3)); // em, i
      tags.push('code');
      break;

    // 其他语义标签
    case 'address': case 'time': case 'mark': case 'small':
      addGroups(TAG_GROUPS.INLINE_BASIC, TAG_GROUPS.BASIC);
      if (originalTag === 'mark') {
        addGroups(TAG_GROUPS.INLINE_EMPHASIS);
      }
      break;
    case 'sub': case 'sup':
      tags.push('span', 'small');
      break;

    // 默认情况：未知标签与通用标签兼容
    default:
      addGroups(TAG_GROUPS.BASIC, TAG_GROUPS.CONTAINERS);
      break;
  }

  return tags;
};
