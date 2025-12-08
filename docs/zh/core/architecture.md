# 架构设计

`range-kit` 核心架构围绕三大支柱设计：**定位器 (Locator)**、**高亮器 (Highlighter)** 和 **交互 (Interaction)**。这些模块由 **SelectionManager** 进行编排。

## 模块概览

### 1. 定位器 (Locator) - 算法层
定位器负责选区位置的纯计算。它处理 DOM `Range` 对象与可序列化 JSON 数据之间的转换。

- **序列化**：将 DOM Range 转换为包含多种回退策略（ID、路径、上下文、指纹）的健壮 JSON 对象。
- **恢复**：接收序列化的 JSON 对象并尝试重建 DOM Range，按精度从高到低的顺序尝试策略。
- **独立性**：该层设计尽可能纯粹，使其可能在非浏览器环境中使用（例如用于服务端验证）。

### 2. 高亮器 (Highlighter) - 渲染层
高亮器负责在屏幕上视觉化地呈现选区。

- **绘制器 (Painters)**：采用策略模式管理“绘制器”。
  - `CSSPainter`：使用 CSS Custom Highlight API (Level 1) 实现高性能且零 DOM 变更的高亮。
  - `DOMPainter` (内部降级)：当 CSS API 不可用时，将文本节点包裹在 span 元素中。
- **样式注册表**：管理不同类型高亮（例如用户选择 vs 搜索结果）的唯一样式。

### 3. 交互 (Interaction) - 事件层
交互模块将用户操作与底层数据连接起来。

- **事件标准化**：抽象了点击真实 DOM 元素（DOM 包裹）与虚拟高亮（CSS Highlight API）之间的差异。
- **命中测试**：执行几何计算以确定鼠标事件是否与高亮范围相交。

## 编排层

### SelectionManager
`SelectionManager` 作为主要入口点和门面（Facade）。它：
- 初始化子系统。
- 管理 `SelectionSession` 的生命周期。
- 向使用者暴露统一的 API。

### SelectionSession
代表用户与文本的当前交互会话。它协调：
- 当前选区状态。
- 重叠检测逻辑。
- 交互事件路由。
