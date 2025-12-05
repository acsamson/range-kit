# 修复后的 customCardComponent 参数传递使用指南

## 问题原因分析

`createCustomCard` 导致词典功能不可用的常见原因：

1. **组件包装破坏Vue组件结构** - 不正确的组件包装方式
2. **Props透传问题** - 系统参数没有正确传递给子组件
3. **Emit事件丢失** - 关闭事件没有正确处理
4. **组件实例化问题** - defineComponent使用不当

## 修复方案

### 1. 修复后的正确使用方式

```typescript
// ✅ 正确的使用方式 - 通过customCardProps传递自定义参数
const { rangeSDK, manualInit } = useRangeSdk({
  containerRef: containerRef,
  words: ['测试', '虚假', '演示'],
  appid: 5,
  autoInit: true,
  disableDefaultRequest: true,
  // 传递自定义参数
  customCardProps: {
    theme: 'dark',
    customTitle: '🌙 深色主题词典',
    subtitle: '自定义参数传递测试',
    icon: '🚀',
    showActions: true,
    debugMode: true,
    exportText: '导出词汇',
    shareText: '分享内容'
  }
});
```

### 2. 组件包装器的修复

修复后的 `use-rangesdk.ts` 中的包装逻辑：

```typescript
// 创建带自定义参数的组件包装器
const createEnhancedCard = () => {
  // 如果没有自定义参数，直接返回原组件
  if (Object.keys(customCardProps).length === 0) {
    return DictionaryCard;
  }

  // 创建包装组件，确保正确透传所有系统参数
  return defineComponent({
    name: 'EnhancedDictionaryCard',
    emits: ['close'], // ✅ 声明事件
    setup(props, { emit, attrs }) {
      // ✅ 合并系统参数和自定义参数
      const mergedProps = {
        ...props,
        ...attrs,
        ...customCardProps,
        // ✅ 确保关闭事件正确透传
        onClose: () => emit('close')
      };

      console.log('增强组件props:', mergedProps);

      return () => h(DictionaryCard, mergedProps);
    }
  });
};
```

### 3. 关键修复点

#### A. 正确的Props透传
```typescript
// ❌ 错误 - 会丢失系统参数
const mergedProps = customCardProps;

// ✅ 正确 - 保留所有系统参数
const mergedProps = {
  ...props,      // 系统传递的基础参数
  ...attrs,      // 额外的属性
  ...customCardProps, // 自定义参数
  onClose: () => emit('close') // 确保事件正确处理
};
```

#### B. 正确的事件处理
```typescript
// ❌ 错误 - 事件处理不当
setup(props) {
  return () => h(DictionaryCard, props);
}

// ✅ 正确 - 正确处理emit事件
setup(props, { emit, attrs }) {
  const mergedProps = {
    ...props,
    ...attrs,
    ...customCardProps,
    onClose: () => emit('close') // 关键！
  };
  return () => h(DictionaryCard, mergedProps);
}
```

#### C. 正确的组件声明
```typescript
// ✅ 声明组件支持的事件
return defineComponent({
  name: 'EnhancedDictionaryCard',
  emits: ['close'], // 必须声明
  setup(props, { emit, attrs }) {
    // ...
  }
});
```

### 4. 完整使用示例

#### Vue组件中使用：
```vue
<template>
  <div>
    <div ref="containerRef">
      <p>这里是需要词典功能的文本内容，包含"测试"和"虚假"等词汇。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRangeSdk } from '../hooks/use-rangesdk'

const containerRef = ref<HTMLElement>()

const {
  rangeSDK,
  manualInit,
  isInitialized
} = useRangeSdk({
  containerRef: containerRef,
  words: ['测试', '虚假', '演示', '功能'],
  appid: 5,
  autoInit: false, // 手动初始化
  disableDefaultRequest: true,
  // ✅ 传递自定义参数
  customCardProps: {
    theme: 'dark',
    customTitle: '🌙 深色主题词典',
    subtitle: '展示自定义参数传递',
    icon: '🚀',
    keywordsTitle: '📖 发现的词汇',
    footerText: '由增强版Range SDK驱动',
    showLoadButton: true,
    showDataSection: true,
    showActions: true,
    exportText: '📤 导出',
    shareText: '🔗 分享',
    debugMode: true // 开启调试模式
  }
});

onMounted(async () => {
  // 延迟初始化以确保DOM准备就绪
  setTimeout(() => {
    manualInit(['测试', '虚假', '演示']);
  }, 500);
});
</script>
```

### 5. 调试和验证

#### A. 检查组件是否正确接收参数
在浏览器控制台中查看：
```javascript
// 应该能看到类似输出：
// 增强组件props: {
//   keywords: ["测试", "虚假"],
//   dataLoader: function,
//   onClose: function,
//   theme: "dark",
//   customTitle: "🌙 深色主题词典",
//   ...
// }
```

#### B. 验证词典功能
1. 检查文本是否正确高亮
2. 点击高亮文本是否弹出卡片
3. 卡片是否应用了自定义样式
4. 关闭按钮是否正常工作

#### C. 常见问题排查
```typescript
// 如果词典功能不工作，检查：

// 1. 容器是否正确设置
console.log('Container:', containerRef.value);

// 2. 初始化是否成功
console.log('Is initialized:', isInitialized());

// 3. 组件是否正确包装
console.log('Custom props:', customCardProps);

// 4. 是否有JavaScript错误
// 打开浏览器开发者工具查看Console
```

### 6. 性能优化建议

```typescript
// ✅ 避免每次都创建新组件
const enhancedCardComponent = useMemo(() => {
  return createEnhancedCard();
}, [customCardProps]); // 只有customCardProps变化时才重新创建

// ✅ 合理使用自定义参数
const customCardProps = useMemo(() => ({
  theme: theme.value,
  customTitle: title.value,
  debugMode: process.env.NODE_ENV === 'development'
}), [theme.value, title.value]); // 依赖项变化时才更新
```

## 总结

修复后的方案确保了：

1. **系统参数正确透传** - keywords, dataLoader, onClose等核心参数不丢失
2. **事件正确处理** - 关闭事件能正常工作
3. **自定义参数生效** - 用户传递的参数能正确应用
4. **组件结构完整** - Vue组件的生命周期和特性正常工作

现在你可以安全地使用 `customCardProps` 来传递自定义参数，同时保持词典功能的完整性。