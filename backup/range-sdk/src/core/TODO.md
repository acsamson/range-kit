# 四层恢复算法优化 TODO

> 基于代码审查的改造建议, 按优先级排列

---

## 高优先级

### 1. 消除全局变量传递 Range

**问题位置:** `selection-restore/restorer/restorer.ts:57`

**现状:**
```typescript
const range = (window as any).__lastRestoredRange;
```

每一层通过 `window.__lastRestoredRange` 传递结果, 存在以下风险:
- 并发恢复场景下会产生冲突
- TypeScript 类型系统被完全绕过
- 单元测试困难

**建议改造:**
- 让每层函数直接返回 `{ success: boolean; range?: Range }` 类型
- 移除所有 `window.__lastRestoredRange` 的读写操作
- 在 `restoreSelection` 主函数中统一处理返回值

**涉及文件:**
- `restorer/restorer.ts`
- `restorer/layers/layer1-id-anchors.ts`
- `restorer/layers/layer2-original-paths.ts`
- `restorer/layers/layer3-multiple-anchors.ts`
- `restorer/layers/layer4-structural-fingerprint.ts`
- `restorer/utils.ts` (applySelectionWithStrictValidation)

---

### 2. 拆分 L4 结构指纹恢复模块

**问题位置:** `selection-restore/restorer/layers/layer4-structural-fingerprint.ts`

**现状:** 909 行代码, 违反 700 行限制, 职责过重

**建议拆分为:**

```
restorer/layers/
├── layer4-structural-fingerprint.ts  # 主入口, 约 150 行
├── helpers/
│   ├── l4-structure-matcher.ts       # 结构相似度计算
│   ├── l4-cross-element.ts           # 跨元素 Range 构建
│   └── l4-candidate-finder.ts        # 候选元素查找
```

**具体拆分内容:**
- `l4-structure-matcher.ts`: `calculateStructuralSimilarity`, `calculateParentChainSimilarity`, `getElementDepth`
- `l4-cross-element.ts`: `tryCreateCrossElementRange`, `createCrossElementRange`, `findCommonAncestor`
- `l4-candidate-finder.ts`: `findEndElementCandidates`, `findElementsByStructure`

---

## 中优先级

### 3. 提取硬编码阈值为配置常量

**问题位置:** 分散在各层代码中

**需要提取的硬编码值:**

```typescript
// layer3-multiple-anchors.ts:59
for (let i = 0; i < startCandidatesWithText.length && i < 10; i++)
// 建议: MAX_CANDIDATE_ATTEMPTS = 10

// layer4-structural-fingerprint.ts:41-46
const matchingStrategies = [
  { minSimilarity: 0.8, name: '高精度结构匹配' },
  { minSimilarity: 0.6, name: '中等结构匹配' },
  { minSimilarity: 0.4, name: '宽松结构匹配' },
  { minSimilarity: 0.2, name: '最低结构匹配' },
];
// 建议: L4_SIMILARITY_THRESHOLDS

// layer4-structural-fingerprint.ts:75
for (let i = 0; i < Math.min(prioritizedCandidates.length, 15); i++)
// 建议: L4_MAX_CANDIDATE_TESTS = 15

// layer4-structural-fingerprint.ts:810
if (similarity >= 0.3)
// 建议: L4_CROSS_ELEMENT_MIN_SIMILARITY = 0.3

// layer4-structural-fingerprint.ts:731
return uniqueCandidates.slice(0, 15);
// 建议: L4_MAX_END_CANDIDATES = 15
```

**建议:** 在 `restorer/constants.ts` 中统一管理这些配置

---

### 4. 保持 L2 层级职责单一

**问题位置:** `selection-restore/restorer/layers/layer2-original-paths.ts:111`

**现状:**
```typescript
// L2 失败后直接调用文本匹配 (这实际上是 L3/L4 的工作)
return attemptSingleElementTextMatching(startElement, text);
```

**建议改造:**
- L2 专注于 DOM 路径恢复, 失败时直接返回 false
- 让主流程的级联逻辑来决定下沉到 L3
- 移除 L2 中的 `attemptSingleElementTextMatching` 和 `attemptCrossElementTextMatching`

---

### 5. 简化 `findEndElementCandidates` 函数

**问题位置:** `layer4-structural-fingerprint.ts:532-732`

**现状:** 200 行代码, 4 种策略串联执行, 代码重复度高

**建议改造:**
```typescript
// 抽取公共的候选过滤逻辑
interface CandidateFilter {
  searchScope: Element | Document;
  searchTags: string[];
  endClassName: string;
  startElement: Element;
}

function filterCandidates(filter: CandidateFilter): Element[] {
  // 统一的候选过滤逻辑
}

// 每种策略只需要提供 searchScope
const strategies = [
  () => getCommonParentScope(multipleAnchors),
  () => document,
  () => getParentChainScope(startElement, 6),
  () => getSiblingScope(startElement, multipleAnchors),
];
```

---

## 低优先级

### 6. 增加日志级别控制

**问题位置:** 全局, 尤其是 L4

**现状:** 大量 `logDebug` 调用, 生产环境会产生日志噪音

**建议改造:**
```typescript
// debug/logger.ts
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

let currentLogLevel = LogLevel.INFO;

export function setLogLevel(level: LogLevel) {
  currentLogLevel = level;
}

export function logDebug(category: string, message: string, data?: any) {
  if (currentLogLevel >= LogLevel.DEBUG) {
    // 执行日志输出
  }
}
```

---

### 7. 增加性能统计收集

**问题位置:** `restorer/restorer.ts`

**现状:** 只有单次恢复的耗时, 没有统计分析

**建议增加:**
```typescript
// 新建 restorer/metrics.ts
interface LayerMetrics {
  attempts: number;
  successes: number;
  totalTime: number;
  avgTime: number;
}

interface RestoreMetrics {
  L1: LayerMetrics;
  L2: LayerMetrics;
  L3: LayerMetrics;
  L4: LayerMetrics;
  totalRestores: number;
  successRate: number;
}

export const metrics: RestoreMetrics = { ... };

export function recordLayerAttempt(layer: 1 | 2 | 3 | 4, success: boolean, time: number) {
  // 记录统计数据
}

export function getMetricsReport(): string {
  // 生成报告
}
```

---

### 8. L3 相似度计算优化

**问题位置:** `layer3-multiple-anchors.ts:99-131`

**现状:** 类名匹配只做了简单的 `split + Set 交集`

**建议改造:**
- 支持 BEM 命名约定识别 (如 `block__element--modifier`)
- 增加类名权重 (如 `js-` 前缀的类名权重更低)

```typescript
function calculateClassSimilarity(elementClass: string, targetClass: string): number {
  // BEM 解析
  const parseBEM = (cls: string) => {
    const match = cls.match(/^([a-z-]+)(?:__([a-z-]+))?(?:--([a-z-]+))?$/i);
    return match ? { block: match[1], element: match[2], modifier: match[3] } : null;
  };

  // 更智能的相似度计算
}
```

---

## 完成标准

- [ ] 高优先级任务全部完成
- [ ] 中优先级任务至少完成 2 项
- [ ] 所有改动有对应的单元测试
- [ ] 代码审查通过
- [ ] 文档更新

---

## 参考文件

- `src/core/selection-restore/restorer/restorer.ts` - 主恢复逻辑
- `src/core/selection-restore/restorer/layers/` - 四层恢复算法
- `src/core/selection-restore/restorer/utils.ts` - 工具函数
- `src/core/selection-restore/debug/logger.ts` - 日志模块
