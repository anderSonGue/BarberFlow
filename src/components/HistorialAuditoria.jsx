import { useState, useEffect } from 'react'
import { api, money } from '../api/client.js'

export default function HistorialAuditoria() {
  const [movimientos, setMovimientos] = useState([])
  const [compras, setCompras] = useState([])
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')

  useEffect(() => {
    cargarAuditoria()
  }, [])

  const cargarAuditoria = async () => {
    setCargando(true)
    setError('')
    try {
      const [movData, compData, ventData] = await Promise.all([
        api.getMovimientosInventario(),
        api.getCompras(),
        api.getVentas(),
      ])
      setMovimientos(movData)
      setCompras(compData)
      setVentas(ventData)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  // Filtrado reactivo en memoria
  const movimientosFiltrados = movimientos.filter((m) => {
    if (filtroTipo !== 'TODOS' && m.tipoMovimiento !== filtroTipo) {
      return false
    }
    if (filtroFecha) {
      const fechaMov = new Date(m.fecha).toISOString().slice(0, 10)
      if (fechaMov !== filtroFecha) return false
    }
    if (filtroBusqueda) {
      const q = filtroBusqueda.toLowerCase().trim()
      const itemNombre = (m.insumo?.nombre || m.producto?.nombre || '').toLowerCase()
      const usuarioNombre = (m.usuario?.nombre || '').toLowerCase()
      const motivo = (m.motivo || '').toLowerCase()
      const clienteNombre = (m.cliente?.nombre || '').toLowerCase()
      return itemNombre.includes(q) || usuarioNombre.includes(q) || motivo.includes(q) || clienteNombre.includes(q)
    }
    return true
  })

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Historial General y Auditoría del Sistema</h2>
          <p className="nota">
            Registro inmutable de trazabilidad operativa: compras, ventas, consumos, servicios y ajustes de inventario.
          </p>
        </div>
        <div className="badge-contador">
          {movimientosFiltrados.length} registros auditados
        </div>
      </div>

      {error && <div className="alerta-error">{error}</div>}

      {/* BARRA DE FILTROS */}
      <div className="filtros-grid">
        <label>
          Tipo de Operación:
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="TODOS">Todas las operaciones</option>
            <option value="ENTRADA_COMPRA">Entrada por Compra</option>
            <option value="SALIDA_SERVICIO">Salida por Consumo en Servicio</option>
            <option value="SALIDA_VENTA">Salida por Venta de Producto</option>
            <option value="AJUSTE_MANUAL">Ajuste Manual Autorizado</option>
            <option value="CORRECCION">Corrección de Inventario</option>
          </select>
        </label>

        <label>
          Fecha de Operación:
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          />
        </label>

        <label>
          Buscar (Artículo, Cliente, Usuario, Motivo):
          <input
            type="search"
            placeholder="Ej. Gel, Pomada, Andrés, Factura..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
          />
        </label>
      </div>

      {cargando ? (
        <p className="nota cargando">Consultando registros de auditoría desde MySQL...</p>
      ) : movimientosFiltrados.length === 0 ? (
        <div className="alerta-vacia">
          <p>No se encontraron registros de auditoría para los filtros aplicados.</p>
        </div>
      ) : (
        <div className="tabla-responsive">
          <table className="tabla-profesional">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha y Hora</th>
                <th>Tipo Operación</th>
                <th>Elemento Afectado</th>
                <th>Tipo Ítem</th>
                <th>Cantidad</th>
                <th>Stock Ant.</th>
                <th>Stock Res.</th>
                <th>Responsable</th>
                <th>Motivo / Referencia</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.map((m) => {
                const esSalida = m.tipoMovimiento.startsWith('SALIDA')
                const nombreItem = m.insumo?.nombre || m.producto?.nombre || 'Artículo'
                const codigoItem = m.insumo?.codigo || m.producto?.codigo || ''
                const unidad = m.insumo?.unidad || m.producto?.unidad || 'unid'

                return (
                  <tr key={m.id}>
                    <td>
                      <code>#{m.id}</code>
                    </td>
                    <td>
                      {new Date(m.fecha).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td>
                      <span className={`badge-tipo-mov ${m.tipoMovimiento.toLowerCase()}`}>
                        {m.tipoMovimiento.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <strong>{nombreItem}</strong>
                      {codigoItem && <small className="texto-muted bloque">{codigoItem}</small>}
                    </td>
                    <td>
                      <small className="metodo-tag">{m.tipoItem}</small>
                    </td>
                    <td className={esSalida ? 'valor-salida' : 'valor-entrada'}>
                      {esSalida ? `-${m.cantidadMovimiento}` : `+${m.cantidadMovimiento}`} <small>{unidad}</small>
                    </td>
                    <td>{m.cantidadAnterior}</td>
                    <td>
                      <strong>{m.cantidadResultante}</strong>
                    </td>
                    <td>{m.usuario?.nombre || 'Sistema'}</td>
                    <td>
                      {m.motivo}
                      {m.cliente && (
                        <span className="detalle-cliente-mov">
                          {' '}
                          · Cliente: {m.cliente.nombre}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
