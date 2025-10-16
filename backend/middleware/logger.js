import winston from 'winston';
import path from 'path';
import fs from 'fs'; // Import the File System module
import Log from '../models/Log.js';

// --- NEW CODE ---
// Ensure the log directory exists before initializing the logger
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
// --- END NEW CODE ---

// Setup winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      )
    }),
    // Use path.join to create the log file path correctly
    new winston.transports.File({ filename: path.join(logDir, 'app.log') })
  ]
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
    const log = new Log(logData);
    await log.save();
    
    const { userId, modelUsed, status, errorMessage } = logData;
    let fileLogMessage = `[AI_INTERACTION] USER: ${userId} | MODEL: ${modelUsed} | STATUS: ${status}`;
    if (errorMessage) {
      fileLogMessage += ` | ERROR: ${errorMessage}`;
    }
    logger.info(fileLogMessage);

  } catch (error) {
    logger.error(`Failed to save log to database: ${error.message}`);
  }
};

export default logger;