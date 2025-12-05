# 任务 006: L3 类名相似度计算优化

## 优先级
低

## 状态
待开始

## 问题描述
当前 L3 多锚点恢复模块中的类名匹配只做了简单的 `split + Set 交集`，没有考虑 BEM 命名约定和类名权重。

## 问题位置
`layer3-multiple-anchors.ts` 约 99-131 行

## 当前实现
```typescript
// 简单的 Set 交集计算
const elementClasses = new Set(elementClass.split(/\s+/));
const targetClasses = new Set(targetClass.split(/\s+/));
const intersection = new Set([...elementClasses].filter(x => targetClasses.has(x)));
score += (intersection.size / Math.max(elementClasses.size, targetClasses.size));
```

## 优化方案
```typescript
/**
 * BEM 命名解析结果
 */
interface BEMParts {
  block: string;
  element?: string;
  modifier?: string;
}

/**
 * 解析 BEM 命名
 * 例如: "block__element--modifier" -> { block: "block", element: "element", modifier: "modifier" }
 */
function parseBEM(className: string): BEMParts | null {
  const match = className.match(/^([a-z][a-z0-9-]*)(?:__([a-z][a-z0-9-]*))?(?:--([a-z][a-z0-9-]*))?$/i);
  if (!match) return null;

  return {
    block: match[1],
    element: match[2],
    modifier: match[3],
  };
}

/**
 * 类名权重配置
 */
const CLASS_WEIGHTS = {
  // 低权重类名前缀（JS hook、状态类等）
  LOW_WEIGHT_PREFIXES: ['js-', 'is-', 'has-', 'can-', 'should-'],
  // 高权重类名前缀（功能性类名）
  HIGH_WEIGHT_PREFIXES: ['c-', 'o-', 'u-', 'l-'], // Component, Object, Utility, Layout
  // 默认权重
  DEFAULT_WEIGHT: 1,
  LOW_WEIGHT: 0.3,
  HIGH_WEIGHT: 1.5,
} as const;

/**
 * 获取类名权重
 */
function getClassWeight(className: string): number {
  const lowerClass = className.toLowerCase();

  for (const prefix of CLASS_WEIGHTS.LOW_WEIGHT_PREFIXES) {
    if (lowerClass.startsWith(prefix)) {
      return CLASS_WEIGHTS.LOW_WEIGHT;
    }
  }

  for (const prefix of CLASS_WEIGHTS.HIGH_WEIGHT_PREFIXES) {
    if (lowerClass.startsWith(prefix)) {
      return CLASS_WEIGHTS.HIGH_WEIGHT;
    }
  }

  return CLASS_WEIGHTS.DEFAULT_WEIGHT;
}

/**
 * 增强的类名相似度计算
 */
function calculateClassSimilarity(elementClass: string, targetClass: string): number {
  if (!elementClass || !targetClass) return 0;
  if (elementClass === targetClass) return 1;

  const elementClasses = elementClass.split(/\s+/).filter(Boolean);
  const targetClasses = targetClass.split(/\s+/).filter(Boolean);

  let matchScore = 0;
  let maxPossibleScore = 0;

  for (const targetCls of targetClasses) {
    const weight = getClassWeight(targetCls);
    maxPossibleScore += weight;

    // 精确匹配
    if (elementClasses.includes(targetCls)) {
      matchScore += weight;
      continue;
    }

    // BEM 部分匹配
    const targetBEM = parseBEM(targetCls);
    if (targetBEM) {
      for (const elementCls of elementClasses) {
        const elementBEM = parseBEM(elementCls);
        if (elementBEM && elementBEM.block === targetBEM.block) {
          // 同一个 Block，给予部分分数
          let bemScore = 0.5;
          if (elementBEM.element === targetBEM.element) bemScore += 0.3;
          if (elementBEM.modifier === targetBEM.modifier) bemScore += 0.2;
          matchScore += weight * bemScore;
          break;
        }
      }
    }
  }

  return maxPossibleScore > 0 ? matchScore / maxPossibleScore : 0;
}
```

## 涉及文件
- `src/selection-restore/restorer/layers/layer3-multiple-anchors.ts`
- `src/selection-restore/restorer/utils.ts` (可能需要移动通用函数)

## 验收标准
- [ ] 实现 BEM 命名解析函数
- [ ] 实现类名权重计算
- [ ] 更新类名相似度计算函数
- [ ] 添加单元测试覆盖各种类名格式
- [ ] 确保现有测试仍然通过
