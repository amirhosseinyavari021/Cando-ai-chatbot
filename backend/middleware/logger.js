import winston from 'winston';
import Log from '../models/Log.js'; // .js اضافه شد

const { combine, timestamp, json, printf } = winston.format;

// فرمت سفارشی برای لاگ‌های کنسول
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} ${level}: ${message}`;
  if (Object.keys(metadata).length) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.File({
      filename: 'logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: combine(winston.format.colorize(), timestamp(), consoleFormat),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
});

// تابعی برای تنظیم لاگر در app
export const setupLogger = (app) => {
  app.locals.logger = logger;
};

// تابعی برای ذخیره لاگ در دیتابیس
export const createLogEntry = async (logData) => {
  try {
    const log = new Log(logData);
    await log.save();
  } catch (error) {
    // اگر ذخیره لاگ در دیتابیس شکست خورد، آن را در کنسول لاگ می‌کنیم
    logger.error('Failed to save log to database:', {
      error: error.message,
      logData,
    });
  }
};

// میان‌افزار لاگ HTTP
// FIX: این تابع اکسپورت می‌شود
export const httpLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      `[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      }
    );
  });
  next();
};

export default logger;