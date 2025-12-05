# 词典插件优化总结

## 问题修复

### 1. 多卡片并发问题 ✅
**问题描述**：快速点击多个词条时，会同时出现多个卡片，且之前的卡片无法关闭。

**解决方案**：
- 实现了单例模式的 `CardManager` 卡片管理器
- 添加了请求取消机制（AbortController）
- 实现了防抖处理（50ms延迟）
- 确保全局只有一个卡片实例

**关键实现**：
```typescript
// CardManager 单例模式
class CardManager {
  private static instance: CardManager | null = null
  
  static getInstance(config?: CardManagerConfig): CardManager {
    if (!CardManager.instance) {
      CardManager.instance = new CardManager(config)
    }
    return CardManager.instance
  }
}

// 请求管理器
class RequestManager {
  async execute<T>(
    key: string,
    fetcher: (signal: AbortSignal) => Promise<T>,
    options: RequestOptions
  ): Promise<T>
}
```

### 2. 懒加载优化 ✅
**问题描述**：多个词条时会一次性加载所有数据，导致等待时间过长。

**解决方案**：
- 立即显示卡片，不等待数据加载
- 只加载第一个tab的数据
- 切换tab时按需加载对应数据
- 显示loading和空状态

**关键实现**：
```typescript
// 懒加载卡片显示
async showWithLazyLoad(options: LazyLoadCardOptions): Promise<void> {
  // 立即显示卡片
  this.doShowLazy(options)
}

// Vue组件中的懒加载
const loadTabData = async (index: number) => {
  if (tab.entry || tab.loading) return // 避免重复加载
  
  tab.loading = true
  const data = await props.dataLoader(tab.keyword)
  tab.entry = data
  tab.loading = false
}
```

## 技术亮点

### 1. SOTA（State-of-the-Art）方法
- **单例模式**：确保全局唯一卡片实例
- **请求取消**：使用 AbortController 实现请求取消
- **防抖处理**：避免快速点击导致的问题
- **懒加载**：按需加载，提升用户体验
- **状态管理**：完整的状态机（IDLE, LOADING, SHOWING, HIDDEN）

### 2. 用户体验优化
- **即时响应**：点击后立即显示卡片
- **加载指示**：清晰的loading状态
- **错误处理**：友好的错误提示和重试机制
- **tab指示**：显示哪些tab已加载、正在加载

### 3. 性能优化
- **并发控制**：限制同时请求数量（2个）
- **超时控制**：3秒超时，1次重试
- **资源清理**：组件销毁时自动清理

## 文件结构
```
src/
├── card-manager.ts          # 卡片管理器（单例）
├── utils/
│   └── request-manager.ts   # 请求管理器
├── components/
│   ├── dictionary-card-lazy.vue  # 懒加载卡片组件
│   └── dictionary-content.vue    # 内容显示组件
└── plugin.ts                # 插件主文件（更新）
```

## 使用示例
```typescript
// 显示卡片（懒加载模式）
await this.cardManager.showWithLazyLoad({
  target: element,
  keywords: ['词条1', '词条2'],
  dataLoader: async (keyword) => {
    // 按需加载数据
    return await fetchData(keyword)
  }
})
```

## 测试要点
1. 快速点击多个词条 → 只显示最后一个
2. 点击词条 → 立即显示卡片和loading
3. 多个tab → 只加载当前tab数据
4. 切换tab → 按需加载新数据
5. 网络慢/失败 → 显示错误和重试按钮

## 后续优化建议
1. 添加数据缓存机制，避免重复请求
2. 实现预加载策略（预加载下一个tab）
3. 添加骨架屏loading效果
4. 支持键盘操作（Tab切换、ESC关闭）
5. 添加动画过渡效果