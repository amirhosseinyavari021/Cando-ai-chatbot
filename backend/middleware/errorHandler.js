/**
 * Handles requests to routes that do not exist (404).
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * The main error handling middleware. It catches all errors from async handlers
 * and ensures a consistent JSON response format.
 */
const errorHandler = (err, req, res, next) => {
  // Sometimes an error might come with a status code, otherwise default to 500 (Server Error)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Specific check for Mongoose's CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found.';
  }

  // --- Hide internal errors in production ---
  // If status is 500 in production, send a generic message
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'An internal server error occurred.';
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    // Show the error stack only in development mode for easier debugging
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

export { notFound, errorHandler };