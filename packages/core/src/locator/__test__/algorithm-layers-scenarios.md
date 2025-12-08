# 算法层级测试场景 (L1-L4)

## 🎯 测试目标
系统性测试选区恢复算法的四层降级机制，验证每一层的触发条件、成功率和降级策略的正确性。

## 📋 算法层级架构

### 层级优先级
1. **L1 - ID锚点恢复**: 基于元素ID的快速精确恢复
2. **L2 - 原始路径恢复**: 基于CSS选择器路径的结构化恢复  
3. **L3 - 多重锚点恢复**: 基于标签和内容特征的灵活恢复
4. **L4 - 结构指纹恢复**: 基于DOM结构相似度的语义恢复

## 🔬 L1层测试场景（ID锚点恢复）

### L1.1 理想成功场景
- **触发条件**: ID属性完全保持不变
- **例子**:
  ```html
  <!-- 原始 -->
  <div id="content-123">
    <p id="para-456">目标段落</p>
    <span id="span-789">其他内容</span>
  </div>
  选区: "目标段落其他内容" (跨p→span)
  
  <!-- 变化：内容增减但ID保持 -->
  <div id="content-123">
    <h3>新增标题</h3>
    <p id="para-456">目标段落（已修改）</p>
    <em>插入内容</em>
    <span id="span-789">其他内容</span>
    <footer>新增底部</footer>
  </div>
  期望: L1成功，选区恢复到"目标段落（已修改）其他内容"
  ```

### L1.2 部分ID丢失场景
- **触发条件**: 选区涉及的部分元素ID消失
- **例子**:
  ```html
  <!-- 原始 -->
  <section id="main">
    <p id="start">开始文本</p>
    <p id="middle">中间文本</p>
    <p id="end">结束文本</p>
  </section>
  选区: "开始文本中间文本结束文本" (跨三个p)
  
  <!-- 变化：middle元素失去ID -->
  <section id="main">
    <p id="start">开始文本</p>
    <p class="middle">中间文本</p>  <!-- ID消失 -->
    <p id="end">结束文本</p>
  </section>
  期望: L1部分失败，降级到L2
  ```

### L1.3 ID值变化场景
- **触发条件**: ID值发生变化
- **例子**:
  ```html
  <!-- 原始 -->
  <article id="article-v1">
    <h2 id="title-old">文章标题</h2>
    <div id="content-old">文章内容</div>
  </article>
  选区: "文章标题文章内容"
  
  <!-- 变化：ID值更新 -->
  <article id="article-v2">
    <h2 id="title-new">文章标题</h2>
    <div id="content-new">文章内容</div>
  </article>
  期望: L1完全失败，降级到L2
  ```

### L1.4 ID冲突场景
- **触发条件**: 页面出现重复ID
- **例子**:
  ```html
  <!-- 原始：唯一ID -->
  <div id="unique-123">原始内容</div>
  选区: "原始内容"
  
  <!-- 变化：ID重复 -->
  <div>
    <div id="unique-123">第一个重复</div>
    <div id="unique-123">第二个重复</div>  <!-- 非法：重复ID -->
  </div>
  期望: L1检测到歧义，降级到L2
  ```

## 🔧 L2层测试场景（原始路径恢复）

### L2.1 结构保持场景
- **触发条件**: L1失败但DOM结构基本保持
- **例子**:
  ```html
  <!-- 原始 -->
  <main>
    <section class="content">
      <article>
        <h2>标题</h2>
        <p>段落1</p>
        <p>段落2</p>
      </article>
    </section>
  </main>
  选区: "标题段落1" (h2→p)
  CSS路径: "main > section.content > article > h2", "main > section.content > article > p:nth-child(2)"
  
  <!-- 变化：移除ID但结构保持 -->
  <main>
    <section class="content">
      <article>
        <h2>标题</h2>
        <p>段落1</p>
        <p>段落2</p>
        <p>新段落3</p>  <!-- 新增但不影响原路径 -->
      </article>
    </section>
  </main>
  期望: L2成功，路径依然有效
  ```

### L2.2 类名变化场景
- **触发条件**: 类名变化导致路径失效
- **例子**:
  ```html
  <!-- 原始 -->
  <div class="container main-content">
    <section class="article-list">
      <div class="article">内容</div>
    </section>
  </div>
  选区: "内容"
  CSS路径: "div.main-content > section.article-list > div.article"
  
  <!-- 变化：类名重构 -->
  <div class="wrapper content-area">  <!-- 类名完全变化 -->
    <section class="post-list">       <!-- 类名变化 -->
      <div class="post">内容</div>    <!-- 类名变化 -->
    </section>
  </div>
  期望: L2失败，降级到L3
  ```

