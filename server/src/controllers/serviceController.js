import prisma from '../db.js'

export async function getServicios(req, res, next) {
  try {
    const servicios = await prisma.servicio.findMany({
      where: { activo: true },
      include: {
        receta: {
          include: { insumo: true },
        },
      },
      orderBy: { nombre: 'asc' },
    })
    res.json({ ok: true, data: servicios })
  } catch (err) {
    next(err)
  }
}

export async function crearServicio(req, res, next) {
  try {
    const { nombre, categoria, duracionMin, precio, receta } = req.body

    if (!nombre || !precio) {
      return res.status(400).json({ ok: false, error: 'Nombre y precio son requeridos.' })
    }

    const nuevo = await prisma.servicio.create({
      data: {
        nombre: nombre.trim(),
        categoria: categoria?.trim() || 'General',
        duracionMin: Number(duracionMin) || 30,
        precio: Number(precio) || 0,
        receta: receta && Array.isArray(receta)
          ? {
              create: receta.map((r) => ({
                insumoId: Number(r.insumoId),
                cantidadRequerida: Number(r.cantidadRequerida),
              })),
            }
          : undefined,
      },
      include: {
        receta: { include: { insumo: true } },
      },
    })

    res.status(201).json({ ok: true, data: nuevo })
  } catch (err) {
    next(err)
  }
}
