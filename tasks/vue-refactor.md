# Vue 包架构改造任务

## 背景

参照 core 包的架构设计，对 Vue 包进行改造，使其更符合 CLAUDE.md 中定义的 UI 组件库模式。

## 当前结构

```
packages/vue/src/
├── hooks/
│   ├── common/                    # 通用交互处理
│   ├── use-selection-restore/     # 选区恢复 Hook（~635行，过于庞大）
│   ├── use-search-highlight/      # 搜索高亮 Hook
│   ├── use-highlight-navigation/  # 高亮导航 Hook
│   └── index.ts
└── index.ts
```

## 目标结构

按照 CLAUDE.md 中 UI 组件库模式重构：

```
packages/vue/src/
├── composables/                   # Vue Composables (重命名 hooks → composables)
│   ├── use-selection-restore/     # 主 Hook
│   │   ├── index.ts              # 导出入口
│   │   ├── use-selection-restore.ts  # 核心逻辑（拆分）
│   │   ├── use-navigation.ts     # 导航逻辑（从主 Hook 抽离）
│   │   ├── types.ts
│   │   └── constants.ts
│   ├── use-search-highlight/
│   ├── use-highlight-navigation/
│   └── index.ts
├── utils/                         # 工具函数
│   ├── scroll.ts                 # 滚动相关
│   └── convert.ts                # 数据转换
├── types/                         # 类型定义
│   └── index.ts
└── index.ts
```

---

## 任务清单

### 1. 目录重命名 [低优先级]

- [ ] `hooks/` → `composables/`（更符合 Vue 生态命名惯例）

### 2. 拆分 use-selection-restore [高优先级]

当前 `use-selection-restore/index.ts` 有 635 行，承载了过多职责：
- SDK 初始化和生命周期
- 选区 CRUD 操作
- 导航功能（~200行）
- CSS Highlight API 样式管理

**拆分方案**：
- [ ] 抽离导航逻辑到 `use-navigation.ts`（内部模块，不对外导出）
- [ ] 抽离 CSS Highlight 样式管理到 `utils/highlight-style.ts`
- [ ] 主文件保留核心的选区操作逻辑

### 3. 提取公共工具函数 [中优先级]

- [ ] `use-selection-restore/utils/scroll.ts` → `utils/scroll.ts`
- [ ] `use-selection-restore/utils/convert.ts` → `utils/convert.ts`
- [ ] 更新相关 import 路径

### 4. 类型定义整理 [低优先级]

- [ ] 评估是否需要统一 `types/` 目录
- [ ] 目前各 Hook 有独立的 types.ts，可保持现状

### 5. 删除冗余代码 [中优先级]

- [ ] 检查 `hooks/common/` 是否被使用，如无则删除
- [ ] 检查重复导出和 deprecated 代码

---

## 不做的改动

1. **不改变 API 接口** - 保持对外导出的 Hook 签名不变
2. **不删除功能** - 只是重构代码组织
3. **不添加新功能** - 专注于架构改造

---

## 验证方式

1. `pnpm tsc --noEmit` - 类型检查
2. 确保导出的 API 保持不变
3. `pnpm build` - 构建成功

---

## 优先级排序

1. 🔴 拆分 use-selection-restore（解决 God Function 问题）
2. 🟡 提取公共工具函数
3. 🟡 删除冗余代码
4. 🟢 目录重命名
5. 🟢 类型定义整理