### L2.3 元素顺序变化场景
- **触发条件**: 元素位置变化影响nth-child路径
- **例子**:
  ```html
  <!-- 原始 -->
  <ul>
    <li>项目1</li>
    <li>项目2</li>
    <li>目标项目</li>  <!-- nth-child(3) -->
    <li>项目4</li>
  </ul>
  选区: "目标项目"
  CSS路径: "ul > li:nth-child(3)"
  
  <!-- 变化：在前面插入元素 -->
  <ul>
    <li>新项目A</li>  <!-- 新插入 -->
    <li>新项目B</li>  <!-- 新插入 -->
    <li>项目1</li>
    <li>项目2</li>
    <li>目标项目</li>  <!-- 现在是nth-child(5) -->
    <li>项目4</li>
  </ul>
  期望: L2失败（nth-child不匹配），降级到L3
  ```

### L2.4 嵌套层级变化场景
- **触发条件**: DOM嵌套深度改变
- **例子**:
  ```html
  <!-- 原始 -->
  <div class="page">
    <main>
      <p>目标文本</p>
    </main>
  </div>
  选区: "目标文本"
  CSS路径: "div.page > main > p"
  
  <!-- 变化：增加嵌套层级 -->
  <div class="page">
    <div class="layout">      <!-- 新增层级 -->
      <section class="content"> <!-- 新增层级 -->
        <main>
          <p>目标文本</p>
        </main>
      </section>
    </div>
  </div>
  期望: L2失败（路径不匹配），降级到L3
  ```

## 🎯 L3层测试场景（多重锚点恢复）

### L3.1 标签类型匹配场景
- **触发条件**: L1/L2失败但标签类型保持
- **例子**:
  ```html
  <!-- 原始 -->
  <article>
    <h3 id="title">章节标题</h3>
    <p class="intro">介绍段落</p>
    <div class="content">正文内容</div>
  </article>
  选区: "章节标题介绍段落正文内容" (h3→p→div)
  锚点: h3[章节标题], p[介绍段落], div[正文内容]
  
  <!-- 变化：ID/类名全部变化，但标签类型保持 -->
  <section>
    <h3 class="new-title">章节标题</h3>      <!-- h3保持 -->
    <p id="new-intro">介绍段落</p>          <!-- p保持 -->
    <div data-content="main">正文内容</div>  <!-- div保持 -->
  </section>
  期望: L3成功，通过h3→p→div标签序列匹配
  ```

### L3.2 内容特征匹配场景
- **触发条件**: 标签变化但内容特征保持
- **例子**:
  ```html
  <!-- 原始 -->
  <div>
    <h2>用户指南</h2>
    <ul>
      <li>步骤一</li>
      <li>步骤二</li>
    </ul>
    <p>总结说明</p>
  </div>
  选区: "用户指南步骤一总结说明" (h2→li→p)
  内容锚点: "用户指南"(开始), "步骤一"(中间), "总结说明"(结束)
  
  <!-- 变化：标签类型改变但内容保持 -->
  <section>
    <h1>用户指南</h1>      <!-- h2→h1 -->
    <ol>                   <!-- ul→ol -->
      <li>步骤一</li>      <!-- li保持 -->
      <li>步骤二</li>
    </ol>
    <div>总结说明</div>   <!-- p→div -->
  </section>
  期望: L3成功，通过内容特征匹配
  ```

### L3.3 部分锚点丢失场景
- **触发条件**: 部分锚点元素消失
- **例子**:
  ```html
  <!-- 原始 -->
  <div>
    <h3>开始锚点</h3>
    <p>中间锚点</p>
    <span>结束锚点</span>
  </div>
  选区: "开始锚点中间锚点结束锚点"
  锚点: h3[开始], p[中间], span[结束]
  
  <!-- 变化：中间锚点消失 -->
  <div>
    <h3>开始锚点</h3>
    <!-- 中间锚点元素完全消失 -->
    <span>结束锚点</span>
  </div>
  期望: L3部分成功，找到"开始锚点结束锚点"
  ```

### L3.4 锚点内容变化场景
- **触发条件**: 锚点元素内容发生变化
- **例子**:
  ```html
  <!-- 原始 -->
  <div>
    <h4>原始标题</h4>
    <p>原始内容</p>
  </div>
  选区: "原始标题原始内容"
  锚点: h4[原始标题], p[原始内容]
  
  <!-- 变化：内容完全改变 -->
  <div>
    <h4>新的标题</h4>
    <p>新的内容</p>
  </div>
  期望: L3失败（内容不匹配），降级到L4
  ```

## 🧠 L4层测试场景（结构指纹恢复）

### L4.1 语义结构保持场景
- **触发条件**: 前三层都失败，但语义结构相似
- **例子**:
  ```html
  <!-- 原始 -->
  <article class="blog-post">
    <header>
      <h2>文章标题</h2>
      <time>2024-01-01</time>
    </header>
    <main>
      <p>文章正文第一段</p>
      <p>文章正文第二段</p>
    </main>
    <footer>
      <span>作者信息</span>
    </footer>
  </article>
  选区: "文章标题文章正文第一段" (header→main跨越)
  结构指纹: [header[h2,time], main[p,p]], 深度3, 标签分布{header:1,h2:1,time:1,main:1,p:2}
  
  <!-- 变化：完全重构但语义相似 -->
  <section class="post-content">
    <div class="post-header">
      <h1>文章标题</h1>          <!-- h2→h1但仍是标题 -->
      <span>2024-01-01</span>    <!-- time→span但位置相同 -->
    </div>
    <div class="post-body">
      <div>文章正文第一段</div>  <!-- p→div但内容相似 -->
      <div>文章正文第二段</div>
    </div>
    <div class="post-meta">
      <span>作者信息</span>
    </div>
  </section>
  期望: L4成功，通过结构相似度匹配
  ```

