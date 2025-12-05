import { DictionaryConfig, LocalStorageReqParamsKey } from './types'
import { searchMatchedWords, getDictionary } from '../api'
import type { SearchMatchedWordsRequest, FindWordRequest, MatchedWords, WordData } from '../bam-auto-generate/bes.fe.web_core/namespaces/dictionary'
import { RangeSdkAppId } from '../../../src'

// 内部数据源实现
export class ApiDataSource {
  private config: DictionaryConfig
  private matchedWords: WordData[] = []
  
  constructor(config: DictionaryConfig) {
    this.config = config
  }

  // // 根据关键词搜索（用于内部搜索）
  // async search(keyword: string): Promise<WordData[]> {
  //   // 从已匹配的词条中过滤
  //   const filteredWords = this.matchedWords.filter(word => 
  //     word?.word?.toLowerCase().includes(keyword.toLowerCase())
  //   )
    
  //   // 获取详细信息
  //   const entries = await Promise.all(
  //     filteredWords.slice(0, 10).map(async word => {
  //       if (word?.id && word?.id > 0) {
  //         return this.getEntryById(word.id)
  //       } else if (word?.word) {
  //         return this.getEntryByWord(word.word)
  //       }
  //     })
  //   )
    
  //   return entries.filter(entry => entry !== null) as WordData[]
  // }

  // 批量获取词条
  async getEntries(ids: number[]): Promise<WordData[]> {
    const entries = await Promise.all(ids.map(id => this.getEntryById(id)))
    return entries.filter(entry => entry !== null) as WordData[]
  }

  // 获取匹配的词条列表
  getMatchedWords(): WordData[] {
    return this.matchedWords
  }

  // 根据词条ID获取词条详情
  async getEntryById(wordId: number): Promise<WordData | null> {
    try {
      // 从localStorage里获取临时外部传来的参数对象
      const extraParams = localStorage.getItem(LocalStorageReqParamsKey)
      const extraParamsObj = extraParams ? JSON.parse(extraParams) : {}

      const request: FindWordRequest = {
        appid: this.config.searchRequest?.appid || RangeSdkAppId.COMMON,
        word_id: wordId,
        ...extraParamsObj
      }
      
      console.log('🔍 调用 getDictionary API (by id)，请求参数:', request)
      const response = await getDictionary(request)
      console.log('📝 getDictionary API 响应:', response)

      // 清空localStorage里的临时参数
      localStorage.removeItem(LocalStorageReqParamsKey)

      if (response.word_data) {
        const wordData = response.word_data
        if (wordData.id && wordData.word) {
          return wordData
        }
        return null
      }
      return null
    } catch (error) {
      console.error('获取词条详情失败 (by id):', error)
      return null
    }
  }

  // 根据词名获取词条详情
  async getEntryByWord(word: string, wordData?: WordData): Promise<WordData | null> {
    try {
      // 从localStorage里获取临时外部传来的参数对象
      const extraParams = localStorage.getItem(LocalStorageReqParamsKey)
      const extraParamsObj = extraParams ? JSON.parse(extraParams) : {}
      const request: FindWordRequest = {
        appid: wordData?.appid || this.config.searchRequest?.appid || RangeSdkAppId.COMMON,
        word: word,
        // ...(wordData || {}),
        ...extraParamsObj
      }
      
      console.log('🔍 调用 getDictionary API (by word)，请求参数:', request)
      const response = await getDictionary(request)
      console.log('📝 getDictionary API 响应:', response)

      // 清空localStorage里的临时参数
      localStorage.removeItem(LocalStorageReqParamsKey)

      if (response.word_data) {
        const wordData = response.word_data
        if (wordData.id && wordData.word) {
          return wordData
        }
        return null;
      }
    } catch (error) {
      console.error('Failed to get dictionary entry by word:', error)
    }
    
    return null
  }
}
