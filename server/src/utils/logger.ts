import * as winston from 'winston';
import * as path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';

// 日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 根据环境设置日志级别
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// 日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// 日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 控制台输出格式（带颜色）
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// 日志目录
const logDir = process.env.LOG_DIR || 'logs';

// 日志传输配置
const transports: winston.transport[] = [
  // 控制台输出
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // 错误日志文件（按日期轮转）
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format,
    maxFiles: '30d',
    maxSize: '20m',
    zippedArchive: true,
  }),
  // 所有日志文件（按日期轮转）
  new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format,
    maxFiles: '30d',
    maxSize: '20m',
    zippedArchive: true,
  }),
  // HTTP请求日志（按日期轮转）
  new DailyRotateFile({
    filename: path.join(logDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format,
    maxFiles: '7d',
    maxSize: '20m',
    zippedArchive: true,
  }),
];

// 创建 logger 实例
const winstonLogger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // 处理未捕获的异常
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'exceptions.log'),
    }),
  ],
  // 处理未处理的 Promise 拒绝
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'rejections.log'),
    }),
  ],
});

// 导出兼容旧接口的 logger
export const logger = {
  debug: (...args: any[]) => {
    winstonLogger.debug(args.join(' '));
  },
  info: (...args: any[]) => {
    winstonLogger.info(args.join(' '));
  },
  warn: (...args: any[]) => {
    winstonLogger.warn(args.join(' '));
  },
  error: (...args: any[]) => {
    winstonLogger.error(args.join(' '));
  },
  success: (...args: any[]) => {
    winstonLogger.info('[SUCCESS] ' + args.join(' '));
  },
  http: (...args: any[]) => {
    winstonLogger.http(args.join(' '));
  },
};

// 导出 winston 实例（用于高级用法）
export default winstonLogger;
