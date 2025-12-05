import { WordData } from '../bam-auto-generate/bes.fe.web_core/namespaces/dictionary'
import { DictionaryConfig } from './types'

/**
 * 模拟数据源 - 用于 demo 展示
 */
export class MockDataSource {
  private mockData: Record<string, WordData> = {}
  private words: string[] = []
  
  constructor(private config: DictionaryConfig) {
    // 从配置中提取词汇列表
    if (config.words) {
      this.words = config.words
    }
  }
  
  // 设置模拟数据
  setMockData(data: Record<string, WordData>): void {
    this.mockData = data
    // 更新词汇列表
    this.words = Object.keys(data)
  }
  
  // 初始化 - 返回匹配的词条
  async initialize(content?: string): Promise<WordData[]> {
    // 模拟返回所有词汇作为匹配项
    return this.words.map((word, index) => ({
      id: index + 1,
      word,
    }))
  }
  
  // 搜索词条
  async search(keyword: string): Promise<WordData[]> {
    const lowerKeyword = keyword.toLowerCase()
    const results: WordData[] = []
    
    // 先精确匹配
    if (this.mockData[keyword]) {
      results.push(this.mockData[keyword])
    }
    
    // 再模糊匹配
    Object.entries(this.mockData).forEach(([word, entry]) => {
      if (word !== keyword && word.toLowerCase().includes(lowerKeyword)) {
        results.push(entry)
      }
    })
    
    return results
  }
  
  // 根据词条ID获取词条详情
  async getEntryById(wordId: number): Promise<WordData | null> {
    // 在模拟数据中按ID查找
    const entry = Object.values(this.mockData).find(e => e.id === wordId)
    return entry || null
  }

  // 根据词汇获取词条详情
  async getEntryByWord(word: string): Promise<WordData | null> {
    // 先精确匹配
    if (this.mockData[word]) {
      return this.mockData[word]
    }
    
    // 再尝试别名匹配
    const entry = Object.values(this.mockData).find(e => 
      e.alias_words?.includes(word)
    )
    
    return entry || null
  }
  
  // 批量获取词条
  async getEntries(ids: number[]): Promise<WordData[]> {
    return ids
      .map(id => Object.values(this.mockData).find(e => e.id === id))
      .filter((entry): entry is WordData => entry !== undefined)
  }
}
