// 类型测试文件 - 验证所有类型导入是否正确

import { createDictionaryPlugin, type DictionaryAPI } from './src/plugin'
import type {
  RangeSDKWithDictionary,
  RangeSDKEvents,
  RangeData,
  MarkData,
  CommentData,
  RangeSDKEventType
} from './src/range-sdk-types'

// 测试插件创建
const plugin = createDictionaryPlugin({
  mockData: {
    'test': {
      id: 1,
      word: 'test',
      content: 'test content',
      tags: ['test']
    }
  }
})

// 测试类型使用
function testTypes() {
  // 测试 RangeData 类型
  const rangeData: RangeData = {
    id: 'test',
    selectedText: 'test text',
    pageUrl: 'http://test.com',
    timestamp: Date.now(),
    startContainerPath: '/html/body',
    startOffset: 0,
    endContainerPath: '/html/body',
    endOffset: 10
  }

  // 测试 MarkData 类型
  const markData: MarkData = {
    id: 'mark-1',
    type: 'dictionary',
    isPublic: true
  }

  // 测试 CommentData 类型
  const commentData: CommentData = {
    id: 'comment-1',
    markId: 'mark-1',
    content: 'test comment',
    authorId: 'user-1',
    authorName: 'Test User',
    timestamp: Date.now(),
    createdAt: Date.now(),
    isResolved: false,
    isPinned: false
  }

  // 测试事件类型
  const eventHandler: RangeSDKEvents['range-selected'] = (data) => {
    console.log('Range selected:', data.selectedText)
  }

  // 测试枚举
  const eventType = RangeSDKEventType.RANGE_SELECTED

  console.log('所有类型测试通过')
}

export { testTypes }
