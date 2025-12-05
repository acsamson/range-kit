
/**
 * @file https://cloud.bytedance.net/bam/rd/bes.fe.web_core/api_doc/show_doc?cluster=default&x-resource-account=public&x-bc-region-id=bytedance&version=1.0.27&api_branch=dict%2Ffeat%2Fcore&endpoint_id=3345131
 * @description bam 接口
 */

import { http } from '../../../src/io';
import type { BatchFindWordsRequest, BatchFindWordsResponse, BuildWordsCacheRequest, BuildWordsCacheResponse, CreateWordRequest, CreateWordResponse, DelWordRequest, DelWordResponse, FindWordRequest, FindWordResponse, GetWordsTotalRequest, GetWordsTotalResponse, ListAppRequest, ListAppResponse, SearchMatchedWordsRequest, SearchMatchedWordsResponse, UpdateWordRequest, UpdateWordResponse } from '../bam-auto-generate/bes.fe.web_core/namespaces/dictionary';

// get: /api/core/dictionary/find_word
export const getDictionary = async (params: FindWordRequest): Promise<FindWordResponse> => {
  try {
    const response = await http.get<FindWordResponse>('/api/core/dictionary/find_word', params);
    return response;
  } catch (error) {
    console.error('获取词典详情失败:', error);
    throw error;
  }
};

// get: /api/core/dictionary/get_words_total
export const getWordsTotal = async (params: GetWordsTotalRequest): Promise<GetWordsTotalResponse> => {
  try {
    const response = await http.get<GetWordsTotalResponse>('/api/core/dictionary/get_words_total', params);
    return response;
  } catch (error) {
    console.error('获取词典总数失败:', error);
    throw error;
  }
};

// get: /api/core/dictionary/app_list
export const getAppList = async (params: ListAppRequest): Promise<ListAppResponse> => {
  try {
    const response = await http.get<ListAppResponse>('/api/core/dictionary/app_list', params);
    return response;
  } catch (error) {
    console.error('获取应用列表失败:', error);
    throw error;
  }
};

// post: /api/core/dictionary/build_words_cache
export const buildWordsCache = async (params: BuildWordsCacheRequest): Promise<BuildWordsCacheResponse> => {
  try {
    const response = await http.post<BuildWordsCacheResponse>('/api/core/dictionary/build_words_cache', params);
    return response;
  } catch (error) {
    console.error('构建词典缓存失败:', error);
    throw error;
  }
};

// post: /api/core/dictionary/search_matched_words
export const searchMatchedWords = async (params: SearchMatchedWordsRequest): Promise<SearchMatchedWordsResponse> => {
  try {
    const response = await http.post<SearchMatchedWordsResponse>('/api/core/dictionary/search_matched_words', params);
    return response;
  } catch (error) {
    throw error;
  }
};

// post: /api/core/dictionary/batch_find_words
export const batchFindWords = async (params: BatchFindWordsRequest): Promise<BatchFindWordsResponse> => {
  try {
    const response = await http.post<BatchFindWordsResponse>('/api/core/dictionary/batch_find_words', params);
    return response;
  } catch (error) {
    throw error;
  }
};

// post: /api/core/dictionary/del_word
export const delWord = async (params: DelWordRequest): Promise<DelWordResponse> => {
  try {
    const response = await http.post<DelWordResponse>('/api/core/dictionary/del_word', params);
    return response;
  } catch (error) {
    console.error('删除词条失败:', error);
    throw error;
  }
};

// post: /api/core/dictionary/create_word
export const createWord = async (params: CreateWordRequest): Promise<CreateWordResponse> => {
  try {
    const response = await http.post<CreateWordResponse>('/api/core/dictionary/create_word', params);
    return response;
  } catch (error) {
    console.error('创建词条失败:', error);
    throw error;
  }
};

// post: /api/core/dictionary/update_word
export const updateWord = async (params: UpdateWordRequest): Promise<UpdateWordResponse> => {
  try {
    const response = await http.post<UpdateWordResponse>('/api/core/dictionary/update_word', params);
    return response;
  } catch (error) {
    console.error('更新词条失败:', error);
    throw error;
  }
};
