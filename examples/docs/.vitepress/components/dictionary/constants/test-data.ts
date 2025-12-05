/**
 * 词典演示的测试数据
 * 包含初始词汇和测试用例定义
 */

// 初始要高亮的词汇（使用 mock 方式）
export const initialWords = [
  'CORE', '词典', '函数', 'API', 'api', 'Api', 'QA', 'qa', 'Qa', '编程词典与技术',
  '虚假测试345', '虚假测试', '虚假测试3',
  'ABC123456', 'ABC12345', 'ABC1234', 'ABC123', 'ABC12', 'ABC1', 'ABC',
  'BC123', 'C123', '123456', '23456', '456'
]


// 通用高亮样式配置
export const commonHighlightStyle = {
  color: '#3370ff',
  borderBottom: '1px dashed #3370ff',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  padding: '0 2px',
}

// 模拟词典数据
export const mockDictionary = {
  'CORE': {
    id: 1,
    word: 'CORE',
    content: '<p><strong>CORE</strong> 是抖音电商的核心经营方法论。</p>',
    appid: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  '词典': {
    id: 2,
    word: '词典',
    content: '<p><strong>词典</strong> 是企业知识管理的重要工具。</p>',
    appid: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  '函数': {
    id: 3,
    word: '函数',
    content: '<p><strong>函数</strong> 是JavaScript中的核心概念。</p>',
    appid: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'API': {
    id: 4,
    word: 'API',
    content: '<p><strong>API</strong> (Application Programming Interface) 应用程序编程接口，大写形式。</p>',
    appid: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'api': {
    id: 5,
    word: 'api',
    content: '<p><strong>api</strong> 应用程序编程接口，小写形式。通常用于URL路径或变量名。</p>',
    appid: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'Api': {
    id: 6,
    word: 'Api',
    content: '<p><strong>Api</strong> 应用程序编程接口，首字母大写形式。常用于类名或命名空间。</p>',
    appid: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'QA': {
    id: 7,
    word: 'QA',
    content: '<p><strong>QA</strong> (Quality Assurance) 质量保证，大写形式。</p>',
    appid: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'qa': {
    id: 8,
    word: 'qa',
    content: '<p><strong>qa</strong> 质量保证，小写形式。通常用于环境名称如qa环境。</p>',
    appid: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'Qa': {
    id: 9,
    word: 'Qa',
    content: '<p><strong>Qa</strong> 质量保证，首字母大写形式。</p>',
    appid: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}