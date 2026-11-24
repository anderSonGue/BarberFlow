import bcrypt from 'bcryptjs'
import prisma from '../db.js'

export async function getProfesionales(req, res, next) {
  try {
    const profesionales = await prisma.profesional.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    })
    res.json({ ok: true, data: profesionales })
  } catch (err) {
    next(err)
  }
}

export async function getUsuarios(req, res, next) {
  try {
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        profesionalId: true,
        profesional: true,
        createdAt: true,
      },
      orderBy: { nombre: 'asc' },
    })
    res.json({ ok: true, data: usuarios })
  } catch (err) {
    next(err)
  }
}

export async function crearUsuario(req, res, next) {
  try {
    const { nombre, email, password, rol, profesionalId } = req.body

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ ok: false, error: 'Nombre, email, contraseña y rol son requeridos.' })
    }

    const existente = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (existente) {
      return res.status(400).json({ ok: false, error: 'Ya existe un usuario registrado con este correo electrónico.' })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const nuevo = await prisma.user.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        rol,
        profesionalId: profesionalId ? Number(profesionalId) : null,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        profesionalId: true,
        createdAt: true,
      },
    })

    res.status(201).json({ ok: true, data: nuevo })
  } catch (err) {
    next(err)
  }
}
