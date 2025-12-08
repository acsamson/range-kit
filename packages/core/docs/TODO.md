# 核心结论
 核心结论：设计过度，职责不清，性能埋雷

  整体架构试图构建一个"永远能找回选区"的完美系统，但陷入了过度工程
  化的泥潭。各层级（Layer）之间的边界模糊，尤其是 L1 实际上在做 L3
  的脏活，而 L3 的实现方式在大型 DOM 树下存在严重的性能隐患。

  ---

  具体层级锐评

  🛑 L1 (ID Anchors): 挂羊头卖狗肉，逻辑越界
  定位： 本应是最高优先级的"精确 ID 匹配"。
  现状：
   1. 不纯粹： L1 内部竟然包含了大量的 "Fuzzy
      Adjustment"（模糊修正）逻辑。如果 ID 匹配但 Offsets
      不对，这说明内容变了。L1 的职责应该是直接失败，将控制权交给
      L3/L4 去处理"内容变更"的场景。
   2. 性能黑洞： 代码中出现 adjustmentWalker 和 backtrack
      循环，试图暴力穷举修正偏移量。这是在用 CPU
      算力弥补数据的不一致性，不仅慢，而且容易命中错误的文本（False
      Positive）。
   3. 代码异味： findTextNode 逻辑复杂且难以维护，且与 L2/L3
      中的文本查找逻辑存在重复造轮子嫌疑。

  ✅ L2 (Original Paths): 唯一清醒的层级
  定位： 基于 XPath/Selector 的精确路径。
  评价： 这是目前设计最合理的层级。它严格遵循 "Path + Offset"
  原则，一旦不匹配立即 return { success: false
  }，不进行任何猜测或模糊匹配。这种Fail Fast
  的设计才是系统健壮性的基石。

  💣 L3 (Multiple Anchors): 性能定时炸弹 & 假设过强
  定位： 基于上下文锚点的模糊恢复。
  现状：
   1. 查询灾难： findAnchorElements 函数在没有 ID/Class
      的情况下，会降级为
      rootNode.querySelectorAll(tagName)。在一个包含 5000 个 <span>
      或 <div> 的页面中，这行代码就是主线程卡顿的元凶。
   2. 过度设计 (BEM)： 居然内置了 BEM (block__element--modifier)
      的解析逻辑来计算相似度。这是一个通用库，不应假设用户的 CSS
      命名规范。这种业务强相关的逻辑写死在底层库里，既增加了复杂度
      ，又缺乏普适性。
   3. 排序算法低效： 在 JS 层面获取所有候选节点并进行 sort
      排序，当候选集很大时，内存和计算开销不可忽视。

  🌀 L4 (Structural Fingerprint): 暴力美学，听天由命
  定位： 最后的救命稻草，基于 DOM 结构指纹。
  评价：
   1. 策略循环： 采用了 High -> Medium -> Loose
      的降级策略循环。虽然逻辑上通顺，但意味着在最坏情况下（恢复失
      败），用户浏览器要连续跑 4 轮昂贵的结构比对算法，导致严重的
      "失败惩罚" (Performance Penalty on Failure)。
   2. 递归风险： 虽然没看子模块代码，但结构匹配通常涉及递归遍历
      DOM。结合上述的重试机制，这是长任务（Long Task）的高发区。

  ---

  架构级问题

   1. 文本查找逻辑分裂：
       * L1: findTextNode + TreeWalker
       * L2: findTextNodePosition
       * L3: intelligentTextMatch + createRangeFromTextMatch
       * 锐评： 同样是"在元素里找文本"，写了 3-4
         套不同的实现。这违反了 DRY
         原则，且一旦需要处理特殊字符（如零宽空格、换行符），需要改
         4 个地方。

   2. DOM 操作过于频繁：
      大量的 createTreeWalker、querySelectorAll、textContent
  读取。在现代前端框架（React/Vue）高频更新 DOM
  的场景下，这套恢复逻辑如果作为 SelectionChange
  的回调或者是高频触发，会导致页面明显掉帧。

   3. 可调试性 vs 性能：
      代码中充斥着极度详细的
  logDebug，虽然对开发友好，但在生产构建中，如果参数构建（Object
  allocation）没有被完全 Tree-shaking 掉，光是拼装这些 Log
  对象就是不小的开销。

  改进建议 (Actionable Feedback)

   1. 净化 L1： 移除所有 "Adjustment" 和 "Fuzzy Search" 逻辑。ID
      匹配但 Range 无法还原 -> Fail。
   2. 重构 L3：
       * 禁止全局 TagName 查询。必须有 Class 或 ID 才能作为候选。
       * 移除 BEM 特定逻辑，改为通用的字符串相似度或单纯的 Class
         集合重合度。
   3. 统一基础设施： 提取一个高性能的 DOMTextSearcher 类，统一管理
      TreeWalker 和偏移量计算，供 L1-L4 复用。
   4. 限制搜索空间： 强制要求 L3/L4 必须在限定的
      Scope（如共同祖先容器）内运行，严禁在 document.body
      级别进行无索引搜索。

  一句话总结：
  为了追求"极致的恢复成功率"，牺牲了代码的可维护性和运行时的确定性
  。建议做减法。

