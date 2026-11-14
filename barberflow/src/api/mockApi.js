// API de BarberFlow con integración a MockAPI (proyecto 6aae920c606bd915d110eac1)
// y fallback automático a almacenamiento local resiliente (localStorage).

const STORAGE_KEY = 'barberflow:db:v2'
const PESOS_POR_PUNTO = 1000 // 1 punto por cada $1.000 pagados
const VALOR_PUNTO = 20 // Equivalencia de canje ($20 por punto)

export const DEFAULT_MOCKAPI_BASE = 'https://6aae920c606bd915d110eac1.mockapi.io'
export const DEFAULT_RESOURCE = 'citas'

export const ESTADOS = ['PROGRAMADA', 'CONFIRMADA', 'EN_ATENCION', 'FINALIZADA', 'CANCELADA', 'NO_ASISTIO']
export const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'NEQUI / DAVIPLATA']

const TRANSICIONES = {
  PROGRAMADA: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EN_ATENCION', 'NO_ASISTIO', 'CANCELADA'],
  EN_ATENCION: ['FINALIZADA', 'CANCELADA'],
  FINALIZADA: [],
  CANCELADA: ['PROGRAMADA'],
  NO_ASISTIO: ['PROGRAMADA'],
}

const PROMOS = {
  BARBA10: { tipo: 'PORCENTAJE', valor: 10, descripcion: '10% de descuento en corte y barba' },
  FLOW20: { tipo: 'PORCENTAJE', valor: 20, descripcion: '20% especial de lanzamiento' },
  CLIENTE_VIP: { tipo: 'FIJO', valor: 5000, descripcion: '$5.000 de descuento para clientes frecuentes' },
}

const pad = (n) => String(n).padStart(2, '0')

export const hoy = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const toMin = (hhmm) => {
  if (!hhmm || typeof hhmm !== 'string') return 0
  const parts = hhmm.split(':')
  return Number(parts[0] || 0) * 60 + Number(parts[1] || 0)
}

