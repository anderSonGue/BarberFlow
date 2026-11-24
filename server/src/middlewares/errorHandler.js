export function errorHandler(err, req, res, next) {
  console.error('[Error del Servidor]:', err)

  // Mensaje amigable y estandarizado
  const statusCode = err.statusCode || 500
  const message = err.message || 'Error interno del servidor.'

  res.status(statusCode).json({
    ok: false,
    error: message,
    detalles: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
}
