import prisma from '../db.js'

export async function getClientes(req, res, next) {
  try {
    const { buscar } = req.query
    const where = {}

    if (buscar) {
      const q = buscar.trim()
      where.OR = [
        { nombre: { contains: q } },
        { telefono: { contains: q } },
        { email: { contains: q } },
      ]
    }

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { visitas: 'desc' },
    })

    res.json({ ok: true, data: clientes })
  } catch (err) {
    next(err)
  }
}

export async function crearCliente(req, res, next) {
  try {
    const { nombre, telefono, email, notas } = req.body

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ ok: false, error: 'El nombre del cliente es obligatorio.' })
    }

    const nuevo = await prisma.cliente.create({
      data: {
        nombre: nombre.trim(),
        telefono: telefono?.trim() || '',
        email: email?.trim() || null,
        notas: notas?.trim() || '',
        visitas: 1,
        puntos: 0,
      },
    })

    res.status(201).json({ ok: true, data: nuevo })
  } catch (err) {
    next(err)
  }
}