export const toHHMM = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`

const seed = () => ({
  config: {
    descontarInsumos: true,
    mockApiUrl: DEFAULT_MOCKAPI_BASE,
    mockApiResource: DEFAULT_RESOURCE,
    usarMockApi: false, // Por defecto en modo base de datos local integrada (rápida, autónoma y sin dependencias externas)
  },
  servicios: [
    { id: 1, nombre: 'Corte clásico', categoria: 'Cabello', duracionMin: 30, precio: 25000, receta: { 1: 10, 4: 1 } },
    { id: 2, nombre: 'Corte y barba', categoria: 'Combo', duracionMin: 60, precio: 40000, receta: { 1: 10, 2: 15, 4: 1 } },
    { id: 3, nombre: 'Arreglo de barba', categoria: 'Barba', duracionMin: 30, precio: 18000, receta: { 2: 15, 3: 5 } },
    { id: 4, nombre: 'Afeitado toalla caliente', categoria: 'Barba', duracionMin: 30, precio: 30000, receta: { 2: 25, 3: 5, 4: 1 } },
    { id: 5, nombre: 'Perfilado de cejas y corte', categoria: 'Combo', duracionMin: 45, precio: 32000, receta: { 1: 5, 4: 1 } },
    { id: 6, nombre: 'Tratamiento capilar y lavado', categoria: 'Cabello', duracionMin: 25, precio: 20000, receta: { 1: 20 } },
  ],
  profesionales: [
    { id: 1, nombre: 'Andrés Rojas', especialidad: 'Cortes clásicos y fade', calificacion: 4.8, porcentaje: 50, telefono: '3104567890' },
    { id: 2, nombre: 'Camilo Pérez', especialidad: 'Barba y afeitado tradicional', calificacion: 4.9, porcentaje: 50, telefono: '3119876543' },
    { id: 3, nombre: 'Sara Molina', especialidad: 'Diseños y estilos modernos', calificacion: 4.7, porcentaje: 60, telefono: '3201122334' },
  ],
  horario: { inicio: '08:00', fin: '19:00', descansoInicio: '13:00', descansoFin: '14:00' },
  insumos: [
    { id: 1, nombre: 'Gel fijador premium', unidad: 'ml', existencias: 500, stockMinimo: 100, costoUnitario: 40 },
    { id: 2, nombre: 'Crema de afeitar hidratante', unidad: 'g', existencias: 350, stockMinimo: 80, costoUnitario: 50 },
    { id: 3, nombre: 'Talco mentolado', unidad: 'g', existencias: 200, stockMinimo: 50, costoUnitario: 20 },
    { id: 4, nombre: 'Cuchillas desechables', unidad: 'unidad', existencias: 40, stockMinimo: 15, costoUnitario: 800 },
    { id: 5, nombre: 'Aceite para barba', unidad: 'ml', existencias: 120, stockMinimo: 30, costoUnitario: 120 },
    { id: 6, nombre: 'Loción after shave', unidad: 'ml', existencias: 250, stockMinimo: 60, costoUnitario: 45 },
  ],
  clientes: [
    { id: 1, nombre: 'Juan Díaz', telefono: '3001234567', email: 'juan.diaz@email.com', visitas: 5, notas: 'Prefiere degradado bajo' },
    { id: 2, nombre: 'Luis Gómez', telefono: '3109876543', email: 'luis.gomez@email.com', visitas: 3, notas: 'Corte a tijera arriba' },
    { id: 3, nombre: 'Mateo Ruiz', telefono: '3205556677', email: 'mateo.ruiz@email.com', visitas: 2, notas: 'Barba cuadrada' },
    { id: 4, nombre: 'Carlos Ortiz', telefono: '3158889900', email: 'carlos.o@email.com', visitas: 1, notas: 'Cliente nuevo' },
  ],
  citas: [
    {
      id: 1,
      cliente: 'Juan Díaz',
      telefono: '3001234567',
      profesionalId: 1,
      servicioIds: [1],
      fecha: hoy(),
      hora: '09:30',
      duracionMin: 30,
      estado: 'CONFIRMADA',
      valorEstimado: 25000,
      notas: 'Corte habitual',
    },
    {
      id: 2,
      cliente: 'Luis Gómez',
      telefono: '3109876543',
      profesionalId: 1,
      servicioIds: [2],
      fecha: hoy(),
      hora: '14:30',
      duracionMin: 60,
      estado: 'PROGRAMADA',
      valorEstimado: 40000,
      notas: 'Combo corte + barba',
    },
    {
      id: 3,
      cliente: 'Mateo Ruiz',
      telefono: '3205556677',
      profesionalId: 2,
      servicioIds: [3],
      fecha: hoy(),
      hora: '11:00',
      duracionMin: 30,
      estado: 'EN_ATENCION',
      valorEstimado: 18000,
      notas: 'Arreglo de barba con navaja',
    },
    {
      id: 4,
      cliente: 'Carlos Ortiz',
      telefono: '3158889900',
      profesionalId: 3,
      servicioIds: [1, 5],
      fecha: hoy(1),
      hora: '10:00',
      duracionMin: 75,
      estado: 'PROGRAMADA',
      valorEstimado: 57000,
      notas: 'Corte y perfilado',
    },
  ],
  pagos: [],
  puntos: { 'juan díaz': 120, 'luis gómez': 80, 'mateo ruiz': 40 },
  nextId: 105,
})

const loadDb = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // Intenta migrar de v1 si existiera
      const old = localStorage.getItem('barberflow:db:v1')
      if (old) {
        const parsedOld = JSON.parse(old)
        return { ...seed(), ...parsedOld }
      }
      return seed()
    }
    return JSON.parse(raw)
  } catch {
    return seed()
  }
}

let db = loadDb()

const saveDb = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Almacenamiento en memoria temporal
  }
}

const ok = (v, ms = 120) => new Promise((r) => setTimeout(() => r(structuredClone(v)), ms))
const fail = (msg, ms = 120) => new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms))
const keyCliente = (n) => (n || '').trim().toLowerCase()

const duracionDe = (ids) =>
  ids.reduce((s, id) => {
    const serv = db.servicios.find((x) => x.id === id)
    return s + (serv ? serv.duracionMin : 30)
  }, 0)

const solapa = (aIni, aFin, bIni, bFin) => aIni < bFin && bIni < aFin

function franjasLibres(profesionalId, fecha, duracionMin) {
  const { inicio, fin, descansoInicio, descansoFin } = db.horario
  const ocupadas = db.citas.filter(
    (c) =>
      c.profesionalId === profesionalId &&
      c.fecha === fecha &&
      !['CANCELADA', 'NO_ASISTIO'].includes(c.estado)
  )
  const ahora = new Date()
  const minAhora = fecha === hoy() ? ahora.getHours() * 60 + ahora.getMinutes() : -1
  const libres = []
  for (let m = toMin(inicio); m + duracionMin <= toMin(fin); m += 30) {
    if (m <= minAhora) continue
    if (solapa(m, m + duracionMin, toMin(descansoInicio), toMin(descansoFin))) continue
    if (ocupadas.some((c) => solapa(m, m + duracionMin, toMin(c.hora), toMin(c.hora) + c.duracionMin))) continue
    libres.push(toHHMM(m))
  }
  return libres
}

const enriquecerCita = (c) => ({
  ...c,
  profesional: db.profesionales.find((p) => p.id === c.profesionalId)?.nombre || 'Profesional no asignado',
  servicios: (c.servicioIds || []).map((id) => db.servicios.find((s) => s.id === id)?.nombre || `Servicio #${id}`),
})

