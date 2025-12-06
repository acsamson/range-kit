/**
 * 序列化器模块主入口
 * 导出选区序列化相关功能
 */
export {
  // 核心类
  SelectionSerializer,
  createSerializer,

  // ID 工具
  generateUniqueId,

  // 路径和锚点提取
  getElementPath,
  getTextOffset,
  extractAnchorInfo,
  extractPathInfo,
  extractElementAnchor,
  extractMultipleAnchorInfo,

  // 结构信息提取
  extractParentChain,
  extractSiblingPattern,
  extractStructuralFingerprint,
  extractTextContext,

  // ID 过滤器配置
  registerIdFilter,
  clearIdFilter,
  setCustomIdConfig,
} from './serializer';