# Range Kit Core - SOTA 演进路线图

当前版本 (v1.0) 的 L1-L4 恢复算法在工业级应用中表现稳健，但在抗干扰、歧义消除和极端性能场景下距离业界 SOTA (Hypothesis, Google Docs) 仍有差距。以下是通向 SOTA 的技术演进计划。

## 🚀 优先级 1：增强型歧义消除 (Disambiguation)
**目标**：在高度重复的内容（如列表、表格）中实现精准锚定。

- [ ] **加权上下文校验 (Weighted Context Validation)**
    - 目前 L3 仅利用了目标元素的文本匹配。
    - **SOTA 方案**：强制利用 `SerializedSelection.context` (Prefix/Suffix)。
    - 在 L3 筛选出多个候选元素时，计算每个候选元素的前文（Prefix）和后文（Suffix）与序列化数据的编辑距离。
    - 优先选择上下文匹配度最高的候选者，彻底解决 "10 个相同按钮中找第 3 个" 的难题。

## 🚀 优先级 2：模糊匹配引擎升级 (Fuzzy Matching 2.0)
**目标**：容忍内容被小幅修改（如错别字修正、标点变更）。

- [ ] **引入 Bitap / Myers 算法**
    - 目前 `fuzzyTextMatch` 是简单的词汇包含检查，不够精确且性能一般。
    - **SOTA 方案**：实现或引入轻量级的 **Bitap 算法** (参考 `google-diff-match-patch` 的精简版)。
    - 支持设置 "Fuzziness" (错误容忍度)，例如允许 32 字符中有 2 个差异。
    - 替换现有的 Levenshtein 实现（O(N*M) -> O(N)），大幅提升长文本匹配性能。

## 🚀 优先级 3：全局文本锚定 (Global Text Anchoring)
**目标**：彻底免疫 DOM 结构变化 (The "DOM-Agnostic" Grail)。

- [ ] **实现 W3C Text Quote Selector 策略**
    - 目前算法强依赖 DOM 节点搜索 (`querySelectorAll`)。
    - **SOTA 方案**：将页面视为纯文本流 (`document.body.innerText`)。
    - 建立 `Text Node <-> Global Offset` 的映射索引。
    - 直接在全局文本流中搜索目标文本（+上下文），定位到全局 Offset，再反向映射回 Range。
    - **优势**：完全无视 `div` 变 `span`、嵌套层级改变等 DOM 重构影响。

## 🛠️ 工程化优化
- [ ] **Shadow DOM 穿透**
    - 升级 `createTreeWalker` 和 `querySelectorAll` 逻辑，使其能够递归遍历 Open Shadow Roots。
- [ ] **分片哈希 (Sharding Hash)**
    - 对于超长文档，预先计算段落哈希。恢复时先匹配哈希，再精细匹配文本，避免全文扫描。
