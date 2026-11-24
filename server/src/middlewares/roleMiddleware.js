// Middleware de Control de Acceso Basado en Roles (RBAC)
export function autorizarRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'No autenticado.',
      })
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        ok: false,
        error: `Acceso denegado: El rol '${req.user.rol}' no tiene permisos para esta operación.`,
      })
    }

    next()
  }
}
