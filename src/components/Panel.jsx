import { useState, useEffect } from 'react'
import { api, money, hoy } from '../api/client.js'

export default function Panel({ tick }) {
  const [reporte, setReporte] = useState(null)
  const [clientes, setClientes] = useState([])
  const [insumos, setInsumos] = useState([])
  const [productos, setProductos] = useState([])
  const [compras, setCompras] = useState([])
  const [ventas, setVentas] = useState([])
  const [citasHoy, setCitasHoy] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [tick])

  const cargarDatos = async () => {
    setCargando(true)
    setError('')
    try {
      const [repData, cliData, insData, prodData, compData, ventData, citasData, usData] =
        await Promise.all([
          api.getReporteFinanciero(),
          api.getClientes(),
          api.getInsumos(),
          api.getProductos(),
          api.getCompras(),
          api.getVentas(),
          api.getCitas({ fecha: hoy() }),
          api.getUsuarios(),
        ])
      setReporte(repData)
      setClientes(cliData)
      setInsumos(insData)
      setProductos(prodData)
      setCompras(compData)
      setVentas(ventData)
      setCitasHoy(citasData.filter((c) => !['CANCELADA', 'NO_ASISTIO'].includes(c.estado)))
      setUsuarios(usData)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const exportarAuditoriaJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            reporteFinanciero: reporte,
            totalCompras: compras.reduce((sum, c) => sum + (c.total || 0), 0),
            totalVentasMinoristas: ventas.reduce((sum, v) => sum + (v.total || 0), 0),
            clientes,
            insumos,
            productos,
            usuarios,
            exportadoEn: new Date().toISOString(),
          },
          null,
          2
        )
      )
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `barberflow_auditoria_mysql_${hoy()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const insumosCriticos = insumos.filter((i) => i.existencias <= i.stockMinimo)
  const productosCriticos = productos.filter((p) => p.existencias <= p.stockMinimo)

  const totalComprasMonto = compras.reduce((sum, c) => sum + (c.total || 0), 0)
  const totalVentasMonto = ventas.reduce((sum, v) => sum + (v.total || 0), 0)
  const totalRecaudoServicios = reporte?.totalIngresos || 0
  const totalComisiones = reporte?.totalComisiones || 0
  const totalUtilidadServicios = reporte?.totalUtilidad || 0

  return (
    <div className="panel-modulo">
      {/* SECCIÓN 1: CABECERA Y METRICAS */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Panel Administrativo y Reportes Financieros</h2>
            <p className="nota">
              Indicadores consolidados en tiempo real desde la base de datos MySQL corporativa.
            </p>
          </div>
          <button type="button" className="sec-btn-sm" onClick={exportarAuditoriaJson}>
            Exportar Auditoría MySQL (JSON)
          </button>
        </div>

        {error && <div className="alerta-error">{error}</div>}

        {/* INDICADORES CLAVE (KPIS) */}
        <div className="kpis-grid">
          <div className="kpi-card">
            <span className="kpi-label">Citas Programadas Hoy</span>
            <strong className="kpi-valor">{citasHoy.length}</strong>
            <small className="kpi-sub">
              {citasHoy.filter((c) => c.estado === 'FINALIZADA').length} atendidas
            </small>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Recaudo Servicios</span>
            <strong className="kpi-valor">{money(totalRecaudoServicios)}</strong>
            <small className="kpi-sub">{reporte?.cantidadVentas || 0} liquidaciones de citas</small>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Ventas de Productos</span>
            <strong className="kpi-valor">{money(totalVentasMonto)}</strong>
            <small className="kpi-sub">{ventas.length} transacciones minoristas</small>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Egresos por Compras</span>
            <strong className="kpi-valor" style={{ color: 'var(--rojo)' }}>
              {money(totalComprasMonto)}
            </strong>
            <small className="kpi-sub">{compras.length} facturas de proveedores</small>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Comisiones a Barberos</span>
            <strong className="kpi-valor comision-txt">{money(totalComisiones)}</strong>
            <small className="kpi-sub">Base neta deducida de insumos</small>
          </div>

          <div className="kpi-card destacado">
            <span className="kpi-label">Margen Neto del Negocio</span>
            <strong className="kpi-valor utilidad-txt">{money(totalUtilidadServicios)}</strong>
            <small className="kpi-sub">Utilidad retenida por el establecimiento</small>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Insumos Críticos</span>
            <strong className={`kpi-valor ${insumosCriticos.length > 0 ? 'critico-txt' : ''}`}>
              {insumosCriticos.length}
            </strong>
            <small className="kpi-sub">{insumos.length} insumos registrados</small>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Productos Críticos</span>
            <strong className={`kpi-valor ${productosCriticos.length > 0 ? 'critico-txt' : ''}`}>
              {productosCriticos.length}
            </strong>
            <small className="kpi-sub">{productos.length} productos en catálogo</small>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: RENDIMIENTO POR PROFESIONAL */}
      <section className="card">
        <div className="card-header">
          <div>
            <h3>Distribución de Rendimiento por Barbero</h3>
            <p className="nota">
              Servicios atendidos, recaudación generada y liquidación individual por trabajador.
            </p>
          </div>
        </div>

        {cargando ? (
          <p className="nota cargando">Consultando métricas de profesionales desde MySQL...</p>
        ) : !reporte?.porProfesional || reporte.porProfesional.length === 0 ? (
          <p className="vacio-texto">No se registran citas liquidadas para desglosar por profesional.</p>
        ) : (
          <div className="tabla-responsive">
            <table className="tabla-profesional">
              <thead>
                <tr>
                  <th>Profesional</th>
                  <th>Servicios Realizados</th>
                  <th>Ventas Totales</th>
                  <th>Comisión Liquidada</th>
                  <th>Aporte Neto al Establecimiento</th>
                </tr>
              </thead>
              <tbody>
                {reporte.porProfesional.map((p) => {
                  const aporteNegocio = p.totalVentas - p.totalComision
                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.nombre}</strong>
                      </td>
                      <td>{p.serviciosRealizados}</td>
                      <td>
                        <strong>{money(p.totalVentas)}</strong>
                      </td>
                      <td className="col-profesional">{money(p.totalComision)}</td>
                      <td className="col-barberia">
                        <strong>{money(aporteNegocio)}</strong>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECCIÓN 3: GESTIÓN DE USUARIOS Y ACCESO (RBAC) */}
      <section className="card">
        <div className="card-header">
          <div>
            <h3>Usuarios del Sistema y Control de Acceso (RBAC)</h3>
            <p className="nota">Cuentas con credenciales seguras y roles autorizados en MySQL.</p>
          </div>
        </div>

        <div className="tabla-responsive">
          <table className="tabla-profesional">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo Electrónico</th>
                <th>Rol Asignado</th>
                <th>Perfil Vinculado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.nombre}</strong>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge-rol ${u.rol.toLowerCase()}`}>{u.rol}</span>
                  </td>
                  <td>{u.profesional?.nombre || 'Administración Central'}</td>
                  <td>
                    <span className="tag-activo">{u.activo ? 'Activo' : 'Inactivo'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECCIÓN 4: PADRÓN DE CLIENTES Y FIDELIZACIÓN */}
      <section className="card">
        <div className="card-header">
          <div>
            <h3>Padrón de Clientes y Fidelización</h3>
            <p className="nota">Historial de recurrencia y saldos de puntos acumulados para canje.</p>
          </div>
        </div>

        <div className="tabla-responsive">
          <table className="tabla-profesional">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Visitas Registradas</th>
                <th>Puntos Acumulados</th>
                <th>Equivalencia en Descuentos</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.nombre}</strong>
                  </td>
                  <td>{c.telefono || 'Sin registrar'}</td>
                  <td>{c.visitas}</td>
                  <td>
                    <span className="puntos-tag">{c.puntos} pts</span>
                  </td>
                  <td>{money(c.puntos * 20)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
