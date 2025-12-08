# Range Kit vs. 竞品深度对比分析

本文档深入对比 `range-kit` 与业界主流选区/高亮库的技术架构、核心算法及适用场景。通过横向评测，明确 Range Kit 的市场定位与核心竞争力。

---

## 1. 竞品概览

| 库名称 | 核心技术 | 主要应用场景 | 维护状态 | GitHub Stars (估) |
| :--- | :--- | :--- | :--- | :--- |
| **Range Kit** (本项目) | **四层级联恢复 (L1-L4)** + **CSS Custom Highlights** | 企业级富文本标注、笔记应用 | 🚀 活跃开发 | - |
| **Rangy** | DOM Range 增强封装 | 传统富文本编辑器 (2010s) | 💀 已停止维护 | 4k+ |
| **Web Annotation (Apache)** | W3C 标准实现 (Text Quote) | 学术引用、Hypothesis 插件 | 🐢 缓慢维护 | 1k+ |
| **Mark.js** | 字符串搜索 + DOM 替换 | 搜索高亮、简单的关键词标记 | ⚠️ 仅维护模式 | 13k+ |
| **CSS Highlights API** | 原生浏览器 API | 下一代高性能渲染 | ✨ 浏览器原生 | - |

---

## 2. 核心维度深度对比

### 2.1 选区恢复能力 (Resilience)

这是“高亮库”最核心的指标：**当页面刷新或内容微调后，高亮还能找回来吗？**

*   **Range Kit**: ⭐⭐⭐⭐⭐ (SOTA 级)
    *   **策略**：采用 **L1 (ID) -> L2 (Path) -> L3 (Context) -> L4 (Fingerprint)** 的四层降级策略。
    *   **优势**：不仅能处理静态页面，还能在 DOM 结构变化（如 React 重渲染丢失 ID）、文本微调（如多出空格）的情况下顽强恢复选区。
    *   **独家**：支持“跨元素”模糊匹配，这是绝大多数库的死穴。

*   **Rangy / Mark.js**: ⭐⭐
    *   **策略**：强依赖 DOM 路径 (XPath/CSS Selector) 或纯文本搜索。
    *   **劣势**：一旦 DOM 结构变动（如插入一个广告 div），路径即刻失效。Mark.js 只能搜纯文本，无法处理跨标签的复杂选区。

*   **Web Annotation**: ⭐⭐⭐⭐
    *   **策略**：基于 Prefix + Exact + Suffix 的纯文本定位。
    *   **优势**：免疫 DOM 结构变化。
    *   **劣势**：如果文本本身被修改（如修正错别字），精确匹配会失败，且缺乏 L1/L2 的高性能快速通道。

### 2.2 渲染性能与对 DOM 的侵入性 (Rendering & Intrusiveness)

*   **Range Kit**: ⭐⭐⭐⭐⭐ (原生级)
    *   **技术**：优先使用 **CSS Custom Highlights API** (浏览器原生绘制)，降级使用 **span 包裹**。
    *   **侵入性**：**零侵入** (Zero DOM Mutation)。使用 Highlights API 时，不会在 DOM 树中插入任何 `span` 标签，完全不影响 React/Vue 的 Virtual DOM Diff 算法。这是现代前端框架的福音。

*   **Mark.js / Rangy**: ⭐⭐
    *   **技术**：**DOM 替换**。将文本节点切割，用 `<span class="highlight">` 包裹。
    *   **侵入性**：**高**。破坏了原有的 DOM 结构，极易导致 React/Vue 报错 ("Node mismatch")，且大量 DOM 操作会导致页面重排 (Reflow)，性能较差。

### 2.3 框架兼容性 (Framework Compatibility)

*   **Range Kit**: ⭐⭐⭐⭐⭐
    *   **设计**：Headless 设计，逻辑与 UI 分离。
    *   **适配**：专为 React/Vue 生态设计，通过 `SelectionManager` 提供纯数据驱动的接口，完美配合响应式数据流。

*   **Rangy**: ⭐
    *   **设计**：jQuery 时代的产物，直接操作真实 DOM。
    *   **适配**：与现代 MVVM 框架格格不入。

### 2.4 数据结构与标准化 (Data Standard)

*   **Range Kit**: ⭐⭐⭐⭐
    *   **格式**：采用自研的 `SerializedSelection` JSON 格式，但设计上参考了 W3C 标准，包含了 path、context、fingerprint 等多维数据，便于未来扩展或转换。

*   **Web Annotation**: ⭐⭐⭐⭐⭐
    *   **格式**：完全遵循 W3C JSON-LD 标准，数据互通性最强，适合需要与其他系统交换数据的学术场景。

*   **Rangy**: ⭐⭐
    *   **格式**：私有二进制或压缩字符串格式，难以阅读和跨平台解析。

---

## 3. 场景推荐：选哪个？

### ✅ 选择 Range Kit，如果：
1.  你正在开发 **现代 Web 应用** (React/Vue/Svelte)。
2.  你需要 **企业级稳定性**，用户的高亮不能因为你发了个新版（改了 DOM）就丢了。
3.  你关注 **性能**，不希望高亮操作导致页面卡顿。
4.  你需要处理 **跨元素** 的复杂选区（例如跨越多个段落）。

### ❌ 选择 Mark.js，如果：
1.  你只需要实现简单的 **Ctrl+F 搜索高亮**。
2.  页面是静态 HTML (jQuery/原生 JS)，没有复杂的 DOM 更新。

### ❌ 选择 Web Annotation (库)，如果：
1.  你的数据必须严格符合 W3C 学术标准，且需要与其他学术软件互通。

---

## 4. 总结

Range Kit 不是简单的“又一个轮子”，而是针对**现代动态 Web 应用痛点**（Virtual DOM 冲突、动态内容恢复、性能瓶颈）进行的**降维打击**。

它汲取了 Rangy 的 DOM 操作经验，融合了 Web Annotation 的文本锚定思想，并率先采用了 CSS Highlights API，是目前业界**综合实力最强**的选区解决方案之一。
