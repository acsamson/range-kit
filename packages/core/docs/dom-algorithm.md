# Range Kit 核心算法详解：四层级联恢复策略

本文档详细解析 `range-kit` 核心的 **四层级联恢复算法 (L1 - L4)**。这套算法旨在解决现代 Web 应用中因动态渲染、内容更新或 DOM 结构微调导致的选区丢失问题。

我们的设计哲学是：**从最精确的锚点开始，逐步降级到模糊特征匹配，确保在各种恶劣的 DOM 环境下仍能“找回”用户的高亮。**

---

## 🎯 概览：恢复漏斗 (The Recovery Funnel)

当尝试恢复一个选区时，系统会依次尝试以下策略。一旦某一层成功（Success），立即返回结果；如果失败（Fail），则无缝滑落到下一层。

```mermaid
graph TD
    Start(开始恢复选区) --> L1{L1: ID 锚点?}
    L1 -- 成功 --> Success((✅ 恢复成功))
    L1 -- 失败 --> L2{L2: DOM 路径?}
    L2 -- 成功 --> Success
    L2 -- 失败 --> L3{L3: 多锚点+上下文?}
    L3 -- 成功 --> Success
    L3 -- 失败 --> L4{L4: 结构指纹?}
    L4 -- 成功 --> Success
    L4 -- 失败 --> Failure((❌ 彻底失败))
```

---

## 1. 🆔 L1: ID 锚点恢复 (ID Anchor)

### 逻辑原理
这是最快、最精准的策略。如果序列化时记录的起始节点（Start Node）和结束节点（End Node）拥有 `id` 属性，且当前页面中这些 ID 依然存在，直接通过 `document.getElementById` 定位。

### 现实生活举例 🏠
**“按门牌号送快递”**
*   你告诉快递员：“把包裹送到 **贝克街 221B 号**”。
*   只要这条街的门牌号没变，快递员闭着眼睛都能送到，速度极快且绝对准确。

### 算法流程
```mermaid
sequenceDiagram
    participant R as Restorer
    participant D as DOM
    
    R->>D: 查找 startId (如 "para-123")
    R->>D: 查找 endId (如 "para-123")
    alt ID 均存在
        D-->>R: 返回元素
        R->>R: 根据 offset 恢复 Range
        R-->>User: ✅ 成功
    else ID 缺失
        D-->>R: 未找到
        R-->>User: ⬇️ 降级到 L2
    end
```

---

## 2. 🗺️ L2: DOM 路径恢复 (DOM Path)

### 逻辑原理
当元素没有 ID 时，我们记录它在 DOM 树中的“绝对路径”（CSS Selector 路径）。
例如：`body > div#app > article > p:nth-child(3) > span:nth-child(1)`。
恢复时，算法利用 `querySelector` 严格按照这个路径去寻找元素。

### 现实生活举例 🗺️
**“按藏宝图路线寻找”**
*   藏宝图上写着：“从大树出发，向北走 50 米，左转看到红色石头，再向前 10 步”。
*   **风险**：如果中间那块“红色石头”被人搬走了（DOM 结构插入了新元素），后面的路线就全错了。

### 算法流程
```mermaid
graph LR
    A[输入路径 String] --> B(解析选择器)
    B --> C{DOM 中存在该路径?}
    C -- 是 --> D[验证文本内容]
    D -- 匹配 --> E((✅ 成功))
    D -- 不匹配 --> F((⬇️ 降级 L3))
    C -- 否 --> F
```

---

## 3. ⚓ L3: 多锚点与上下文恢复 (Multiple Anchors) —— **核心防线**

### 逻辑原理
这是 `range-kit` 最强大的层级。当精确的 ID 和路径都失效时（例如 ID 丢失、路径因广告插入而偏移），L3 依靠**局部特征**来定位。

1.  **选择器降级**：如果找 `p#content` 失败，它会尝试找 `p.article-text`，甚至只找 `p` 标签。
2.  **候选集筛选**：找到所有可能的候选元素。
3.  **位置感知匹配**：
    *   对 **Start Element**：检查它是否包含选区的**前缀**。
    *   对 **End Element**：检查它是否包含选区的**后缀**。
