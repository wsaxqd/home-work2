/**
 * 前端统一日志工具
 * 在生产环境自动禁用debug日志
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * 调试日志 - 仅开发环境输出
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * 信息日志
   */
  info: (...args: any[]) => {
    console.log('[INFO]', ...args);
  },

  /**
   * 警告日志
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * 错误日志 - 总是输出
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * 成功日志
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[SUCCESS]', ...args);
    }
  }
};
