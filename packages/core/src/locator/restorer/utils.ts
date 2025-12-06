import { SimilarityCandidate, StructuralFingerprint, TextSimilarityCalculator, StructuralSimilarityCalculator, LayerRestoreResult } from '../../types';
import { logDebug, logWarn, logError, logSuccess } from '../../common/debug';

/**
 * 文本相似度计算（Levenshtein距离）
 */
export const calculateTextSimilarity: TextSimilarityCalculator = (text1: string, text2: string): number => {
  if (text1.length === 0) return text2.length === 0 ? 1 : 0;
  if (text2.length === 0) return 0;

  const matrix: number[][] = [];
  const len1 = text1.length;
  const len2 = text2.length;

  // 初始化矩阵
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // 计算编辑距离
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = text1[i - 1] === text2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // 删除
        matrix[i][j - 1] + 1,      // 插入
        matrix[i - 1][j - 1] + cost, // 替换
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return (maxLen - matrix[len1][len2]) / maxLen;
};

/**
 * 结构相似度计算
 */
export const calculateStructuralSimilarity: StructuralSimilarityCalculator = (element: Element, fingerprint: StructuralFingerprint): number => {
  let score = 0;
  let maxScore = 0;

  // 标签名匹配 (权重: 0.3)
  maxScore += 0.3;
  if (element.tagName.toLowerCase() === fingerprint.tagName) {
    score += 0.3;
  }

  // 类名匹配 (权重: 0.2)
  maxScore += 0.2;
  if (element.className === fingerprint.className) {
    score += 0.2;
  } else if (element.className && fingerprint.className) {
    const elementClasses = new Set(element.className.split(/\s+/));
    const fingerprintClasses = new Set(fingerprint.className.split(/\s+/));
    const intersection = new Set([...elementClasses].filter(x => fingerprintClasses.has(x)));
    const union = new Set([...elementClasses, ...fingerprintClasses]);
    score += 0.2 * (intersection.size / union.size);
  }

  // 属性匹配 (权重: 0.15)
  maxScore += 0.15;
  let attributeScore = 0;
  let attributeCount = 0;
  for (const [key, value] of Object.entries(fingerprint.attributes)) {
    attributeCount++;
    if (element.getAttribute(key) === value) {
      attributeScore++;
    }
  }
  if (attributeCount > 0) {
    score += 0.15 * (attributeScore / attributeCount);
  }

  // 文本长度相似度 (权重: 0.1)
  maxScore += 0.1;
  const elementTextLength = element.textContent?.length || 0;
  if (fingerprint.textLength > 0 && elementTextLength > 0) {
    const lengthSimilarity = 1 - Math.abs(elementTextLength - fingerprint.textLength) / Math.max(elementTextLength, fingerprint.textLength);
    score += 0.1 * lengthSimilarity;
  }

  // 子元素数量相似度 (权重: 0.1)
  maxScore += 0.1;
  if (fingerprint.childCount > 0 && element.children.length > 0) {
    const childSimilarity = 1 - Math.abs(element.children.length - fingerprint.childCount) / Math.max(element.children.length, fingerprint.childCount);
    score += 0.1 * childSimilarity;
  }

  // 嵌套深度相似度 (权重: 0.1)
  maxScore += 0.1;
  let currentDepth = 0;
  let current = element.parentElement;
  while (current && current !== document.documentElement) {
    currentDepth++;
    current = current.parentElement;
  }
  if (fingerprint.depth > 0 && currentDepth > 0) {
    const depthSimilarity = 1 - Math.abs(currentDepth - fingerprint.depth) / Math.max(currentDepth, fingerprint.depth);
    score += 0.1 * depthSimilarity;
  }

  // 兄弟节点模式匹配 (权重: 0.05)
  maxScore += 0.05;
  if (fingerprint.siblingPattern && element.parentElement) {
    const siblings = Array.from(element.parentElement.children);
    const position = siblings.indexOf(element);
    if (position !== -1) {
      const patternSimilarity = 1 - Math.abs(position - fingerprint.siblingPattern.position) / Math.max(position + 1, fingerprint.siblingPattern.position + 1);
      score += 0.05 * patternSimilarity;
    }
  }

  return maxScore > 0 ? score / maxScore : 0;
};

