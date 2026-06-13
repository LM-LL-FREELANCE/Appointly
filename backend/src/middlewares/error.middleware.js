export default function errorHandler(err, req, res) {
  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    timestamp: new Date().toISOString(),
    status: statusCode,
    code: err.code || "INTERNAL_ERROR",
    message: err.message,
    path: req.originalUrl,
    fieldErrors: err.fieldErrors || []
  })
}