import prisma from '../db.js'

const PROMOS = {
  BARBA10: { tipo: 'PORCENTAJE', valor: 10 },
  FLOW20: { tipo: 'PORCENTAJE', valor: 20 },
  CLIENTE_VIP: { tipo: 'FIJO', valor: 5000 },
}

const PESOS_POR_PUNTO = 1000 // 1 punto por cada $1.000 COP pagados
const VALOR_PUNTO = 20 // $20 COP por punto canjeado

export async function registrarPago(req, res, next) {
  try {
    const { citaId, metodo, codigoPromo, canjearPuntos } = req.body

    if (!citaId) {
      return res.status(400).json({ ok: false, error: 'Identificador de cita requerido.' })
    }

    const idCita = Number(citaId)

    // Ejecutar cobro, deducción de inventario, cálculo de comisiones y fidelización dentro de una transacción atómica
    const resultadoPago = await prisma.$transaction(async (tx) => {
      // 1. Obtener y validar cita con sus servicios y recetas
      const cita = await tx.cita.findUnique({
        where: { id: idCita },
        include: {
          cliente: true,
          profesional: true,
          servicios: {
            include: {
              servicio: {
                include: {
                  receta: {
                    include: { insumo: true },
                  },
                },
              },
            },
          },
          pago: true,
        },
      })

      if (!cita) {
        throw new Error('La cita solicitada no existe.')
      }

      if (cita.estado !== 'EN_ATENCION') {
        throw new Error(`Solo se pueden cobrar citas en estado 'En Atención'. Estado actual: '${cita.estado}'.`)
      }

      if (cita.pago) {
        throw new Error('Esta cita ya tiene un pago registrado previamente.')
      }

      // 2. Calcular consumo total consolidado de insumos requeridos
      const consumoConsolidado = new Map() // insumoId -> { insumo, cantidadTotal, servicios: [] }

      for (const cs of cita.servicios) {
        const serv = cs.servicio
        if (serv.receta && serv.receta.length > 0) {
          for (const itemReceta of serv.receta) {
            const current = consumoConsolidado.get(itemReceta.insumoId) || {
              insumoId: itemReceta.insumoId,
              insumo: itemReceta.insumo,
              cantidadTotal: 0,
              servicioId: serv.id,
            }
            current.cantidadTotal += itemReceta.cantidadRequerida
            consumoConsolidado.set(itemReceta.insumoId, current)
          }
        }
      }

      // 3. REGLA INQUEBRANTABLE: Validar existencias en tiempo real dentro de la transacción
      for (const [insumoId, reqInfo] of consumoConsolidado.entries()) {
        // Bloqueo y lectura fresca del insumo
        const insumoActual = await tx.insumo.findUnique({
          where: { id: insumoId },
        })

        if (!insumoActual || !insumoActual.activo) {
          throw new Error(`El insumo '${reqInfo.insumo.nombre}' no se encuentra activo o disponible.`)
        }

        if (insumoActual.existencias < reqInfo.cantidadTotal) {
          throw new Error(
            `INVENTARIO INSUFICIENTE: Se requieren ${reqInfo.cantidadTotal} ${insumoActual.unidad} de '${insumoActual.nombre}', pero solamente existen ${insumoActual.existencias} ${insumoActual.unidad} disponibles en stock. Operación cancelada.`
          )
        }
      }

      // 4. Calcular importes financieros, promociones y canje de puntos
      const subtotal = cita.servicios.reduce((sum, cs) => sum + cs.precio, 0)
      let descuento = 0

      if (codigoPromo && codigoPromo.trim()) {
        const promo = PROMOS[codigoPromo.trim().toUpperCase()]
        if (!promo) {
          throw new Error('El código promocional ingresado no es válido o está vencido.')
        }
        if (promo.tipo === 'PORCENTAJE') {
          descuento += Math.round((subtotal * promo.valor) / 100)
        } else if (promo.tipo === 'FIJO') {
          descuento += Math.min(promo.valor, subtotal)
        }
      }

      let puntosCanjeados = 0
      const saldoPuntosCliente = cita.cliente.puntos || 0

      if (canjearPuntos && saldoPuntosCliente > 0) {
        const maxCanjeablePesos = Math.max(0, subtotal - descuento)
        puntosCanjeados = Math.min(saldoPuntosCliente, Math.floor(maxCanjeablePesos / VALOR_PUNTO))
        descuento += puntosCanjeados * VALOR_PUNTO
      }

      const valorCobrado = Math.max(0, subtotal - descuento)

      // 5. Descontar existencias y registrar movimientos y consumos
      let costoTotalInsumos = 0
      const consumosParaCrear = []

      for (const [insumoId, reqInfo] of consumoConsolidado.entries()) {
        const insumo = await tx.insumo.findUnique({ where: { id: insumoId } })
        const cantAnterior = insumo.existencias
        const cantDescontar = reqInfo.cantidadTotal
        const cantResultante = cantAnterior - cantDescontar
        const costoInsumo = cantDescontar * insumo.costoUnitario

        costoTotalInsumos += costoInsumo

        // Actualizar stock del insumo
        await tx.insumo.update({
          where: { id: insumoId },
          data: { existencias: cantResultante },
        })

        // Registrar movimiento de inventario
        await tx.movimientoInventario.create({
          data: {
            insumoId,
            tipo: 'SALIDA_SERVICIO',
            cantidadAnterior: cantAnterior,
            cantidadMovimiento: cantDescontar,
            cantidadResultante: cantResultante,
            motivo: `Consumo en atención de servicio de cita #${cita.id}`,
            usuarioId: req.user.id,
            clienteId: cita.clienteId,
            citaId: cita.id,
          },
        })

        consumosParaCrear.push({
          citaId: cita.id,
          servicioId: reqInfo.servicioId,
          insumoId,
          cantidadConsumida: cantDescontar,
          costoUnitario: insumo.costoUnitario,
          costoTotal: costoInsumo,
          clienteId: cita.clienteId,
          profesionalId: cita.profesionalId,
        })
      }

      // 6. Liquidación de comisiones
      const porcentajeComision = cita.profesional.porcentaje || 50.0
      // La base para liquidar puede deducir el costo de insumos
      const baseComision = Math.max(0, valorCobrado - costoTotalInsumos)
      const comisionProfesional = Math.round((baseComision * porcentajeComision) / 100)
      const utilidadNegocio = valorCobrado - comisionProfesional

      // Puntos ganados por la compra
      const puntosGanados = Math.floor(valorCobrado / PESOS_POR_PUNTO)

      // 7. Crear el registro de Pago / Venta
      const nuevoPago = await tx.pago.create({
        data: {
          citaId: cita.id,
          clienteId: cita.clienteId,
          profesionalId: cita.profesionalId,
          usuarioId: req.user.id,
          metodo: metodo || 'EFECTIVO',
          subtotal,
          descuento,
          codigoPromo: codigoPromo?.trim() || null,
          puntosCanjeados,
          valorCobrado,
          costoInsumos: costoTotalInsumos,
          baseComision,
          porcentajeComision,
          comisionProfesional,
          utilidadNegocio,
          puntosGanados,
        },
      })

      // Asociar consumos creados al pago
      for (const consumo of consumosParaCrear) {
        await tx.consumoServicio.create({
          data: {
            ...consumo,
            pagoId: nuevoPago.id,
          },
        })
      }

      // 8. Actualizar estado de la Cita a FINALIZADA
      await tx.cita.update({
        where: { id: cita.id },
        data: { estado: 'FINALIZADA' },
      })

      // 9. Actualizar fidelización y visitas del cliente
      const nuevoSaldoPuntos = Math.max(0, saldoPuntosCliente - puntosCanjeados + puntosGanados)
      await tx.cliente.update({
        where: { id: cita.clienteId },
        data: {
          visitas: { increment: 1 },
          puntos: nuevoSaldoPuntos,
        },
      })

      return {
        ...nuevoPago,
        clienteNombre: cita.cliente.nombre,
        profesionalNombre: cita.profesional.nombre,
      }
    })

    res.status(201).json({ ok: true, data: resultadoPago })
  } catch (err) {
    next(err)
  }
}

