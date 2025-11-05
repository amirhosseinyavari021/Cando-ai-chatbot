export const notFound = (req, res, next) => {
  res.status(404);
  res.json({ ok: false, message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, _next) => {
  console.error("❌ ErrorHandler:", err);
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    ok: false,
    message: err?.message || "Server error",
  });
};
