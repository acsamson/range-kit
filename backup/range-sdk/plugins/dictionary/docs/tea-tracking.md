# 词典插件埋点说明

## 埋点事件列表

### 1. 卡片展示 (DICTIONARY_CARD_SHOW)
**触发时机**：词典卡片展示时

**上报数据**：
```typescript
{
  section: {
    keywords: string[],        // 所有关键词
    firstKeyword: string,      // 第一个关键词
    keywordCount: number       // 关键词数量
  },
  data: {
    keywords: string[],        // 关键词列表
    keyword_count: number,     // 关键词数量
    has_multiple_tabs: boolean // 是否有多个tab
  }
}
```

### 2. 点赞事件 (DICTIONARY_CARD_LIKE)
**触发时机**：用户点击点赞按钮时

**上报数据**：
```typescript
{
  section: {
    word: string,             // 词条名称
    wordId: number           // 词条ID
  },
  data: {
    word: string,            // 词条名称
    word_id: number,         // 词条ID
    is_like: boolean,        // 是否点赞
    action: 'like' | 'unlike', // 操作类型
    has_content: boolean,    // 是否有内容
    has_images: boolean,     // 是否有图片
    has_tags: boolean,       // 是否有标签
    has_owners: boolean,     // 是否有负责人
    has_links: boolean       // 是否有链接
  }
}
```

### 3. Tab切换 (DICTIONARY_CARD_TAB_SWITCH)
**触发时机**：用户切换词条tab时

**上报数据**：
```typescript
{
  section: {
    keywords: string[],        // 所有关键词
    currentKeyword: string,    // 当前关键词
    previousKeyword: string    // 之前的关键词
  },
  data: {
    from_index: number,        // 从哪个索引
    to_index: number,          // 到哪个索引
    from_keyword: string,      // 从哪个词条
    to_keyword: string,        // 到哪个词条
    switch_count: number,      // 切换次数
    time_since_show: number    // 自展示以来的时间(ms)
  }
}
```

### 4. 停留时间 (DICTIONARY_CARD_STAY_TIME)
**触发时机**：卡片关闭时

**上报数据**：
```typescript
{
  section: {
    keywords: string[],          // 所有关键词
    lastViewedKeyword: string    // 最后查看的关键词
  },
  data: {
    stay_time: number,           // 停留时间(ms)
    tab_switch_count: number,    // tab切换次数
    viewed_keywords: string[],   // 查看过的词条
    viewed_count: number,        // 查看的词条数量
    total_keywords: number       // 总词条数量
  }
}
```

## 实现位置

### 组件集成
- **dictionary-card-lazy.vue**: 卡片展示、tab切换、停留时间埋点
- **dictionary-content.vue**: 点赞埋点

### 埋点核心文件
```
src/tea/
├── constants.ts  # 埋点事件名称定义
└── index.ts      # 埋点发送方法
```

## 使用示例

```typescript
import { sendTeaEvent } from '../tea'
import { TeaEventName } from '../tea/constants'

// 发送埋点
sendTeaEvent(TeaEventName.DICTIONARY_CARD_SHOW, {
  section: { /* 选区信息 */ },
  data: { /* 事件数据 */ }
})
```

## 数据分析价值

1. **用户行为分析**
   - 了解用户最常查看的词条
   - 分析词条的受欢迎程度
   - 统计用户停留时间

2. **产品优化依据**
   - 根据tab切换频率优化懒加载策略
   - 根据点赞数据优化内容质量
   - 根据停留时间优化信息展示

3. **性能监控**
   - 监控卡片加载时间
   - 分析懒加载效果
   - 优化用户体验

## 注意事项

1. 埋点数据需要脱敏，不包含敏感信息
2. 埋点发送失败不影响主流程
3. 埋点数据用于产品优化，不做其他用途