### L4.2 内容分布模式匹配
- **触发条件**: DOM结构变化但内容分布模式相似
- **例子**:
  ```html
  <!-- 原始 -->
  <div class="layout-3col">
    <aside class="sidebar">侧边栏</aside>
    <main class="content">主要内容</main>
    <nav class="navigation">导航菜单</nav>
  </div>
  选区: "侧边栏主要内容" (aside→main)
  分布模式: [短文本, 长文本, 中等文本], 3列布局
  
  <!-- 变化：布局重构为不同结构 -->
  <section class="flex-layout">
    <header class="top-nav">导航菜单</header>  <!-- nav移到顶部 -->
    <div class="main-area">
      <div class="left-panel">侧边栏</div>     <!-- aside→div -->
      <div class="content-area">主要内容</div>  <!-- main→div -->
    </div>
  </section>
  期望: L4通过内容分布模式识别对应关系
  ```

### L4.3 结构复杂度匹配场景
- **触发条件**: 复杂嵌套结构的相似度计算
- **例子**:
  ```html
  <!-- 原始：复杂表格结构 -->
  <table class="data-grid">
    <thead>
      <tr><th>列1</th><th>列2</th><th>列3</th></tr>
    </thead>
    <tbody>
      <tr><td>数据1</td><td>数据2</td><td>数据3</td></tr>
      <tr><td>数据4</td><td>数据5</td><td>数据6</td></tr>
    </tbody>
  </table>
  选区: "列1数据1数据4" (第一列)
  结构复杂度: 表格3x3，头部+主体结构
  
  <!-- 变化：表格转换为卡片布局 -->
  <div class="card-grid">
    <div class="card-header">
      <span class="col1">列1</span>
      <span class="col2">列2</span>
      <span class="col3">列3</span>
    </div>
    <div class="card-body">
      <div class="row">
        <span class="col1">数据1</span>
        <span class="col2">数据2</span>
        <span class="col3">数据3</span>
      </div>
      <div class="row">
        <span class="col1">数据4</span>
        <span class="col2">数据5</span>
        <span class="col3">数据6</span>
      </div>
    </div>
  </div>
  期望: L4通过结构模式识别列对应关系
  ```

### L4.4 完全失败场景
- **触发条件**: 所有层级都无法恢复
- **例子**:
  ```html
  <!-- 原始 -->
  <div class="news-article">
    <h1>新闻标题</h1>
    <p>新闻内容第一段</p>
    <p>新闻内容第二段</p>
  </div>
  选区: "新闻标题新闻内容第一段"
  
  <!-- 变化：完全不同的内容和结构 -->
  <form class="contact-form">
    <label>姓名</label>
    <input type="text">
    <label>邮箱</label>
    <input type="email">
    <button>提交</button>
  </form>
  期望: L4失败，返回恢复失败状态
  ```

## 📊 层级降级测试矩阵

### 降级路径验证
| 场景类型 | L1结果 | L2结果 | L3结果 | L4结果 | 最终结果 |
|---------|--------|--------|--------|--------|----------|
| ID保持 | ✅成功 | - | - | - | L1成功 |
| ID变化，结构保持 | ❌失败 | ✅成功 | - | - | L2成功 |
| 结构变化，标签保持 | ❌失败 | ❌失败 | ✅成功 | - | L3成功 |
| 语义结构相似 | ❌失败 | ❌失败 | ❌失败 | ✅成功 | L4成功 |
| 完全不相关 | ❌失败 | ❌失败 | ❌失败 | ❌失败 | 恢复失败 |

### 性能基准测试
| 算法层 | 期望执行时间 | 成功率要求 | 适用场景 |
|--------|-------------|-----------|----------|
| L1 | < 10ms | > 95% | 动态内容更新 |
| L2 | < 30ms | > 90% | 样式重构 |
| L3 | < 100ms | > 80% | DOM重构 |
| L4 | < 300ms | > 60% | 页面重设计 |

### 置信度评分标准
- **L1**: 0.9-1.0 (ID完全匹配)
- **L2**: 0.7-0.9 (路径匹配度)
- **L3**: 0.5-0.8 (锚点匹配度)
- **L4**: 0.3-0.7 (结构相似度)

## 🔧 实施建议

### 测试优先级
1. **核心路径**: 重点测试L1→L2降级的常见场景
2. **边界情况**: 验证L3→L4的复杂场景处理
3. **失败处理**: 确保优雅降级和错误报告

### 自动化测试策略
1. **矩阵测试**: 系统化生成各种降级场景
2. **性能监控**: 实时监控各层执行时间
3. **成功率统计**: 长期跟踪各层成功率趋势 