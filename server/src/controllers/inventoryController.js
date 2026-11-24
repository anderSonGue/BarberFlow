import prisma from '../db.js'

export async function getInsumos(req, res, next) {
  try {
    const insumos = await prisma.insumo.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    })
    res.json({ ok: true, data: insumos })
  } catch (err) {
    next(err)
  }
}

export async function crearInsumo(req, res, next) {
  try {
    const { codigo, nombre, categoria, unidad, existencias, stockMinimo, costoUnitario } = req.body

    if (!nombre || !unidad) {
      return res.status(400).json({ ok: false, error: 'Nombre y unidad de medida son obligatorios.' })
    }

    const cod = codigo?.trim() || `INS-${Date.now().toString().slice(-5)}`

    const nuevo = await prisma.insumo.create({
      data: {
        codigo: cod,
        nombre: nombre.trim(),
        categoria: categoria?.trim() || 'Insumos',
        unidad: unidad.trim(),
        existencias: Number(existencias) || 0,
        stockMinimo: Number(stockMinimo) || 10,
        costoUnitario: Number(costoUnitario) || 0,
      },
    })

    // Si entra con existencias iniciales mayores a 0, registrar movimiento
    if (nuevo.existencias > 0) {
      await prisma.movimientoInventario.create({
        data: {
          insumoId: nuevo.id,
          tipo: 'ENTRADA',
          cantidadAnterior: 0,
          cantidadMovimiento: nuevo.existencias,
          cantidadResultante: nuevo.existencias,
          motivo: 'Inventario inicial al crear insumo',
          usuarioId: req.user.id,
        },
      })
    }

    res.status(201).json({ ok: true, data: nuevo })
  } catch (err) {
    next(err)
  }
}

export async function registrarEntrada(req, res, next) {
  try {
    const { id } = req.params
    const { cantidad, motivo } = req.body
    const cant = Number(cantidad)

    if (!cant || cant <= 0) {
      return res.status(400).json({ ok: false, error: 'La cantidad debe ser mayor a cero.' })
    }

    const insumoId = Number(id)

    // Transacción atómica
    const resultado = await prisma.$transaction(async (tx) => {
      const insumo = await tx.insumo.findUnique({ where: { id: insumoId } })
      if (!insumo) {
        throw new Error('Insumo no encontrado.')
      }

      const anterior = insumo.existencias
      const resultante = anterior + cant

      const actualizado = await tx.insumo.update({
        where: { id: insumoId },
        data: { existencias: resultante },
      })

      await tx.movimientoInventario.create({
        data: {
          insumoId,
          tipo: 'ENTRADA',
          cantidadAnterior: anterior,
          cantidadMovimiento: cant,
          cantidadResultante: resultante,
          motivo: motivo?.trim() || 'Abastecimiento de insumos',
          usuarioId: req.user.id,
        },
      })

      return actualizado
    })

    res.json({ ok: true, data: resultado })
  } catch (err) {
    next(err)
  }
}

export async function getMovimientos(req, res, next) {
  try {
    const { insumoId, tipo, limit } = req.query
    const where = {}

    if (insumoId) where.insumoId = Number(insumoId)
    if (tipo && tipo !== 'TODOS') where.tipo = tipo

    const movimientos = await prisma.movimientoInventario.findMany({
      where,
      include: {
        insumo: true,
        usuario: { select: { id: true, nombre: true, email: true, rol: true } },
        cliente: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: 'desc' },
      take: limit ? Number(limit) : 200,
    })

    res.json({ ok: true, data: movimientos })
  } catch (err) {
    next(err)
  }
}

export async function getHistorialPorCliente(req, res, next) {
  try {
    const { clienteId } = req.params
    const consumos = await prisma.consumoServicio.findMany({
      where: { clienteId: Number(clienteId) },
      include: {
        insumo: true,
        servicio: true,
        profesional: true,
        cita: true,
      },
      orderBy: { fecha: 'desc' },
    })

    res.json({ ok: true, data: consumos })
  } catch (err) {
    next(err)
  }
}

export async function getHistorialPorProducto(req, res, next) {
  try {
    const { insumoId } = req.params
    const consumos = await prisma.consumoServicio.findMany({
      where: { insumoId: Number(insumoId) },
      include: {
        cliente: true,
        servicio: true,
        profesional: true,
        cita: true,
      },
      orderBy: { fecha: 'desc' },
    })

    res.json({ ok: true, data: consumos })
  } catch (err) {
    next(err)
  }
}