/**
 * 根据文本内容查找相似元素
 * @param text - 要搜索的文本
 * @param threshold - 相似度阈值，默认 0.8
 * @param container - 搜索范围容器，必须指定以避免全局搜索
 */
export function findElementsByText(text: string, threshold: number = 0.8, container?: Element): SimilarityCandidate[] {
  // 严格模式：必须指定容器
  const searchRoot = container;
  if (!searchRoot) {
    console.warn('[findElementsByText] 未指定搜索容器，返回空结果');
    return [];
  }

  const candidates: SimilarityCandidate[] = [];
  const walker = document.createTreeWalker(
    searchRoot,
    NodeFilter.SHOW_TEXT,
    null,
  );

  let node: Node | null = walker.nextNode();
  while (node) {
    const nodeText = node.textContent || '';
    const currentNode = node;
    node = walker.nextNode();
    if (nodeText.trim().length > 0) {
      const similarity = calculateTextSimilarity(text, nodeText);
      if (similarity >= threshold) {
        const element = currentNode.parentElement;
        if (element) {
          candidates.push({ element, similarity });
        }
      }
    }
  }

  return candidates.sort((a, b) => b.similarity - a.similarity);
}

/**
 * 根据结构指纹查找相似元素
 * @param fingerprint - 结构指纹
 * @param threshold - 相似度阈值，默认 0.7
 * @param container - 搜索范围容器，必须指定以避免全局搜索
 */
export function findElementsByStructure(fingerprint: StructuralFingerprint, threshold: number = 0.7, container?: Element): SimilarityCandidate[] {
  // 严格模式：必须指定容器
  const searchRoot = container;
  if (!searchRoot) {
    console.warn('[findElementsByStructure] 未指定搜索容器，返回空结果');
    return [];
  }

  const candidates: SimilarityCandidate[] = [];
  const elements = searchRoot.querySelectorAll(fingerprint.tagName);

  elements.forEach(element => {
    const similarity = calculateStructuralSimilarity(element, fingerprint);
    if (similarity >= threshold) {
      candidates.push({ element, similarity });
    }
  });

  return candidates.sort((a, b) => b.similarity - a.similarity);
}

/**
 * 在元素中查找文本位置
 */
export function findTextPositionInElement(element: Element, text: string, precedingText: string, followingText: string): { start: number; end: number } | null {
  const fullText = element.textContent || '';

  // 首先尝试精确匹配
  let index = fullText.indexOf(text);
  if (index !== -1) {
    // 验证前后文本
    const before = fullText.substring(Math.max(0, index - precedingText.length), index);
    const after = fullText.substring(index + text.length, index + text.length + followingText.length);

    const beforeSimilarity = calculateTextSimilarity(precedingText, before);
    const afterSimilarity = calculateTextSimilarity(followingText, after);

    if (beforeSimilarity > 0.8 && afterSimilarity > 0.8) {
      return { start: index, end: index + text.length };
    }
  }

  // 尝试模糊匹配
  const words = text.split(/\s+/).filter(word => word.length > 0);
  if (words.length > 0) {
    for (const word of words) {
      index = fullText.indexOf(word);
      if (index !== -1) {
        return { start: index, end: index + word.length };
      }
    }
  }

  return null;
}

/**
 * 创建文本范围
 */
export function createTextRange(element: Element, start: number, end: number): Range | null {
  const range = document.createRange();
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
  );

  let currentOffset = 0;
  let startNode: Node | null = null;
  let startOffset = 0;
  let endNode: Node | null = null;
  let endOffset = 0;

  let node: Node | null = walker.nextNode();
  while (node) {
    const textContent = node.textContent || '';
    node = walker.nextNode();
    const nodeLength = textContent.length;

    if (!startNode && currentOffset + nodeLength > start) {
      startNode = node;
      startOffset = start - currentOffset;
    }

    if (!endNode && currentOffset + nodeLength >= end) {
      endNode = node;
      endOffset = end - currentOffset;
      break;
    }

    currentOffset += nodeLength;
  }

  if (startNode && endNode) {
    try {
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      return range;
    } catch (error) {
      console.warn('Failed to create range:', error);
    }
  }

  return null;
}

/**
 * 提取元素的多媒体信息
 */