export async function getPagos(req, res, next) {
  try {
    const where = {}

    // Si es TRABAJADOR, solo puede consultar sus propias ventas y comisiones
    if (req.user.rol === 'TRABAJADOR') {
      if (!req.user.profesionalId) {
        return res.json({ ok: true, data: [] })
      }
      where.profesionalId = req.user.profesionalId
    } else if (req.query.profesionalId) {
      where.profesionalId = Number(req.query.profesionalId)
    }

    const pagos = await prisma.pago.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        profesional: { select: { id: true, nombre: true, porcentaje: true } },
        cita: {
          include: {
            servicios: { include: { servicio: true } },
          },
        },
      },
      orderBy: { fecha: 'desc' },
    })

    res.json({ ok: true, data: pagos })
  } catch (err) {
    next(err)
  }
}

export async function getReporteFinanciero(req, res, next) {
  try {
    // Solo accesible por ADMINISTRADOR
    const pagos = await prisma.pago.findMany({
      include: {
        profesional: true,
      },
    })

    const totalIngresos = pagos.reduce((s, p) => s + p.valorCobrado, 0)
    const totalComisiones = pagos.reduce((s, p) => s + p.comisionProfesional, 0)
    const totalUtilidad = pagos.reduce((s, p) => s + p.utilidadNegocio, 0)
    const totalCostoInsumos = pagos.reduce((s, p) => s + p.costoInsumos, 0)

    // Agrupación por profesional
    const porProfesional = {}
    pagos.forEach((p) => {
      const pid = p.profesionalId
      const pNombre = p.profesional?.nombre || 'General'
      if (!porProfesional[pid]) {
        porProfesional[pid] = {
          id: pid,
          nombre: pNombre,
          totalVentas: 0,
          totalComision: 0,
          serviciosRealizados: 0,
        }
      }
      porProfesional[pid].totalVentas += p.valorCobrado
      porProfesional[pid].totalComision += p.comisionProfesional
      porProfesional[pid].serviciosRealizados += 1
    })

    res.json({
      ok: true,
      data: {
        totalIngresos,
        totalComisiones,
        totalUtilidad,
        totalCostoInsumos,
        cantidadVentas: pagos.length,
        porProfesional: Object.values(porProfesional),
      },
    })
  } catch (err) {
    next(err)
  }
}
