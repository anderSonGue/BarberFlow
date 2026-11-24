import { useState, useEffect } from 'react'
import { api, money } from '../api/client.js'

export default function HistorialInventario() {
  const [subVista, setSubVista] = useState('movimientos') // 'movimientos' | 'porCliente' | 'porProducto'
  const [movimientos, setMovimientos] = useState([])
  const [insumos, setInsumos] = useState([])
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Filtros de movimientos
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [filtroInsumo, setFiltroInsumo] = useState('')

  // Selección para sub-vistas
  const [clienteSel, setClienteSel] = useState('')
  const [productoSel, setProductoSel] = useState('')
  const [consumosCliente, setConsumosCliente] = useState([])
  const [consumosProducto, setConsumosProducto] = useState([])

  useEffect(() => {
    cargarCatalogos()
  }, [])

  useEffect(() => {
    if (subVista === 'movimientos') {
      cargarMovimientos()
    }
  }, [subVista, filtroTipo, filtroInsumo])

  const cargarCatalogos = async () => {
    try {
      const [ins, cli] = await Promise.all([api.getInsumos(), api.getClientes()])
      setInsumos(ins)
      setClientes(cli)
      if (cli.length > 0) setClienteSel(String(cli[0].id))
      if (ins.length > 0) setProductoSel(String(ins[0].id))
    } catch (err) {
      setError(err.message)
    }
  }

  const cargarMovimientos = async () => {
    setCargando(true)
    setError('')
    try {
      const data = await api.getMovimientosInventario({
        tipo: filtroTipo,
        insumoId: filtroInsumo,
      })
      setMovimientos(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const consultarConsumosCliente = async (cid) => {
    setClienteSel(cid)
    if (!cid) return
    setCargando(true)
    setError('')
    try {
      const data = await api.getHistorialCliente(cid)
      setConsumosCliente(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const consultarConsumosProducto = async (pid) => {
    setProductoSel(pid)
    if (!pid) return
    setCargando(true)
    setError('')
    try {
      const data = await api.getHistorialProducto(pid)
      setConsumosProducto(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className="card card-historial">
      <div className="card-header">
        <div>
          <h2>Trazabilidad e Historial de Inventario</h2>
          <p className="nota">
            Auditoría permanente de movimientos, consumos por cliente y distribución de insumos.
          </p>
        </div>
        <div className="subnav-trazabilidad">
          <button
            type="button"
            className={subVista === 'movimientos' ? 'btn-subnav on' : 'btn-subnav'}
            onClick={() => setSubVista('movimientos')}
          >
            Movimientos Generales
          </button>
          <button
            type="button"
            className={subVista === 'porCliente' ? 'btn-subnav on' : 'btn-subnav'}
            onClick={() => {
              setSubVista('porCliente')
              if (clienteSel) consultarConsumosCliente(clienteSel)
            }}
          >
            Consumo por Cliente
          </button>
          <button
            type="button"
            className={subVista === 'porProducto' ? 'btn-subnav on' : 'btn-subnav'}
            onClick={() => {
              setSubVista('porProducto')
              if (productoSel) consultarConsumosProducto(productoSel)
            }}
          >
            Uso por Insumo
          </button>
        </div>
      </div>

      {error && <div className="alerta-error">{error}</div>}

      {/* VISTA 1: MOVIMIENTOS GENERALES */}
      {subVista === 'movimientos' && (
        <div className="bloque-trazabilidad">
          <div className="filtros-barra">
            <div className="filtro-item">
              <label htmlFor="filtro-tipo">Tipo de Operación:</label>
              <select
                id="filtro-tipo"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="TODOS">Todos los tipos</option>
                <option value="ENTRADA">Entrada por compra/abastecimiento</option>
                <option value="SALIDA_SERVICIO">Salida por consumo en servicio</option>
                <option value="AJUSTE_MANUAL">Ajuste manual autorizado</option>
                <option value="CORRECCION">Corrección de inventario</option>
              </select>
            </div>

            <div className="filtro-item">
              <label htmlFor="filtro-insumo">Filtrar por Insumo:</label>
              <select
                id="filtro-insumo"
                value={filtroInsumo}
                onChange={(e) => setFiltroInsumo(e.target.value)}
              >
                <option value="">Todos los insumos</option>
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.codigo} - {i.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {cargando ? (
            <p className="loading-texto">Cargando registros de auditoría...</p>
          ) : movimientos.length === 0 ? (
            <p className="vacio-texto">No se encontraron movimientos con los filtros seleccionados.</p>
          ) : (
            <div className="tabla-responsive">
              <table className="tabla-profesional">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Insumo</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Stock Ant.</th>
                    <th>Stock Res.</th>
                    <th>Responsable</th>
                    <th>Motivo / Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => {
                    const esSalida = m.tipo === 'SALIDA_SERVICIO'
                    return (
                      <tr key={m.id}>
                        <td>
                          {new Date(m.fecha).toLocaleString('es-CO', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td>
                          <strong>{m.insumo?.nombre || 'Insumo'}</strong>
                          <br />
                          <small className="texto-muted">{m.insumo?.codigo}</small>
                        </td>
                        <td>
                          <span className={`badge-tipo-mov ${m.tipo.toLowerCase()}`}>
                            {m.tipo.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={esSalida ? 'valor-salida' : 'valor-entrada'}>
                          {esSalida ? `-${m.cantidadMovimiento}` : `+${m.cantidadMovimiento}`}{' '}
                          <small>{m.insumo?.unidad}</small>
                        </td>
                        <td>{m.cantidadAnterior}</td>
                        <td>
                          <strong>{m.cantidadResultante}</strong>
                        </td>
                        <td>
                          {m.usuario?.nombre || 'Sistema'}
                          <br />
                          <small className="texto-muted">{m.usuario?.rol || ''}</small>
                        </td>
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
        </div>
      )}

      {/* VISTA 2: HISTORIAL DE CONSUMO POR CLIENTE */}
      {subVista === 'porCliente' && (
        <div className="bloque-trazabilidad">
          <div className="selector-cliente-box">
            <label htmlFor="select-cliente">Seleccionar Cliente para Auditoría:</label>
            <select
              id="select-cliente"
              value={clienteSel}
              onChange={(e) => consultarConsumosCliente(e.target.value)}
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.telefono ? `(${c.telefono})` : ''} · {c.visitas} visitas
                </option>
              ))}
            </select>
          </div>

          {cargando ? (
            <p className="loading-texto">Consultando consumos del cliente...</p>
          ) : consumosCliente.length === 0 ? (
            <p className="vacio-texto">Este cliente no registra consumos de insumos en sus servicios atendidos.</p>
          ) : (
            <div className="tabla-responsive">
              <table className="tabla-profesional">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Insumo Utilizado</th>
                    <th>Cantidad</th>
                    <th>Servicio Prestado</th>
                    <th>Barbero Responsable</th>
                    <th>Costo Asociado</th>
                  </tr>
                </thead>
                <tbody>
                  {consumosCliente.map((c) => (
                    <tr key={c.id}>
                      <td>
                        {new Date(c.fecha).toLocaleDateString('es-CO')}
                      </td>
                      <td>
                        <strong>{c.insumo?.nombre}</strong>
                      </td>
                      <td>
                        {c.cantidadConsumida} {c.insumo?.unidad}
                      </td>
                      <td>{c.servicio?.nombre}</td>
                      <td>{c.profesional?.nombre}</td>
                      <td>{money(c.costoTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VISTA 3: HISTORIAL DE USO POR INSUMO */}
      {subVista === 'porProducto' && (
        <div className="bloque-trazabilidad">
          <div className="selector-cliente-box">
            <label htmlFor="select-producto">Seleccionar Insumo para Consultar Consumo:</label>
            <select
              id="select-producto"
              value={productoSel}
              onChange={(e) => consultarConsumosProducto(e.target.value)}
            >
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.codigo} - {i.nombre} (Stock actual: {i.existencias} {i.unidad})
                </option>
              ))}
            </select>
          </div>

          {cargando ? (
            <p className="loading-texto">Consultando distribución del producto...</p>
          ) : consumosProducto.length === 0 ? (
            <p className="vacio-texto">No se registran consumos para este producto.</p>
          ) : (
            <div className="tabla-responsive">
              <table className="tabla-profesional">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente Receptor</th>
                    <th>Cantidad Consumida</th>
                    <th>Servicio</th>
                    <th>Profesional</th>
                    <th>Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {consumosProducto.map((c) => (
                    <tr key={c.id}>
                      <td>{new Date(c.fecha).toLocaleDateString('es-CO')}</td>
                      <td>
                        <strong>{c.cliente?.nombre}</strong>
                      </td>
                      <td>{c.cantidadConsumida}</td>
                      <td>{c.servicio?.nombre}</td>
                      <td>{c.profesional?.nombre}</td>
                      <td>{money(c.costoTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