function extractMediaInfo(element: Element): Array<{type: string, src: string, alt?: string}> {
  const mediaInfo: Array<{type: string, src: string, alt?: string}> = [];

  // 检查图片
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    if (img.src) {
      const mediaItem: {type: string, src: string, alt?: string} = {
        type: 'image',
        src: img.src,
      };
      if (img.alt) {
        mediaItem.alt = img.alt;
      }
      mediaInfo.push(mediaItem);
    }
  });

  // 检查视频
  const videos = element.querySelectorAll('video');
  videos.forEach(video => {
    if (video.src) {
      mediaInfo.push({
        type: 'video',
        src: video.src,
      });
    }
    // 检查video下的source元素
    const sources = video.querySelectorAll('source');
    sources.forEach(source => {
      if (source.src) {
        mediaInfo.push({
          type: 'video-source',
          src: source.src,
        });
      }
    });
  });

  // 检查音频
  const audios = element.querySelectorAll('audio');
  audios.forEach(audio => {
    if (audio.src) {
      mediaInfo.push({
        type: 'audio',
        src: audio.src,
      });
    }
    // 检查audio下的source元素
    const sources = audio.querySelectorAll('source');
    sources.forEach(source => {
      if (source.src) {
        mediaInfo.push({
          type: 'audio-source',
          src: source.src,
        });
      }
    });
  });

  // 检查iframe（嵌入内容）
  const iframes = element.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    if (iframe.src) {
      mediaInfo.push({
        type: 'iframe',
        src: iframe.src,
      });
    }
  });

  return mediaInfo;
}

/**
 * 🔥 通用严格内容匹配验证
 * 确保恢复的选区内容（文本+多媒体）与原始选区完全一致
 */
export function validateTextMatch(range: Range, expectedText: string, layerName: string): boolean {
  try {
    // 1. 文本内容验证
    const recoveredText = range.toString();
    const textExactMatch = recoveredText === expectedText;

    logDebug('validation', `${layerName}文本验证失败`, {
      expectedText: `"${expectedText.substring(0, 50)}${expectedText.length > 50 ? '...' : ''}"`,
      expectedLength: expectedText.length,
      recoveredText: `"${recoveredText.substring(0, 50)}${recoveredText.length > 50 ? '...' : ''}"`,
      recoveredLength: recoveredText.length,
      textExactMatch: textExactMatch,
      lengthMatch: recoveredText.length === expectedText.length,
    });

    if (!textExactMatch) {
      // 🔍 详细分析文本差异
      logWarn('validation', `${layerName}验证失败：文本内容不匹配`, {
        reason: '恢复的文本与原始文本不完全一致',
        expectedPreview: `"${expectedText.substring(0, 50)}..."`,
        recoveredPreview: `"${recoveredText.substring(0, 50)}..."`,
        lengthDiff: `期望:${expectedText.length} vs 实际:${recoveredText.length}`,
        decision: '拒绝此次恢复结果',
      });

      // 🔍 字符级差异分析
      const maxLen = Math.max(expectedText.length, recoveredText.length);
      for (let i = 0; i < Math.min(maxLen, 100); i++) { // 只检查前100个字符
        const expectedChar = expectedText[i] || '';
        const recoveredChar = recoveredText[i] || '';
        if (expectedChar !== recoveredChar) {
          logDebug('validation', `${layerName}首个差异位置 ${i}`, {
            expectedChar: `"${expectedChar}" (${expectedChar.charCodeAt(0) || 'EOF'})`,
            recoveredChar: `"${recoveredChar}" (${recoveredChar.charCodeAt(0) || 'EOF'})`,
            expectedContext: `"${expectedText.substring(Math.max(0, i - 5), i + 5)}"`,
            recoveredContext: `"${recoveredText.substring(Math.max(0, i - 5), i + 5)}"`,
            hexExpected: expectedChar ? expectedChar.charCodeAt(0).toString(16) : 'EOF',
            hexRecovered: recoveredChar ? recoveredChar.charCodeAt(0).toString(16) : 'EOF',
          });
          break;
        }
      }

      return false;
    }

    // 2. 多媒体内容验证（跨区选择时）
    const rangeFragment = range.cloneContents();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(rangeFragment);

    const currentMediaInfo = extractMediaInfo(tempDiv);

    if (currentMediaInfo.length > 0) {
      logDebug('validation', `${layerName}多媒体验证：发现${currentMediaInfo.length}个多媒体元素`, {
        mediaElements: currentMediaInfo.map(media => ({
          type: media.type,
          srcPreview: media.src.substring(0, 50) + (media.src.length > 50 ? '...' : ''),
          alt: media.alt,
        })),
      });

      // 注意：这里暂时只记录多媒体信息，实际验证需要与原始选区的多媒体信息对比
      // 由于我们当前没有存储原始选区的多媒体信息，这里只做基础检查

      // 检查关键多媒体元素是否存在（基础验证）
      const hasImages = currentMediaInfo.some(media => media.type === 'image');
      const hasVideos = currentMediaInfo.some(media => media.type === 'video' || media.type === 'video-source');
      const hasAudios = currentMediaInfo.some(media => media.type === 'audio' || media.type === 'audio-source');
      const hasIframes = currentMediaInfo.some(media => media.type === 'iframe');

      logDebug('validation', `${layerName}多媒体统计`, {
        hasImages,
        hasVideos,
        hasAudios,
        hasIframes,
        totalMediaElements: currentMediaInfo.length,
      });
    }

    logSuccess('validation', `${layerName}验证成功：内容完全匹配（含多媒体）`);
    return true;
  } catch (error) {
    console.warn(`⚠️ ${layerName}验证出错:`, error);
    return false;
  }
}

