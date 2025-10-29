import winston from 'winston';
import path from 'path';
import fs from 'fs'; // Import the File System module
import Log from '../models/Log.js'; // Ensure this model is updated or compatible

// Ensure the log directory exists before initializing the logger
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Setup winston logger
const logger = winston.createLogger({
  // Read log level from .env, default to 'info'
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`
    )
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    }),
    // Use path.join to create the log file path correctly
    new winston.transports.File({ filename: path.join(logDir, 'app.log') }),
  ],
});

/**
 * Middleware to log basic details of every incoming HTTP request.
 */
export const requestDetailsLogger = (req, res, next) => {
  logger.info(`Incoming Request: ${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
};

/**
 * Saves a detailed AI interaction log to the MongoDB database and file log.
 * @param {object} logData - The data to log.
 */
export const createLogEntry = async (logData) => {
  try {
    // Only save to DB if MONGODB_URI was provided
    if (process.env.MONGODB_URI) {
      const log = new Log(logData);
      await log.save();
    }

    const { userId, modelUsed, status, errorMessage, latency } = logData;
    let fileLogMessage = `[AI_INTERACTION] USER: ${userId} | MODEL: ${modelUsed} | STATUS: ${status} | LATENCY: ${latency || 'N/A'}ms`;
    if (errorMessage) {
      fileLogMessage += ` | ERROR: ${errorMessage}`;
    }
    logger.info(fileLogMessage);

  } catch (error) {
    // Log DB save failure to file/console only
    logger.error(`Failed to save log to database: ${error.message}`);
    // Log the original interaction to the file as a fallback
    if (logData.status === 'ERROR') {
      logger.error(`[AI_FALLBACK_LOG] ${JSON.stringify(logData)}`);
    } else {
      logger.info(`[AI_FALLBACK_LOG] ${JSON.stringify(logData)}`);
    }
  }
};

export default logger;