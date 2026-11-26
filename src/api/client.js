// Cliente HTTP centralizado para BarberFlow conectado a Spring Boot + MySQL con JWT

const API_BASE = '/api'
const TOKEN_KEY = 'barberflow:token'
const USER_KEY = 'barberflow:user'

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
}

async function request(endpoint, options = {}) {
  const token = authStorage.getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    let errorMsg = data?.error
    if (!errorMsg) {
      if (res.status === 405) {
        errorMsg = 'Error 405 (Método no permitido): El backend no está corriendo o la ruta solicitada no acepta peticiones POST. Asegúrese de que Spring Boot esté iniciado en el puerto 4000.'
      } else if (res.status === 502 || res.status === 503 || res.status === 504) {
        errorMsg = 'Error de conexión: No se pudo conectar con el servidor Spring Boot (puerto 4000). Verifique que esté ejecutándose.'
      } else {
        errorMsg = `Error ${res.status}: ${res.statusText || 'Petición fallida'}`
      }
    }
    if (res.status === 401 && !endpoint.includes('/auth/login')) {
      authStorage.removeToken()
      window.dispatchEvent(new Event('barberflow:unauthorized'))
    }
    throw new Error(errorMsg)
  }

  return data
}

export const api = {
  // Autenticación
  login: async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (res.ok && res.token) {
      authStorage.setToken(res.token)
      authStorage.setUser(res.usuario)
    }
    return res
  },

  logout: () => {
    authStorage.removeToken()
  },

  getPerfil: () => request('/auth/me'),

  // Servicios
  getServicios: async () => {
    const res = await request('/servicios')
    return res.data || []
  },
  crearServicio: (data) => request('/servicios', { method: 'POST', body: JSON.stringify(data) }),

  // Profesionales / Barberos
  getProfesionales: async () => {
    const res = await request('/usuarios/profesionales')
    return res.data || []
  },

  // Clientes
  getClientes: async (buscar = '') => {
    const q = buscar ? `?buscar=${encodeURIComponent(buscar)}` : ''
    const res = await request(`/clientes${q}`)
    return res.data || []
  },
  crearCliente: (data) => request('/clientes', { method: 'POST', body: JSON.stringify(data) }),

  // Citas y Disponibilidad
  getDisponibilidad: async ({ profesionalId, fecha, duracionMin }) => {
    const q = new URLSearchParams({ profesionalId, fecha, duracionMin }).toString()
    const res = await request(`/citas/disponibilidad?${q}`)
    return res.data || []
  },

  getCitas: async ({ fecha, profesionalId, estado, buscar } = {}) => {
    const params = new URLSearchParams()
    if (fecha) params.append('fecha', fecha)
    if (profesionalId) params.append('profesionalId', profesionalId)
    if (estado && estado !== 'TODOS') params.append('estado', estado)
    if (buscar) params.append('buscar', buscar)

    const res = await request(`/citas?${params.toString()}`)
    return res.data || []
  },

  crearCita: async (data) => {
    const res = await request('/citas', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  cambiarEstadoCita: async (id, estado) => {
    const res = await request(`/citas/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    })
    return res.data
  },

  eliminarCita: async (id) => {
    const res = await request(`/citas/${id}`, { method: 'DELETE' })
    return res
  },

  // Pagos y Facturación de Citas
  registrarPago: async (data) => {
    const res = await request('/pagos', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  getPagos: async (profesionalId) => {
    const q = profesionalId ? `?profesionalId=${profesionalId}` : ''
    const res = await request(`/pagos${q}`)
    return res.data || []
  },

  getReporteFinanciero: async () => {
    const res = await request('/pagos/reporte')
    return res.data || {}
  },

  // Inventario: Insumos
  getInsumos: async () => {
    const res = await request('/inventario')
    return res.data || []
  },

  crearInsumo: async (data) => {
    const res = await request('/inventario', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  registrarEntradaInsumo: async (id, cantidad, motivo) => {
    const res = await request(`/inventario/${id}/entrada`, {
      method: 'POST',
      body: JSON.stringify({ cantidad, motivo }),
    })
    return res.data
  },

  // Inventario: Productos para venta
  getProductos: async () => {
    const res = await request('/inventario/productos')
    return res.data || []
  },

  crearProducto: async (data) => {
    const res = await request('/inventario/productos', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  // Trazabilidad y Movimientos
  getMovimientosInventario: async ({ tipo, insumoId, productoId } = {}) => {
    const params = new URLSearchParams()
    if (tipo && tipo !== 'TODOS') params.append('tipo', tipo)
    if (insumoId) params.append('insumoId', insumoId)
    if (productoId) params.append('productoId', productoId)

    const res = await request(`/inventario/movimientos?${params.toString()}`)
    return res.data || []
  },

  getHistorialCliente: async (clienteId) => {
    const res = await request(`/inventario/consumos/cliente/${clienteId}`)
    return res.data || []
  },

  getHistorialInsumo: async (insumoId) => {
    const res = await request(`/inventario/consumos/producto/${insumoId}`)
    return res.data || []
  },

  // Compras y Abastecimiento
  getCompras: async () => {
    const res = await request('/compras')
    return res.data || []
  },

  registrarCompra: async (data) => {
    const res = await request('/compras', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  getProveedores: async () => {
    const res = await request('/compras/proveedores')
    return res.data || []
  },

  crearProveedor: async (data) => {
    const res = await request('/compras/proveedores', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  // Ventas de Productos
  getVentas: async (profesionalId) => {
    const q = profesionalId ? `?profesionalId=${profesionalId}` : ''
    const res = await request(`/ventas${q}`)
    return res.data || []
  },

  registrarVenta: async (data) => {
    const res = await request('/ventas', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.data
  },

  // Usuarios (Solo Administrador)
  getUsuarios: async () => {
    const res = await request('/usuarios')
    return res.data || []
  },
  crearUsuario: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
}

export const money = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n || 0)

const pad = (n) => String(n).padStart(2, '0')
export const hoy = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