// ==========================================
// HELPERS PARA CONEXIÓN A MOCKAPI (FETCH)
// ==========================================

const getMockApiUrl = (endpoint = '') => {
  const base = (db.config.mockApiUrl || DEFAULT_MOCKAPI_BASE).replace(/\/+$/, '')
  const resource = (db.config.mockApiResource || DEFAULT_RESOURCE).replace(/^\/+/, '')
  return `${base}/${resource}${endpoint ? `/${endpoint}` : ''}`
}

async function remoteFetch(url, options = {}, timeoutMs = 3500) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

// ==========================================
// API EXPORTADA
// ==========================================

export const api = {
  // Configuración y Estado de MockAPI
  getConfig: () => ok(db.config, 40),

  setConfig: (cfg) => {
    db.config = { ...db.config, ...cfg }
    saveDb()
    return ok(db.config, 40)
  },

  testMockApiConnection: async (customUrl, customResource) => {
    const base = (customUrl || db.config.mockApiUrl || DEFAULT_MOCKAPI_BASE).replace(/\/+$/, '')
    const resource = (customResource || db.config.mockApiResource || DEFAULT_RESOURCE).replace(/^\/+/, '')
    const targetUrl = `${base}/${resource}`

    try {
      const res = await remoteFetch(targetUrl, { method: 'GET' }, 4000)
      if (res.ok) {
        const data = await res.json()
        return {
          ok: true,
          status: res.status,
          url: targetUrl,
          mensaje: `Conectado exitosamente con MockAPI (${Array.isArray(data) ? `${data.length} registros encontrados` : 'Respuesta válida'}).`,
          registros: Array.isArray(data) ? data.length : 0,
        }
      } else if (res.status === 404) {
        return {
          ok: false,
          status: 404,
          url: targetUrl,
          mensaje: `MockAPI respondió 404: El recurso '/${resource}' aún no ha sido creado en el proyecto MockAPI. La aplicación opera con sincronización local automática resiliente.`,
        }
      } else {
        return {
          ok: false,
          status: res.status,
          url: targetUrl,
          mensaje: `MockAPI respondió con código ${res.status} (${res.statusText || 'Error'}).`,
        }
      }
    } catch (err) {
      return {
        ok: false,
        status: 0,
        url: targetUrl,
        mensaje: `No se pudo contactar a MockAPI (${err.name === 'AbortError' ? 'Tiempo de espera agotado' : err.message}). Operando en modo local.`,
      }
    }
  },

  // Sincronizar citas locales hacia MockAPI si está online
  sincronizarConMockApi: async () => {
    const url = getMockApiUrl()
    try {
      const res = await remoteFetch(url, { method: 'GET' }, 3000)
      if (res.ok) {
        const remoteData = await res.json()
        if (Array.isArray(remoteData) && remoteData.length > 0) {
          // Fusionar citas remotas con locales
          const map = new Map(db.citas.map((c) => [String(c.id), c]))
          remoteData.forEach((item) => {
            map.set(String(item.id), { ...item, id: Number(item.id) || item.id })
          })
          db.citas = Array.from(map.values())
          saveDb()
          return { ok: true, mensaje: `Se sincronizaron ${remoteData.length} registros desde MockAPI.` }
        }
      }
    } catch {
      // Modo local
    }
    return { ok: false, mensaje: 'Sincronización mantenida en almacenamiento local resiliente.' }
  },

  // Servicios
  getServicios: () => ok(db.servicios),

  agregarServicio: (s) => {
    if (!s.nombre || !s.precio) return fail('Nombre y precio son requeridos.')
    const nuevo = {
      id: db.nextId++,
      nombre: s.nombre.trim(),
      categoria: s.categoria || 'General',
      duracionMin: Number(s.duracionMin) || 30,
      precio: Number(s.precio) || 0,
      receta: s.receta || {},
    }
    db.servicios.push(nuevo)
    saveDb()
    return ok(nuevo)
  },

  // Profesionales / Barberos
  getProfesionales: () => ok(db.profesionales),

  agregarProfesional: (p) => {
    if (!p.nombre) return fail('El nombre del barbero es obligatorio.')
    const nuevo = {
      id: db.nextId++,
      nombre: p.nombre.trim(),
      especialidad: p.especialidad || 'Cortes y peinados',
      calificacion: 5.0,
      porcentaje: Number(p.porcentaje) || 50,
      telefono: p.telefono || '',
    }
    db.profesionales.push(nuevo)
    saveDb()
    return ok(nuevo)
  },

  // Disponibilidad de horario
  getDisponibilidad: ({ profesionalId, fecha, servicioIds }) => {
    const profId = Number(profesionalId)
    const dur = duracionDe(servicioIds || [])
    return ok(franjasLibres(profId, fecha, dur), 100)
  },

  // Registro y Consulta de Citas
  getCitas: ({ fecha, profesionalId, estado, buscar } = {}) => {
    let filtradas = db.citas

    if (fecha) {
      filtradas = filtradas.filter((c) => c.fecha === fecha)
    }
    if (profesionalId) {
      filtradas = filtradas.filter((c) => c.profesionalId === Number(profesionalId))
    }
    if (estado && estado !== 'TODOS') {
      filtradas = filtradas.filter((c) => c.estado === estado)
    }
    if (buscar) {
      const q = buscar.toLowerCase().trim()
      filtradas = filtradas.filter(
        (c) =>
          (c.cliente && c.cliente.toLowerCase().includes(q)) ||
          (c.telefono && c.telefono.includes(q)) ||
          (c.notas && c.notas.toLowerCase().includes(q))
      )
    }

    filtradas = [...filtradas].sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    return ok(filtradas.map(enriquecerCita))
  },

  crearCita: async ({ cliente, telefono, servicioIds, profesionalId, fecha, hora, notas }) => {
    if (!cliente || !cliente.trim()) return fail('El nombre del cliente es obligatorio.')
    if (!profesionalId) return fail('Debes seleccionar un profesional/barbero.')
    if (!servicioIds || !servicioIds.length) return fail('Selecciona al menos un servicio.')
    if (!fecha || !hora) return fail('Selecciona fecha y hora para la cita.')

    const dur = duracionDe(servicioIds)
    const pId = Number(profesionalId)
    const disponibles = franjasLibres(pId, fecha, dur)

    if (!disponibles.includes(hora)) {
      return fail('Esa franja ya no está disponible. Por favor selecciona otra hora.')
    }

    const valorEstimado = servicioIds.reduce((s, id) => {
      const serv = db.servicios.find((x) => x.id === id)
      return s + (serv ? serv.precio : 0)
    }, 0)

    const nuevaCita = {
      id: db.nextId++,
      cliente: cliente.trim(),
      telefono: (telefono || '').trim(),
      profesionalId: pId,
      servicioIds,
      fecha,
      hora,
      duracionMin: dur,
      estado: 'PROGRAMADA',
      valorEstimado,
      notas: (notas || '').trim(),
      creadaEn: new Date().toISOString(),
    }

    // Guardar en base de datos local
    db.citas.push(nuevaCita)

    // Actualizar registro de cliente
    const k = keyCliente(cliente)
    const cliExistente = db.clientes.find((c) => keyCliente(c.nombre) === k)
    if (cliExistente) {
      cliExistente.visitas = (cliExistente.visitas || 0) + 1
      if (telefono) cliExistente.telefono = telefono
    } else {
      db.clientes.push({
        id: db.nextId++,
        nombre: cliente.trim(),
        telefono: (telefono || '').trim(),
        visitas: 1,
        notas: (notas || '').trim(),
      })
    }

    saveDb()

    // Intento de guardado en MockAPI remoto (en segundo plano, sin demorar la respuesta de la interfaz)
    if (db.config.usarMockApi) {
      remoteFetch(getMockApiUrl(), {
        method: 'POST',
        body: JSON.stringify(nuevaCita),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((remoteItem) => {
          if (remoteItem && remoteItem.id) {
            nuevaCita.mockApiId = remoteItem.id
            saveDb()
          }
        })
        .catch(() => {})
    }

    return ok(enriquecerCita(nuevaCita))
  },

  cambiarEstadoCita: async (id, estado) => {
    const c = db.citas.find((x) => x.id === Number(id))
    if (!c) return fail('Cita no encontrada.')
    const permitidos = TRANSICIONES[c.estado] || []
    if (!permitidos.includes(estado)) {
      return fail(`Transición de ${c.estado} a ${estado} no permitida.`)
    }

    c.estado = estado
    saveDb()

    // Intento de actualización en MockAPI remoto en segundo plano
    if (db.config.usarMockApi && c.mockApiId) {
      remoteFetch(getMockApiUrl(c.mockApiId), {
        method: 'PUT',
        body: JSON.stringify({ estado }),
      }).catch(() => {})
    }

    return ok(enriquecerCita(c))
  },

  eliminarCita: async (id) => {
    const numId = Number(id)
    const index = db.citas.findIndex((c) => c.id === numId)
    if (index === -1) return fail('Cita no encontrada.')

    const cita = db.citas[index]
    db.citas.splice(index, 1)
    saveDb()

    if (db.config.usarMockApi && cita.mockApiId) {
      remoteFetch(getMockApiUrl(cita.mockApiId), { method: 'DELETE' }).catch(() => {})
    }

    return ok(true)
  },

  // Registro de Pago y Facturación
  registrarPago: ({ citaId, metodo, codigoPromo, canjearPuntos, serviciosExtra = [] }) => {
    const c = db.citas.find((x) => x.id === Number(citaId))
    if (!c || c.estado !== 'EN_ATENCION') return fail('Solo se puede cobrar una cita en estado "En Atención".')
    if (db.pagos.some((p) => p.citaId === c.id)) return fail('Esta cita ya tiene un pago registrado.')

    let subtotal = c.valorEstimado
    let descuento = 0

    if (codigoPromo && codigoPromo.trim()) {
      const promo = PROMOS[codigoPromo.trim().toUpperCase()]
      if (!promo) return fail('El código de promoción no es válido o ha expirado.')
      if (promo.tipo === 'PORCENTAJE') {
        descuento += Math.round((subtotal * promo.valor) / 100)
      } else if (promo.tipo === 'FIJO') {
        descuento += promo.valor
      }
    }

    const k = keyCliente(c.cliente)
    let puntosCanjeados = 0
    if (canjearPuntos) {
      const saldoPuntos = db.puntos[k] ?? 0
      const maxCanjeablePesos = Math.max(0, subtotal - descuento)
      puntosCanjeados = Math.min(saldoPuntos, Math.floor(maxCanjeablePesos / VALOR_PUNTO))
      descuento += puntosCanjeados * VALOR_PUNTO
    }

    const valorCobrado = Math.max(0, subtotal - descuento)

    // Consumo de insumos según recetas
    const consumo = {}
    ;(c.servicioIds || []).forEach((sid) => {
      const serv = db.servicios.find((s) => s.id === sid)
      if (serv && serv.receta) {
        Object.entries(serv.receta).forEach(([iid, cant]) => {
          consumo[iid] = (consumo[iid] ?? 0) + cant
        })
      }
    })

    // Validar existencias
    for (const [iid, cant] of Object.entries(consumo)) {
      const ins = db.insumos.find((i) => i.id === Number(iid))
      if (ins && ins.existencias < cant) {
        return fail(`Stock insuficiente de ${ins.nombre} (disponible: ${ins.existencias} ${ins.unidad}, requerido: ${cant} ${ins.unidad}).`)
      }
    }

    let costoInsumos = 0
    Object.entries(consumo).forEach(([iid, cant]) => {
      const ins = db.insumos.find((i) => i.id === Number(iid))
      if (ins) {
        ins.existencias -= cant
        costoInsumos += cant * ins.costoUnitario
      }
    })

    // Cálculo de comisiones
    const prof = db.profesionales.find((p) => p.id === c.profesionalId)
    const pct = prof ? prof.porcentaje : 50
    const base = db.config.descontarInsumos ? Math.max(0, valorCobrado - costoInsumos) : valorCobrado
    const valorProfesional = Math.round((base * pct) / 100)
    const valorEstablecimiento = valorCobrado - valorProfesional

    // Puntos ganados
    const puntosGanados = Math.floor(valorCobrado / PESOS_POR_PUNTO)
    db.puntos[k] = Math.max(0, (db.puntos[k] ?? 0) - puntosCanjeados + puntosGanados)

    const pago = {
      id: db.nextId++,
      citaId: c.id,
      cliente: c.cliente,
      telefono: c.telefono || '',
      profesionalId: c.profesionalId,
      profesional: prof ? prof.nombre : 'General',
      metodo: metodo || 'EFECTIVO',
      subtotal,
      descuento,
      valorCobrado,
      costoInsumos,
      base,
      porcentaje: pct,
      valorProfesional,
      valorEstablecimiento,
      puntosGanados,
      puntosCanjeados,
      fecha: hoy(),
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    }

    db.pagos.push(pago)
    c.estado = 'FINALIZADA'
    saveDb()

    return ok(pago)
  },

  getPagos: () => {
    const lista = db.pagos.map((p) => {
      const prof = db.profesionales.find((x) => x.id === p.profesionalId)
      return {
        ...p,
        profesional: prof ? prof.nombre : p.profesional || 'Profesional',
      }
    })
    return ok([...lista].reverse())
  },

  // Inventario
  getInsumos: () => ok(db.insumos),

  entradaInsumo: (id, cantidad) => {
    const cant = Number(cantidad)
    if (!(cant > 0)) return fail('Ingresa una cantidad mayor a cero.')
    const insumo = db.insumos.find((i) => i.id === Number(id))
    if (!insumo) return fail('Insumo no encontrado.')
    insumo.existencias += cant
    saveDb()
    return ok(db.insumos)
  },

  agregarInsumo: (ins) => {
    if (!ins.nombre || !ins.unidad) return fail('Nombre y unidad de medida requeridos.')
    const nuevo = {
      id: db.nextId++,
      nombre: ins.nombre.trim(),
      unidad: ins.unidad.trim(),
      existencias: Number(ins.existencias) || 0,
      stockMinimo: Number(ins.stockMinimo) || 10,
      costoUnitario: Number(ins.costoUnitario) || 0,
    }
    db.insumos.push(nuevo)
    saveDb()
    return ok(nuevo)
  },

  // Clientes y Fidelización
  getClientes: () => ok(db.clientes),

  agregarCliente: (cli) => {
    if (!cli.nombre || !cli.nombre.trim()) return fail('El nombre del cliente es obligatorio.')
    const nuevo = {
      id: db.nextId++,
      nombre: cli.nombre.trim(),
      telefono: (cli.telefono || '').trim(),
      email: (cli.email || '').trim(),
      visitas: 1,
      notas: (cli.notas || '').trim(),
    }
    db.clientes.push(nuevo)
    saveDb()
    return ok(nuevo)
  },

  getPuntos: (cliente) => {
    const saldo = db.puntos[keyCliente(cliente)] ?? 0
    return ok({ saldo, valorPunto: VALOR_PUNTO }, 80)
  },

  getPuntosClientes: () => {
    const lista = Object.entries(db.puntos).map(([nombre, saldo]) => {
      const reg = db.clientes.find((c) => keyCliente(c.nombre) === nombre)
      return {
        cliente: reg ? reg.nombre : nombre,
        telefono: reg ? reg.telefono : '',
        saldo,
        visitas: reg ? reg.visitas : 1,
      }
    })
    return ok(lista.sort((a, b) => b.saldo - a.saldo))
  },

  // Reiniciar datos de prueba
  reiniciarDatos: () => {
    db = seed()
    saveDb()
    return ok(true, 50)
  },
}

export const money = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n || 0)
