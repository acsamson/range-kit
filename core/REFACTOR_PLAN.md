# Core 包重构计划

## 一、问题概述

### 1.1 单文件过大（违反 700 行规范）
- `selection-restore/index.ts`: 911 行
- `layer4-structural-fingerprint.ts`: 908 行
- `types.ts`: 937 行
- `selection-manager.ts`: 897 行

### 1.2 全局变量传递
- 使用 `window.__lastRestoredRange` 传递 Range 对象
- 涉及文件：`restorer/utils.ts`、`restorer/restorer.ts`

### 1.3 路径别名未充分使用
- 配置了 `@/*` 别名，但代码中大量使用 `../` 相对路径

---

## 二、重构方案

### 2.1 消除全局变量 `window.__lastRestoredRange`

**当前问题：**
```typescript
// restorer/utils.ts:457
(window as any).__lastRestoredRange = range.cloneRange();

// restorer/restorer.ts:57
const range = (window as any).__lastRestoredRange;
```

**重构方案：**
修改各层恢复函数的返回类型，从 `boolean` 改为 `{ success: boolean; range?: Range }`

**涉及文件：**
1. `restorer/utils.ts` - 移除全局变量写入，直接返回 Range
2. `restorer/restorer.ts` - 从返回值获取 Range 而非全局变量
3. `restorer/layers/layer1-id-anchors.ts` - 修改返回类型
4. `restorer/layers/layer2-original-paths.ts` - 修改返回类型
5. `restorer/layers/layer3-multiple-anchors.ts` - 修改返回类型
6. `restorer/layers/layer4-structural-fingerprint.ts` - 修改返回类型
7. `types.ts` - 更新 `RestoreLayerFunction` 类型定义
8. `global.d.ts` - 移除 `Window.__lastRestoredRange` 声明

---

### 2.2 拆分 `selection-restore/index.ts` (911 行 → ~300 行)

**当前职责过重：**
- 核心 API 实现
- 批量操作方法
- 文本高亮方法
- 选区类型管理
- 配置管理方法
- 监控管理方法
- 调试日志方法
- 数据导入导出

**拆分方案：**

```
selection-restore/
├── index.ts                    # 主入口 (~300行)
├── api/
│   ├── index.ts               # 导出
│   ├── core-api.ts            # 核心序列化/恢复方法 (~150行)
│   ├── batch-api.ts           # 批量高亮方法 (~150行)
│   ├── text-highlight-api.ts  # 文本高亮方法 (~80行)
│   ├── type-api.ts            # 选区类型管理 (~50行)
│   ├── config-api.ts          # 配置管理 (~80行)
│   ├── monitoring-api.ts      # 监控管理 (~100行)
│   └── debug-api.ts           # 调试日志 (~50行)
```

---

### 2.3 拆分 `layer4-structural-fingerprint.ts` (908 行 → ~200 行)

**当前职责：**
- 主恢复入口
- 结构相似度计算
- 候选元素查找
- 跨元素 Range 构建

**拆分方案：**

```
restorer/
├── layers/
│   ├── layer4-structural-fingerprint.ts  # 主入口 (~200行)
│   └── layer4/
│       ├── index.ts                      # 导出
│       ├── structure-matcher.ts          # 结构相似度计算 (~200行)
│       ├── candidate-finder.ts           # 候选元素查找 (~250行)
│       └── cross-element-range.ts        # 跨元素Range构建 (~200行)
```

**具体拆分内容：**
- `structure-matcher.ts`:
  - `calculateStructuralSimilarity`
  - `calculateParentChainSimilarity`
  - `getElementDepth`
  - `cleanElementText`

- `candidate-finder.ts`:
  - `findElementsByStructure`
  - `findEndElementCandidates`

- `cross-element-range.ts`:
  - `tryCreateCrossElementRange`
  - `createCrossElementRange`
  - `findCommonAncestor`
  - `createRangeFromTextPosition`
  - `normalizeTextForComparison`
  - `calculateTextSimilarity`

---

### 2.4 拆分 `types.ts` (937 行 → ~300 行)

**拆分方案：**

```
selection-restore/
├── types/
│   ├── index.ts              # 主入口，重新导出所有类型 (~50行)
│   ├── core.ts               # 核心数据结构类型 (~200行)
│   ├── options.ts            # 配置选项类型 (~150行)
│   ├── events.ts             # 事件相关类型 (~200行)
│   ├── storage.ts            # 存储相关类型 (~150行)
│   └── api.ts                # API 接口类型 (~200行)
```

**具体拆分内容：**
- `core.ts`: SerializedSelection, AnchorInfo, PathInfo, StructuralFingerprint, TextContext 等
- `options.ts`: SelectionRestoreOptions, HighlightStyle, ContainerConfig 等
- `events.ts`: SelectionBehaviorEvent, SelectionInteractionEvent, SelectionContextChangeEvent 等
- `storage.ts`: Storage, StorageConfig, APIStorageHandlers 等
- `api.ts`: SelectionRestoreAPI, Serializer, Restorer, Highlighter 等

---

### 2.5 拆分 `selection-manager.ts` (897 行 → ~300 行)

**当前职责：**
- 选区事件监听
- 选区序列化/恢复
- 高亮管理
- 重叠检测
- 数据转换

**拆分方案：**

```
src/
├── selection-manager.ts           # 主入口 (~300行)
├── selection-manager/
│   ├── index.ts                  # 导出
│   ├── event-listeners.ts        # 事件监听处理 (~150行)
│   ├── highlight-manager.ts      # 高亮管理 (~100行)
│   ├── overlap-detector.ts       # 重叠检测 (~200行)
│   └── data-converter.ts         # 数据格式转换 (~150行)
```

---

### 2.6 统一使用路径别名

**当前问题：**
```typescript
import { SerializedSelection, ContainerConfig } from '../../types';
import { logDebug, logWarn } from '../../debug/logger';
```

**重构后：**
```typescript
import { SerializedSelection, ContainerConfig } from '@/selection-restore/types';
import { logDebug, logWarn } from '@/selection-restore/debug/logger';
```

**需要更新 tsconfig.json 确保别名正确配置，然后批量替换相对路径。**

---

## 三、执行顺序

1. **消除全局变量** (高优先级，风险较高)
   - 先修改类型定义
   - 逐层修改恢复函数返回值
   - 更新测试用例

2. **拆分 types.ts** (影响范围大，先处理)
   - 创建类型子模块
   - 更新导入路径

3. **拆分 layer4-structural-fingerprint.ts**
   - 创建子模块
   - 更新导入路径

4. **拆分 selection-restore/index.ts**
   - 创建 API 子模块
   - 主入口委托调用

5. **拆分 selection-manager.ts**
   - 创建子模块
   - 更新导入路径

6. **统一路径别名** (最后处理)
   - 批量替换相对路径
   - 验证构建正确

---

## 四、风险评估

| 任务 | 风险等级 | 说明 |
|-----|---------|------|
| 消除全局变量 | 高 | 涉及核心恢复逻辑，需要大量测试 |
| 拆分 types.ts | 中 | 影响范围广但只是移动代码 |
| 拆分 layer4 | 中 | 算法逻辑复杂，需要保证功能不变 |
| 拆分 index.ts | 低 | 主要是方法委托 |
| 拆分 selection-manager | 低 | 相对独立 |
| 路径别名 | 低 | 自动化替换，构建验证 |

---

## 五、验证标准

1. 所有单元测试通过
2. 构建成功无错误
3. 每个文件不超过 700 行
4. 无全局变量传递
5. 路径使用别名（深度超过 2 层的相对路径）
