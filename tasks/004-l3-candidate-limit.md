# 任务 004: L3 多锚点恢复候选限制提取

## 优先级
中

## 状态
待开始

## 问题描述
L3 多锚点恢复模块中存在硬编码的候选限制数量，需要提取为可配置常量。

## 问题位置
`layer3-multiple-anchors.ts` 第 59 行:
```typescript
for (let i = 0; i < startCandidatesWithText.length && i < 10; i++)
```

## 改造方案
```typescript
// 在 constants/index.ts 中添加
export const L3_CANDIDATE_LIMITS = {
  MAX_CANDIDATE_ATTEMPTS: 10,  // 最多尝试的候选元素数量
} as const;

// 在 layer3-multiple-anchors.ts 中使用
import { L3_CANDIDATE_LIMITS } from '../../constants';

for (let i = 0; i < startCandidatesWithText.length && i < L3_CANDIDATE_LIMITS.MAX_CANDIDATE_ATTEMPTS; i++)
```

## 涉及文件
- `src/selection-restore/constants/index.ts`
- `src/selection-restore/restorer/layers/layer3-multiple-anchors.ts`

## 验收标准
- [ ] 硬编码值提取为常量
- [ ] 添加中文注释说明常量用途
- [ ] 测试用例正常通过
