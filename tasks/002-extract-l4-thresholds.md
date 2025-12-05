# 任务 002: 提取 L4 硬编码阈值为配置常量

## 优先级
中

## 状态
待开始

## 问题描述
L4 结构指纹恢复模块中存在多个硬编码的阈值，分散在代码各处，不便于维护和调试。

## 需要提取的硬编码值

### layer4-structural-fingerprint.ts
```typescript
// 第 65-70 行
const matchingStrategies = [
  { minSimilarity: 0.8, name: '高精度结构匹配' },
  { minSimilarity: 0.6, name: '中等结构匹配' },
  { minSimilarity: 0.4, name: '宽松结构匹配' },
  { minSimilarity: 0.2, name: '最低结构匹配' },
];

// 第 90 行
for (let i = 0; i < Math.min(prioritizedCandidates.length, 15); i++)
```

### layer4/structure-matcher.ts
```typescript
// 第 79-80 行 - 跨元素选区特殊加分
similarity += 0.3;

// 第 89 行 - 语义标签降级调整
similarity *= 0.9;
```

### layer4/candidate-finder.ts (如果有)
- 候选元素数量限制
- 搜索范围深度限制

## 建议配置结构
```typescript
// 在 constants/index.ts 或新建 restorer/constants.ts

// L4 相似度阈值配置
export const L4_SIMILARITY_THRESHOLDS = {
  HIGH_PRECISION: 0.8,      // 高精度结构匹配
  MEDIUM: 0.6,              // 中等结构匹配
  LOOSE: 0.4,               // 宽松结构匹配
  MINIMUM: 0.2,             // 最低结构匹配
} as const;

// L4 候选元素限制
export const L4_CANDIDATE_LIMITS = {
  MAX_CANDIDATE_TESTS: 15,     // 最多测试的候选元素数量
  MAX_END_CANDIDATES: 15,      // 最多返回的结束元素候选数量
  MAX_SEARCH_DEPTH: 6,         // 父链搜索最大深度
} as const;

// L4 权重调整
export const L4_WEIGHT_ADJUSTMENTS = {
  CROSS_ELEMENT_BONUS: 0.3,     // 跨元素选区匹配加分
  SEMANTIC_TAG_PENALTY: 0.9,    // 语义标签降级系数
  CROSS_ELEMENT_MIN_SIMILARITY: 0.3, // 跨元素最低相似度
} as const;
```

## 涉及文件
- `src/selection-restore/constants/index.ts` (新增 L4 配置)
- `src/selection-restore/restorer/layers/layer4-structural-fingerprint.ts`
- `src/selection-restore/restorer/layers/layer4/structure-matcher.ts`
- `src/selection-restore/restorer/layers/layer4/candidate-finder.ts`
- `src/selection-restore/restorer/layers/layer4/cross-element-range.ts`

## 验收标准
- [ ] 所有硬编码阈值提取到常量文件
- [ ] 代码中使用常量替代硬编码值
- [ ] 添加中文注释说明每个常量的用途
- [ ] 所有测试用例正常通过