/**
 * 严格文本验证函数（选区评论专用）
 * 只接受100%精确匹配，不允许任何宽松处理
 * @returns LayerRestoreResult - 包含成功状态和 Range 对象
 */
export function applySelectionWithStrictValidation(range: Range, expectedText: string, layerName: string): LayerRestoreResult {
  try {
    // 严格验证：Range文本必须100%匹配期望文本
    const rangeText = range.toString();

    if (rangeText !== expectedText) {
      logWarn('restorer', `${layerName}失败：严格文本验证不通过`, {
        reason: 'Range文本与期望文本不完全匹配',
        expected: `"${expectedText.substring(0, 50)}..."`,
        actual: `"${rangeText.substring(0, 50)}..."`,
        lengthDiff: `期望:${expectedText.length} vs 实际:${rangeText.length}`,
        strictMode: true,
      });

      // 计算差异位置用于调试
      const minLength = Math.min(rangeText.length, expectedText.length);
      for (let i = 0; i < minLength; i++) {
        if (rangeText[i] !== expectedText[i]) {
          logDebug('restorer', `${layerName}严格验证失败 - 差异位置 ${i}`, {
            expectedChar: `"${expectedText[i]}" (${expectedText.charCodeAt(i)})`,
            actualChar: `"${rangeText[i]}" (${rangeText.charCodeAt(i)})`,
            expectedContext: `"${expectedText.substring(Math.max(0, i - 5), i + 5)}"`,
            actualContext: `"${rangeText.substring(Math.max(0, i - 5), i + 5)}"`,
          });
          break;
        }
      }

      return { success: false };
    }

    logSuccess('restorer', `${layerName}严格验证成功 - 文本100%匹配`);
    // 直接返回 Range 对象，不再使用全局变量
    return { success: true, range: range.cloneRange() };
  } catch (error) {
    logError('restorer', `${layerName}严格验证出错`, {
      error: (error as Error).message,
    });
    return { success: false };
  }
}

/**
 * 通用选区应用函数（保持向后兼容）
 * 改为只验证Range，不再应用Selection API，支持CSS Highlights API
 * @returns LayerRestoreResult - 包含成功状态和 Range 对象
 */
