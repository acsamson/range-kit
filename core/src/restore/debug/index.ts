/**
 * 调试系统入口文件
 * 从 common/debug 重新导出，保持向后兼容
 */

export * from '../../common/debug';

// 重新导出主要接口供外部使用
export { debugLogger as default } from '../../common/debug';
