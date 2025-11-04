// A simple console logger stub to satisfy dependencies.
// For production, replace with Winston or Pino.

const logger = {
  info: (message) => {
    console.log(`[INFO] ${message}`);
  },
  warn: (message) => {
    console.warn(`[WARN] ${message}`);
  },
  error: (message) => {
    console.error(`[ERROR] ${message}`);
  },
  debug: (message) => {
    console.debug(`[DEBUG] ${message}`);
  },
};

/**
 * Mock function for logging AI requests to the database.
 */
export const createLogEntry = async (logData) => {
  // In a real app, this would save to the 'logs' collection
  // e.g., await Log.create(logData);
  logger.info(`[LogEntry] Provider: ${logData.provider}, Status: ${logData.status}, Latency: ${logData.latency}ms`);
};

export default logger;