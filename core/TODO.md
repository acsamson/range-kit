## 2025年12月6日 核心组件 (@life2code/range-kit-core) 严格锐评

### 1. 架构设计：俄罗斯套娃与上帝对象
这是最显著的问题。你的架构层级是：`RangeSDK` -> `SelectionManager` -> `SelectionRestore` -> (一大堆子模块)。

*   **过度封装 (Over-Engineering)**: `RangeSDK` (src/range-sdk.ts) 几乎是一个空壳，除了转发事件和调用 `SelectionManager` 外没做任何实质性工作。`SelectionManager` (src/selection-manager.ts) 也有一半代码是在做转发。这种 "Pass-through" 层级只会增加维护成本和阅读负担。
*   **上帝对象 (God Object)**: `SelectionRestore` (src/selection-restore/index.ts) 是一个典型的上帝对象。它管序列化、管恢复、管高亮、管存储、管搜索、管配置、甚至还管日志。虽然你用了 `API` 子模块 (`CoreAPI`, `BatchAPI` 等) 试图拆分逻辑，但 `SelectionRestore` 类本身依然是一个充斥着几十个方法的庞然大物。
*   **命名灾难**:
    *   `core/src/selection-manager.ts` (外层管理器)
    *   `core/src/selection-restore/manager/selection-manager.ts` (内层管理器)
    *   这种命名冲突会让维护者在 Debug 时痛不欲生。请立刻重命名其中一个，或者合并它们。

### 2. 代码质量与风格
*   **错误处理太"温顺"**: 在 `SelectionManager` 中，几乎所有方法都被 `try-catch` 包裹，捕获错误后只是 `console.error` 然后返回 `null`。
    *   **坏处**: 作为 SDK，你不应该吞掉错误。调用者需要知道**为什么**失败（是选区无效？是容器未找到？还是序列化格式错误？）。现在的写法让外部无法进行针对性的错误处理。
*   **类型系统的妥协**:
    *   `RangeSDK` 中的 `emit` 方法使用了 `(listener as any)(...args)`。这是 TypeScript 的一种"放弃治疗"的写法。应该定义更严格的泛型事件处理器类型。
*   **依赖注入的样板代码**: `SelectionRestore` 中使用了大量的 `getCoreAPIDeps`, `getBatchAPIDeps` 等私有方法来传递依赖。这说明你的模块之间耦合度很高，不得不把 `this` 里的几乎所有东西都传给子模块。这是一种代码味道 (Code Smell)，暗示你需要更好的模块划分，而不是把所有东西都塞进一个 Context 里传递。

### 3. 功能与逻辑
*   **SelectionRestore 过于臃肿**: `SelectionRestore` 目录下的子文件夹多得吓人 (`api`, `core`, `debug`, `helpers`, `highlighter`, `manager`, `restorer`, `serializer`, `storage`, `types`, `utils`)。一个"选区恢复"的功能模块，不应该复杂到需要自己的 `storage` 和 `debug` 系统。这感觉像是在写一个完整的应用程序，而不是一个 core library。
*   **存储逻辑侵入**: `SelectionRestore` 包含 `SelectionStorage` 和相关 API (`importData`, `exportData`, `cleanupOldData`)。**这是一个设计错误**。Core SDK 应该只负责处理内存中的数据结构（Range <-> JSON），持久化（存 LocalStorage 还是数据库）应该是应用层的事情，或者由一个独立的 `persistence` 包处理，不应耦合在核心逻辑里。

### 4. 总结与建议
这个组件是一个**功能非常全面但过度设计**的产物。它试图解决所有问题，导致核心逻辑不够纯粹。

**重构建议**:
1.  **砍掉 RangeSDK**: 如果它没有独立逻辑，直接暴露 `SelectionManager`。
2.  **拆分 SelectionRestore**:
    *   把 `Storage` 逻辑完全剥离出去，做成插件或独立包。
    *   把 `Highlighter` 逻辑解耦，Core 只负责计算坐标和 Range，UI 渲染层应该分离。
3.  **统一 Manager**: 解决两个 `SelectionManager` 的命名和职责冲突。
4.  **Let it crash**: 移除那些吞噬错误的 `try-catch`，定义清晰的 `Error` 类型抛出给上层。

**评分**: 6/10 (功能强大，但架构臃肿，维护成本高)

### 5. 初始化 API 变更：强制 ID 锚点 (Strict Mode)
为了提高选区恢复的稳定性和性能，以及倒逼开发者遵循最佳实践，建议变更初始化 API。

**方案 A：严格模式（推荐）**
`SelectionManager` 的构造函数应强制要求传入 `containerId`，而不是 `Element`。这为 DOM 树建立了一个绝对坐标原点，避免了基于不稳定 Selector 的猜测，并利用 `getElementById` 提升查找性能。

```typescript
class SelectionManager {
  private container: HTMLElement;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`[RangeSDK] 初始化失败: 找不到 ID 为 "${containerId}" 的容器元素。选区恢复依赖稳定的 ID 作为锚点，请确保 DOM 中存在该元素。`);
    }
    this.container = el;
    // ...后续初始化
  }
}
```
*   **优势**:
    *   **稳定性**: 路径基于 ID 相对定位，抗 DOM 结构变化。
    *   **性能**: O(1) 查找。
    *   **生命周期解耦**: 允许在 DOM 挂载前配置 SDK 实例。

### 6. 移除内置 Storage 模块
`Storage` 模块对于 Core SDK 是多余且反模式的。移除它不会影响功能，反而能解耦数据管理。

*   **无状态 (Stateless)**: SDK 应只作为"螺丝刀"（处理 Range <-> JSON 转换和 DOM 操作），不应充当"管家"（维护状态列表）。
*   **职责分离**: 内存管理、状态同步（Vuex/Redux）、持久化（LocalStore/DB）完全属于应用层的职责。
*   **工作流变更**:
    *   **Before**: `sdk.saveSelection()` (内部存储) -> `sdk.highlightAll()` (内部读取)
    *   **After**: `const json = sdk.serialize()` -> 应用层存 `json` -> `sdk.highlight(json)`
