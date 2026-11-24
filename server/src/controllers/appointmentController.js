import prisma from '../db.js'

const TRANSICIONES_PERMITIDAS = {
  PROGRAMADA: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EN_ATENCION', 'NO_ASISTIO', 'CANCELADA'],
  EN_ATENCION: ['CANCELADA'],
  FINALIZADA: [],
  CANCELADA: ['PROGRAMADA'],
  NO_ASISTIO: ['PROGRAMADA'],
}

const pad = (n) => String(n).padStart(2, '0')

const hoyStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const toMin = (hhmm) => {
  if (!hhmm || typeof hhmm !== 'string') return 0
  const [h, m] = hhmm.split(':')
  return Number(h || 0) * 60 + Number(m || 0)
}

const toHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
const solapa = (aIni, aFin, bIni, bFin) => aIni < bFin && bIni < aFin

export async function getDisponibilidad(req, res, next) {
  try {
    const { profesionalId, fecha, duracionMin } = req.query
    const profId = Number(profesionalId)
    const fechaCita = fecha || hoyStr()
    const duracion = Number(duracionMin) || 30

    const HORARIO = { inicio: '08:00', fin: '19:00', descansoInicio: '13:00', descansoFin: '14:00' }

    const citasExistentes = await prisma.cita.findMany({
      where: {
        profesionalId: profId,
        fecha: fechaCita,
        estado: { notIn: ['CANCELADA', 'NO_ASISTIO'] },
      },
    })

    const ahora = new Date()
    const minAhora = fechaCita === hoyStr() ? ahora.getHours() * 60 + ahora.getMinutes() : -1
    const franjasLibres = []

    for (let m = toMin(HORARIO.inicio); m + duracion <= toMin(HORARIO.fin); m += 30) {
      if (m <= minAhora) continue
      if (solapa(m, m + duracion, toMin(HORARIO.descansoInicio), toMin(HORARIO.descansoFin))) continue
      if (citasExistentes.some((c) => solapa(m, m + duracion, toMin(c.hora), toMin(c.hora) + c.duracionMin))) continue
      franjasLibres.push(toHHMM(m))
    }

    res.json({ ok: true, data: franjasLibres })
  } catch (err) {
    next(err)
  }
}

export async function getCitas(req, res, next) {
  try {
    const { fecha, profesionalId, estado, buscar } = req.query
    const where = {}

    // Si es TRABAJADOR, puede ver las citas asignadas a él o todas las citas de la agenda operativa según el requerimiento
    if (profesionalId) {
      where.profesionalId = Number(profesionalId)
    }

    if (fecha) {
      where.fecha = fecha
    }

    if (estado && estado !== 'TODOS') {
      where.estado = estado
    }

    if (buscar) {
      const q = buscar.trim()
      where.OR = [
        { cliente: { nombre: { contains: q } } },
        { cliente: { telefono: { contains: q } } },
        { notas: { contains: q } },
      ]
    }

    const citas = await prisma.cita.findMany({
      where,
      include: {
        cliente: true,
        profesional: true,
        servicios: {
          include: { servicio: true },
        },
        pago: true,
      },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
    })

    res.json({ ok: true, data: citas })
  } catch (err) {
    next(err)
  }
}

