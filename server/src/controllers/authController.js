import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../db.js'

export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Debe ingresar el correo electrónico y la contraseña.',
      })
    }

    const usuario = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { profesional: true },
    })

    if (!usuario) {
      return res.status(401).json({
        ok: false,
        error: 'Credenciales inválidas. Verifique su correo o contraseña.',
      })
    }

    if (!usuario.activo) {
      return res.status(403).json({
        ok: false,
        error: 'Su cuenta ha sido desactivada. Comuníquese con el administrador.',
      })
    }

    const passwordValido = await bcrypt.compare(password, usuario.passwordHash)
    if (!passwordValido) {
      return res.status(401).json({
        ok: false,
        error: 'Credenciales inválidas. Verifique su correo o contraseña.',
      })
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET || 'barberflow_secure_jwt_secret_key_2026_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    )

    res.json({
      ok: true,
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        profesionalId: usuario.profesionalId,
        profesional: usuario.profesional,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function perfilActual(req, res, next) {
  try {
    res.json({
      ok: true,
      usuario: req.user,
    })
  } catch (err) {
    next(err)
  }
}