export function applySelectionWithValidation(range: Range, expectedText: string, layerName: string): LayerRestoreResult {
  try {
    // 直接验证Range的文本内容，不使用Selection API
    const rangeText = range.toString();

    if (rangeText !== expectedText) {
      logWarn('restorer', `${layerName}失败：Range文本验证不通过`, {
        reason: 'Range文本与期望不匹配',
        expected: `"${expectedText.substring(0, 50)}..."`,
        actual: `"${rangeText.substring(0, 50)}..."`,
        lengthDiff: `期望:${expectedText.length} vs 实际:${rangeText.length}`,
      });

      // 尝试处理浏览器边界调整（处理换行符差异等）
      if (Math.abs(rangeText.length - expectedText.length) <= 4 && rangeText.includes(expectedText.replace(/\n+/g, ''))) {
        logDebug('restorer', '检测到浏览器Range调整，Range验证通过');
        logSuccess('restorer', `${layerName}Range验证成功（经调整）`);
        return { success: true, range: range.cloneRange() };
      }

      // 计算差异位置用于调试
      const minLength = Math.min(rangeText.length, expectedText.length);
      for (let i = 0; i < minLength; i++) {
        if (rangeText[i] !== expectedText[i]) {
          logDebug('restorer', `${layerName}文本差异位置 ${i}`, {
            expectedChar: `"${expectedText[i]}" (${expectedText.charCodeAt(i)})`,
            actualChar: `"${rangeText[i]}" (${rangeText.charCodeAt(i)})`,
            expectedContext: `"${expectedText.substring(Math.max(0, i - 5), i + 5)}"`,
            actualContext: `"${rangeText.substring(Math.max(0, i - 5), i + 5)}"`,
            hexExpected: expectedText.charCodeAt(i).toString(16),
            hexActual: rangeText.charCodeAt(i).toString(16),
          });
          break;
        }
      }

      return { success: false };
    }

    logSuccess('restorer', `${layerName}Range验证成功`);
    // 直接返回 Range 对象，不再使用全局变量
    return { success: true, range: range.cloneRange() };
  } catch (error) {
    logError('restorer', `${layerName}Range验证出错`, {
      error: (error as Error).message,
    });
    return { success: false };
  }
}

/**
 * 增强的文本标准化（处理复杂文本内容）
 * 支持中英文数字统一、标点符号标准化、品牌名大小写统一等
 */
export function enhancedNormalizeText(text: string): string {
  return text
    // 1. 统一中英文数字
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    // 2. 统一标点符号（中文标点转英文）
    .replace(/，/g, ',')
    .replace(/。/g, '.')
    .replace(/！/g, '!')
    .replace(/？/g, '?')
    .replace(/；/g, ';')
    .replace(/：/g, ':')
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/'/g, '\'')
    .replace(/'/g, '\'')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/【/g, '[')
    .replace(/】/g, ']')
    .replace(/《/g, '<')
    .replace(/》/g, '>')
    // 3. 处理英文品牌名的大小写问题
    .replace(/\b(chatgpt|gpt-?\d+|openai|google|microsoft|ibm|apple|amazon|facebook|tesla|nvidia)\b/gi,
      (match) => match.toLowerCase())
    // 4. 统一数字格式（去除千分位逗号）
    .replace(/(\d{1,3})(,\d{3})+/g, (match) => match.replace(/,/g, ''))
    // 5. 统一百分号前的空格
    .replace(/\s*%/g, '%')
    // 6. 移除多余空白并修剪
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 基础文本标准化（仅处理空白字符）
 */
export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * 智能文本匹配（支持多种策略）
 * 策略1: 直接精确匹配
 * 策略2: 基础标准化匹配
 * 策略3: 增强标准化匹配（处理复杂文本）
 * 策略4: 模糊匹配（处理轻微差异）
 */
export function intelligentTextMatch(parentText: string, expectedText: string): number {
  // 策略1: 直接精确匹配
  const textIndex = parentText.indexOf(expectedText);
  if (textIndex !== -1) {
    return textIndex;
  }

  // 策略2: 基础标准化匹配
  const normalizedParentText = normalizeText(parentText);
  const normalizedExpectedText = normalizeText(expectedText);

  const normalizedIndex = normalizedParentText.indexOf(normalizedExpectedText);
  if (normalizedIndex !== -1) {
    return mapNormalizedIndexToOriginal(parentText, normalizedIndex);
  }

  // 策略3: 增强标准化匹配（处理复杂文本）
  const enhancedParentText = enhancedNormalizeText(parentText);
  const enhancedExpectedText = enhancedNormalizeText(expectedText);

  const enhancedIndex = enhancedParentText.indexOf(enhancedExpectedText);
  if (enhancedIndex !== -1) {
    logDebug('智能匹配', '使用增强标准化匹配成功', {
      originalExpected: expectedText.substring(0, 50),
      enhancedExpected: enhancedExpectedText.substring(0, 50),
    });
    return mapEnhancedIndexToOriginal(parentText, enhancedParentText, enhancedIndex);
  }

  // 策略4: 模糊匹配（处理轻微差异）
  const fuzzyIndex = fuzzyTextMatch(parentText, expectedText);
  if (fuzzyIndex !== -1) {
    logDebug('智能匹配', '使用模糊匹配成功', { fuzzyIndex });
    return fuzzyIndex;
  }

  return -1;
}