export async function crearCita(req, res, next) {
  try {
    const { clienteNombre, clienteTelefono, clienteEmail, profesionalId, servicioIds, fecha, hora, notas } = req.body

    if (!clienteNombre || !clienteNombre.trim()) {
      return res.status(400).json({ ok: false, error: 'El nombre del cliente es obligatorio.' })
    }
    if (!profesionalId) {
      return res.status(400).json({ ok: false, error: 'Debe seleccionar un profesional/barbero.' })
    }
    if (!servicioIds || !Array.isArray(servicioIds) || servicioIds.length === 0) {
      return res.status(400).json({ ok: false, error: 'Seleccione al menos un servicio.' })
    }
    if (!fecha || !hora) {
      return res.status(400).json({ ok: false, error: 'Debe seleccionar fecha y hora para la cita.' })
    }

    // 1. Obtener servicios
    const servicios = await prisma.servicio.findMany({
      where: { id: { in: servicioIds.map(Number) } },
    })

    if (servicios.length === 0) {
      return res.status(400).json({ ok: false, error: 'Los servicios seleccionados no son válidos.' })
    }

    const duracionTotal = servicios.reduce((sum, s) => sum + s.duracionMin, 0)
    const valorEstimado = servicios.reduce((sum, s) => sum + s.precio, 0)
    const profId = Number(profesionalId)

    // 2. Transacción de creación
    const nuevaCita = await prisma.$transaction(async (tx) => {
      // Buscar o crear cliente
      let cliente = await tx.cliente.findFirst({
        where: {
          nombre: { equals: clienteNombre.trim() },
        },
      })

      if (!cliente) {
        cliente = await tx.cliente.create({
          data: {
            nombre: clienteNombre.trim(),
            telefono: clienteTelefono?.trim() || '',
            email: clienteEmail?.trim() || null,
            visitas: 1,
            notas: notas?.trim() || '',
          },
        })
      } else {
        if (clienteTelefono) {
          await tx.cliente.update({
            where: { id: cliente.id },
            data: { telefono: clienteTelefono.trim() },
          })
        }
      }

      // Validar no solapamiento
      const solapadas = await tx.cita.findMany({
        where: {
          profesionalId: profId,
          fecha,
          estado: { notIn: ['CANCELADA', 'NO_ASISTIO'] },
        },
      })

      const inicioMin = toMin(hora)
      const finMin = inicioMin + duracionTotal

      const existeSolapamiento = solapadas.some((c) =>
        solapa(inicioMin, finMin, toMin(c.hora), toMin(c.hora) + c.duracionMin)
      )

      if (existeSolapamiento) {
        throw new Error('La franja horaria seleccionada ya no está disponible. Elija otro horario.')
      }

      // Crear Cita
      const cita = await tx.cita.create({
        data: {
          clienteId: cliente.id,
          profesionalId: profId,
          fecha,
          hora,
          duracionMin: duracionTotal,
          estado: 'PROGRAMADA',
          valorEstimado,
          notas: notas?.trim() || '',
          servicios: {
            create: servicios.map((s) => ({
              servicioId: s.id,
              precio: s.precio,
            })),
          },
        },
        include: {
          cliente: true,
          profesional: true,
          servicios: { include: { servicio: true } },
        },
      })

      return cita
    })

    res.status(201).json({ ok: true, data: nuevaCita })
  } catch (err) {
    next(err)
  }
}

export async function cambiarEstado(req, res, next) {
  try {
    const { id } = req.params
    const { estado } = req.body

    const cita = await prisma.cita.findUnique({
      where: { id: Number(id) },
    })

    if (!cita) {
      return res.status(404).json({ ok: false, error: 'Cita no encontrada.' })
    }

    const permitidos = TRANSICIONES_PERMITIDAS[cita.estado] || []
    if (!permitidos.includes(estado)) {
      return res.status(400).json({
        ok: false,
        error: `Transición de estado no permitida: de '${cita.estado}' a '${estado}'.`,
      })
    }

    const actualizada = await prisma.cita.update({
      where: { id: cita.id },
      data: { estado },
      include: {
        cliente: true,
        profesional: true,
        servicios: { include: { servicio: true } },
      },
    })

    res.json({ ok: true, data: actualizada })
  } catch (err) {
    next(err)
  }
}

export async function eliminarCita(req, res, next) {
  try {
    const { id } = req.params
    const idCita = Number(id)

    const cita = await prisma.cita.findUnique({
      where: { id: idCita },
      include: { pago: true },
    })

    if (!cita) {
      return res.status(404).json({ ok: false, error: 'Cita no encontrada.' })
    }

    if (cita.pago) {
      return res.status(400).json({
        ok: false,
        error: 'No se puede eliminar una cita que ya tiene pagos registrados.',
      })
    }

    await prisma.cita.delete({
      where: { id: idCita },
    })

    res.json({ ok: true, mensaje: 'Cita eliminada correctamente.' })
  } catch (err) {
    next(err)
  }
}
