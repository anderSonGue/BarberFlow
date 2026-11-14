import { useState, useEffect } from 'react'
import { api, money, hoy, DEFAULT_MOCKAPI_BASE, DEFAULT_RESOURCE } from '../api/mockApi.js'
import { useData } from '../hooks.js'
import { Estado } from './Agenda.jsx'

export default function Panel({ tick, onReset, onChange }) {
  const [citas] = useData(() => api.getCitas(), [tick], [])
  const [pagos] = useData(api.getPagos, [tick], [])
  const [insumos] = useData(api.getInsumos, [tick], [])
  const [clientes] = useData(api.getPuntosClientes, [tick], [])
  const [config] = useData(api.getConfig, [tick], {
    mockApiUrl: DEFAULT_MOCKAPI_BASE,
    mockApiResource: DEFAULT_RESOURCE,
    usarMockApi: false,
  })

  // Estado de conexión a MockAPI
  const [urlMock, setUrlMock] = useState(config.mockApiUrl || DEFAULT_MOCKAPI_BASE)
  const [recursoMock, setRecursoMock] = useState(config.mockApiResource || DEFAULT_RESOURCE)
  const [probandoConexion, setProbandoConexion] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [estadoMock, setEstadoMock] = useState(null)

  useEffect(() => {
    setUrlMock(config.mockApiUrl || DEFAULT_MOCKAPI_BASE)
    setRecursoMock(config.mockApiResource || DEFAULT_RESOURCE)
  }, [config])

  const toggleModoMockApi = async (activar) => {
    await api.setConfig({ usarMockApi: activar })
    if (onChange) onChange()
  }

  const probarConexion = async () => {
    setProbandoConexion(true)
    setEstadoMock(null)
    try {
      const res = await api.testMockApiConnection(urlMock, recursoMock)
      setEstadoMock(res)
      // Guardar configuración
      await api.setConfig({ mockApiUrl: urlMock, mockApiResource: recursoMock })
    } catch (err) {
      setEstadoMock({
        ok: false,
        status: 0,
        mensaje: `Error al conectar: ${err.message}`,
      })
    } finally {
      setProbandoConexion(false)
    }
  }

  const sincronizar = async () => {
    setSincronizando(true)
    try {
      const res = await api.sincronizarConMockApi()
      setEstadoMock((prev) => ({
        ...prev,
        syncMsg: res.mensaje,
      }))
    } finally {
      setSincronizando(false)
    }
  }

  const exportarDatos = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ citas, pagos, insumos, clientes, exportadoEn: new Date().toISOString() }, null, 2)
    )
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `barberflow_backup_${hoy()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Cálculos de métricas
  const deHoy = citas.filter((c) => c.fecha === hoy() && !['CANCELADA', 'NO_ASISTIO'].includes(c.estado))
  const ingresos = pagos.reduce((t, p) => t + (p.valorCobrado || 0), 0)
  const comisiones = pagos.reduce((t, p) => t + (p.valorProfesional || 0), 0)
  const gananciaBarberia = pagos.reduce((t, p) => t + (p.valorEstablecimiento || 0), 0)
  const alertas = insumos.filter((i) => i.existencias <= i.stockMinimo)

  const porProf = Object.entries(
    pagos.reduce((m, p) => ({ ...m, [p.profesional]: (m[p.profesional] ?? 0) + (p.valorProfesional || 0) }), {})
  )
  const max = Math.max(1, ...porProf.map(([, v]) => v))
  const proximas = citas
    .filter((c) => ['PROGRAMADA', 'CONFIRMADA', 'EN_ATENCION'].includes(c.estado))
    .slice(0, 8)

  return (
    <div className="panel-dashboard">
      {/* SECCIÓN KPIS PRINCIPALES */}
      <section className="kpis">
        <div className="kpi">
          <span>Citas de Hoy</span>
          <strong>{deHoy.length}</strong>
          <small>{citas.filter((c) => c.fecha === hoy() && c.estado === 'FINALIZADA').length} atendidas hoy</small>
        </div>
        <div className="kpi">
          <span>Ingresos Totales</span>
          <strong>{money(ingresos)}</strong>
          <small>{pagos.length} transacciones</small>
        </div>
        <div className="kpi">
          <span>Utilidad Barbería</span>
          <strong className="kpi-utilidad">{money(gananciaBarberia)}</strong>
          <small>Comisiones pagadas: {money(comisiones)}</small>
        </div>
        <div className={alertas.length ? 'kpi alerta' : 'kpi'}>
          <span>Alertas de Inventario</span>
          <strong>{alertas.length}</strong>
          <small>{alertas.length ? 'Insumos en stock crítico' : 'Inventario en niveles óptimos'}</small>
        </div>
      </section>

      {/* SECCIÓN MODO DE BASE DE DATOS Y CONEXIÓN */}
      <section className="card card-conexion">
        <div className="card-header">
          <div>
            <h2>Modo de Base de Datos y Conexión</h2>
            <p className="nota">
              Elige cómo opera la base de datos de tu barbería: de forma local integrada (100% rápida y autónoma) o sincronizada con MockAPI.
            </p>
          </div>
          <span className={`badge-conexion ${config.usarMockApi ? (estadoMock?.ok ? 'online' : 'local') : 'online'}`}>
            {config.usarMockApi
              ? estadoMock?.ok
                ? '🌐 MockAPI Conectada'
                : '🟡 MockAPI (Esperando Recurso)'
              : '🟢 Base de Datos Local Activa (Recomendado)'}
          </span>
        </div>

        <div className="modo-selector-box">
          <label className="radio-modo">
            <input
              type="radio"
              name="modoDb"
              checked={!config.usarMockApi}
              onChange={() => toggleModoMockApi(false)}
            />
            <div>
              <strong>🟢 Modo Base de Datos Integrada (Por defecto)</strong>
              <small className="nota bloque">
                Los datos de citas, clientes, inventario y cobros se guardan en el navegador con respuesta instantánea. No depende de internet ni de APIs externas.
              </small>
            </div>
          </label>

          <label className="radio-modo">
            <input
              type="radio"
              name="modoDb"
              checked={!!config.usarMockApi}
              onChange={() => toggleModoMockApi(true)}
            />
            <div>
              <strong>🌐 Modo MockAPI Externa (Nube)</strong>
              <small className="nota bloque">
                Sincroniza las citas con el proyecto MockAPI: <code>https://mockapi.io/projects/6aae920c606bd915d110eac1</code>
              </small>
            </div>
          </label>
        </div>

        {config.usarMockApi && (
          <div className="form-conexion-grid">
            <label>
              URL Base de la Mock API:
              <input
                value={urlMock}
                onChange={(e) => setUrlMock(e.target.value)}
                placeholder="https://6aae920c606bd915d110eac1.mockapi.io"
              />
            </label>

            <label>
              Nombre del Recurso / Endpoint:
              <input
                value={recursoMock}
                onChange={(e) => setRecursoMock(e.target.value)}
                placeholder="citas"
              />
            </label>

            <div className="btns-conexion">
              <button
                type="button"
                className="pri"
                disabled={probandoConexion}
                onClick={probarConexion}
              >
                {probandoConexion ? 'Probando conexión…' : 'Probar Conexión'}
              </button>

              <button
                type="button"
                className="sec"
                disabled={sincronizando}
                onClick={sincronizar}
              >
                {sincronizando ? 'Sincronizando…' : 'Sincronizar'}
              </button>
            </div>
          </div>
        )}

        {config.usarMockApi && estadoMock && (
          <div className={`resultado-conexion ${estadoMock.ok ? 'res-ok' : 'res-aviso'}`}>
            <p><strong>Estado del servicio:</strong> {estadoMock.mensaje}</p>
            {estadoMock.syncMsg && <p className="sync-info">{estadoMock.syncMsg}</p>}
            {!estadoMock.ok && estadoMock.status === 404 && (
              <small className="nota">
                💡 Para sincronizar en la nube, entra a{' '}
                <a href="https://mockapi.io/projects/6aae920c606bd915d110eac1" target="_blank" rel="noreferrer">
                  mockapi.io
                </a>{' '}
                y crea el recurso <strong>"citas"</strong>. Puedes volver al modo local en cualquier momento con el selector superior.
              </small>
            )}
          </div>
        )}
      </section>

      {/* PRÓXIMAS CITAS */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Próximas Citas en Agenda</h2>
            <p className="nota">Citas programadas y en atención ordenadas cronológicamente.</p>
          </div>
        </div>

        {proximas.length === 0 ? (
          <p className="nota">No hay citas pendientes en este momento.</p>
        ) : (
          <ul className="lista">
            {proximas.map((c) => (
              <li key={c.id}>
                <div className="hora">{c.hora}</div>
                <div className="info">
                  <strong>{c.cliente}</strong>
                  <span>{Array.isArray(c.servicios) ? c.servicios.join(' + ') : c.servicios} · {c.profesional} · {c.fecha}</span>
                </div>
                <Estado e={c.estado} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* RENDIMIENTO POR BARBERO */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Rendimiento y Ganancias por Barbero</h2>
            <p className="nota">Distribución de comisiones generadas en los servicios realizados.</p>
          </div>
        </div>

        {porProf.length === 0 ? (
          <p className="nota">Los datos de comisiones se reflejarán cuando se completen cobros en Caja.</p>
        ) : (
          <div className="barras">
            {porProf.map(([n, v]) => (
              <div key={n} className="barra">
                <span>{n}</span>
                <i style={{ width: `${(v / max) * 100}%` }} />
                <b>{money(v)}</b>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PADRÓN DE CLIENTES Y FIDELIZACIÓN */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Padrón de Clientes y Fidelización</h2>
            <p className="nota">Historial de clientes, visitas acumuladas y puntos para canje de servicios.</p>
          </div>
        </div>

        {clientes.length === 0 ? (
          <p className="nota">Los clientes acumulan 1 punto por cada $ 1.000 pagados.</p>
        ) : (
          <div className="scroll">
            <table className="tabla-clientes">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Visitas</th>
                  <th>Puntos Acumulados</th>
                  <th>Equivalencia en Dinero</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.cliente}>
                    <td>
                      <strong style={{ textTransform: 'capitalize' }}>{c.cliente}</strong>
                    </td>
                    <td>{c.telefono || 'Sin teléfono'}</td>
                    <td>{c.visitas || 1} {c.visitas === 1 ? 'visita' : 'visitas'}</td>
                    <td>
                      <span className="puntos-tag">⭐ {c.saldo} pts</span>
                    </td>
                    <td>
                      <strong>{money(c.saldo * 20)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ACCIONES DE MANTENIMIENTO DEL SISTEMA */}
      <div className="acciones-panel">
        <button type="button" className="sec" onClick={exportarDatos}>
          📥 Exportar Base de Datos (JSON)
        </button>
        <button
          type="button"
          className="sec reinicio"
          onClick={() => {
            if (window.confirm('¿Deseas reiniciar los datos de prueba a sus valores por defecto?')) {
              onReset()
            }
          }}
        >
          🔄 Reiniciar Datos de Prueba
        </button>
      </div>
    </div>
  )
}
