/**
 * 调试系统入口文件
 * 提供统一的调试日志接口
 */

export * from './debug-logger';

// 重新导出主要接口供外部使用
export { debugLogger as default } from './debug-logger';