4.  **无视空白 (NoSpace Strategy)**：如果 DOM 文本被格式化（多了换行/空格），算法会移除所有空白后进行比对，确保逻辑内容一致。

### 现实生活举例 🕵️
**“凭特征在人群中找人”**
*   你弄丢了朋友的电话号码（ID 丢失），但他告诉你：“我在星巴克旁边（上下文），穿着红衣服（Tag/Class），手里拿着一杯拿铁（文本内容）”。
*   即使他换了座位（路径变了），你依然能在人群中通过这些特征找到他。

### 算法流程
```mermaid
graph TD
    Start --> Find[寻找候选元素]
    Find --> Strategy{策略降级}
    Strategy -- 完整 ID --> Sel1[Tag + ID + Class]
    Strategy -- ID 丢失 --> Sel2[Tag + Class]
    Strategy -- 彻底模糊 --> Sel3[Tag Only]
    
    Sel1 & Sel2 & Sel3 --> Candidates[获取候选列表]
    Candidates --> Loop[遍历 Start/End 组合]
    
    Loop --> TextMatch{智能文本匹配}
    TextMatch -- 精确匹配 --> Success
    TextMatch -- 失败 --> IgnoreSpace{无视空白匹配?}
    IgnoreSpace -- 匹配 (ABC == A B C) --> Success((✅ 成功))
    IgnoreSpace -- 失败 --> Next[下一组候选]
    
    Next --> Loop
    Loop -- 无匹配 --> Fail((⬇️ 降级 L4))
```

---

## 4. 🧬 L4: 结构指纹恢复 (Structural Fingerprint)

### 逻辑原理
当文本内容本身也被修改（例如修正了错别字），导致 L3 无法匹配时，L4 登场。它不看“你是谁”（ID），也不看“你在哪”（Path），甚至不强求“你说什么”（Text），而是看**“你长什么样”**。

我们计算元素的**结构指纹**：
*   标签名 (Tag Name)
*   类名 (Class List)
*   深度 (Depth)
*   子节点数量 (Child Count)
*   兄弟节点模式 (Sibling Pattern - 前面是 h2，后面是 div)

算法在页面中扫描所有元素，计算**相似度得分 (Similarity Score)**。得分最高的元素即为目标，并在其内部进行模糊文本搜索。

### 现实生活举例 🎨
**“侧写师画像”**
*   目击者描述：“嫌疑人大概 1米8，国字脸，左边有个兄弟像高个子（Sibling），右边有个兄弟是个胖子”。
*   警察在嫌疑人列表中寻找**特征最相似**的人，虽然不能 100% 确定，但八九不离十。

### 算法流程
```mermaid
graph TD
    Input[序列化指纹] --> Scan[扫描全页同类标签]
    Scan --> Calc[计算相似度矩阵]
    
    Calc --> Factors[评分因子]
    Factors --> F1[属性匹配 15%]
    Factors --> F2[深度/子节点 20%]
    Factors --> F3[兄弟节点模式 50%]
    
    Calc --> Sort[按分数排序]
    Sort --> Top1[取 Top 1 元素]
    
    Top1 --> FuzzySearch[模糊文本搜索]
    FuzzySearch --> Success((✅ 最终尝试))
```

---

## 总结

| 层级 | 核心依赖 | 适用场景 | 抗干扰能力 | 速度 |
| :--- | :--- | :--- | :--- | :--- |
| **L1** | ID | 静态 ID，理想环境 | ⭐ | 🚀 极快 |
| **L2** | DOM 路径 | ID 缺失，结构未变 | ⭐⭐ | ⚡ 快 |
| **L3** | **特征+文本** | **动态内容，ID/结构微调** | ⭐⭐⭐⭐⭐ | 🐢 中等 |
| **L4** | 统计特征 | 内容修改，结构大变 | ⭐⭐⭐⭐ | 🐌 较慢 |

**Range Kit 的核心竞争力在于 L3 和 L4 的结合**，它使得选区恢复不再是脆弱的“全有或全无”，而是一个具备弹性的智能系统。
