export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500

  // Los 5xx son errores inesperados: logueamos el detalle en el servidor
  // pero NO lo exponemos al cliente para no filtrar internals (SQL, stack, etc.)
  if (statusCode >= 500) {
    console.error(err)
  }

  res.status(statusCode).json({
    timestamp: new Date().toISOString(),
    status: statusCode,
    code: err.code || "INTERNAL_ERROR",
    message: statusCode >= 500 ? "Error interno del servidor." : err.message,
    path: req.originalUrl,
    fieldErrors: err.fieldErrors || []
  })
}