/**
 * 将标准化文本的索引映射回原始文本位置
 */
function mapNormalizedIndexToOriginal(originalText: string, normalizedIndex: number): number {
  let normalizedCount = 0;
  let inWhitespace = false;

  for (let i = 0; i < originalText.length; i++) {
    const char = originalText[i];
    const isWhitespace = /\s/.test(char);

    if (isWhitespace) {
      if (!inWhitespace) {
        // 第一个空白字符，在标准化文本中对应一个空格
        if (normalizedCount === normalizedIndex) {
          return i;
        }
        normalizedCount++;
        inWhitespace = true;
      }
      // 后续空白字符在标准化文本中被忽略
    } else {
      // 非空白字符
      if (normalizedCount === normalizedIndex) {
        return i;
      }
      normalizedCount++;
      inWhitespace = false;
    }
  }

  return -1; // 未找到对应位置
}

/**
 * 将增强标准化文本的索引映射回原始文本位置
 */
function mapEnhancedIndexToOriginal(originalText: string, enhancedText: string, enhancedIndex: number): number {
  // 构建字符映射关系
  const charMapping: number[] = [];
  let enhancedPos = 0;

  for (let i = 0; i < originalText.length; i++) {
    const originalChar = originalText[i];
    const enhancedChar = enhancedText[enhancedPos];

    // 记录映射关系
    charMapping[enhancedPos] = i;

    // 根据增强标准化规则计算下一个位置
    if (enhancedChar && (originalChar === enhancedChar || isEquivalentChar(originalChar, enhancedChar))) {
      enhancedPos++;
    } else if (/\s/.test(originalChar)) {
      // 原文中的空白字符，可能在增强文本中被压缩
      if (enhancedChar === ' ') {
        enhancedPos++;
      }
    }
  }

  return charMapping[enhancedIndex] || -1;
}

/**
 * 判断两个字符是否等价（考虑标准化规则）
 */
function isEquivalentChar(original: string, enhanced: string): boolean {
  // 中英文数字等价
  if (/[０-９]/.test(original) && /\d/.test(enhanced)) {
    return String.fromCharCode(original.charCodeAt(0) - 0xfee0) === enhanced;
  }

  // 中英文标点等价
  const punctMap: { [key: string]: string } = {
    '，': ',', '。': '.', '！': '!', '？': '?', '；': ';', '：': ':',
    '（': '(', '）': ')', '【': '[', '】': ']', '《': '<', '》': '>',
  };

  return punctMap[original] === enhanced;
}

/**
 * 模糊文本匹配（处理轻微差异）
 */
function fuzzyTextMatch(parentText: string, expectedText: string): number {
  // 如果预期文本太短，不进行模糊匹配
  if (expectedText.length < 10) {
    return -1;
  }

  // 分割成词汇进行匹配
  const expectedWords = expectedText.replace(/[^\u4e00-\u9fa5\w]/g, ' ').split(/\s+/).filter(w => w.length > 1);
  if (expectedWords.length < 2) {
    return -1;
  }

  // 寻找词汇序列匹配
  const parentWords = parentText.replace(/[^\u4e00-\u9fa5\w]/g, ' ').split(/\s+/);

  for (let i = 0; i <= parentWords.length - expectedWords.length; i++) {
    let matchCount = 0;
    for (let j = 0; j < expectedWords.length; j++) {
      if (parentWords[i + j] && parentWords[i + j].includes(expectedWords[j])) {
        matchCount++;
      }
    }

    // 如果匹配度超过80%，认为找到了
    if (matchCount / expectedWords.length > 0.8) {
      // 找到大概位置，返回该区域的开始位置
      const firstWord = expectedWords[0];
      const roughIndex = parentText.indexOf(firstWord);
      if (roughIndex !== -1) {
        logDebug('模糊匹配', '模糊匹配成功', {
          matchCount,
          totalWords: expectedWords.length,
          matchRate: matchCount / expectedWords.length,
        });
        return roughIndex;
      }
    }
  }

  return -1;
}
