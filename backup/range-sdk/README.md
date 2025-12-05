```tsx
import { useDictionary } from '@ad-audit/range-sdk-plugin-dictionary';
import { RangeSdkAppId } from '@ad-audit/range-sdk';
import '@ad-audit/range-sdk-plugin-dictionary/dist/style.css';

// 使用词典功能
const { initDictionary } = useDictionary({
  appid: RangeSdkAppId.PMS,
  container: '.v2-edit-container-wrapper',
  // 可选: 使用 mock 模式，指定要高亮的词汇
  // useMock: ['虚假', '中危', '高危', '违规', '风险'],
  // 可选: 自定义高亮样式
  highlightStyle: {
    textDecoration: 'underline',
    textDecorationStyle: 'dashed',
    textDecorationColor: '#4285f4',
    textDecorationThickness: '2px',
    backgroundColor: 'unset',
    // backgroundColor: 'rgba(66, 133, 244, 0.1)',
    cursor: 'pointer', // 添加鼠标指针样式
  },
});

// 找个地方初始化就可以了
initDictionary({
  content: content.join('\n'),
});
```
