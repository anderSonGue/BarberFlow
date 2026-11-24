import jwt from 'jsonwebtoken'
import prisma from '../db.js'

export async function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: 'Acceso no autorizado: Token no proporcionado.',
    })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'barberflow_secure_jwt_secret_key_2026_production')
    const usuario = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { profesional: true },
    })

    if (!usuario || !usuario.activo) {
      return res.status(403).json({
        ok: false,
        error: 'Usuario inactivo o no encontrado.',
      })
    }

    req.user = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      profesionalId: usuario.profesionalId,
      profesional: usuario.profesional,
    }

    next()
  } catch (err) {
    return res.status(401).json({
      ok: false,
      error: 'Sesión inválida o expirada. Por favor inicie sesión nuevamente.',
    })
  }
}
