import { useState, useEffect } from 'react'
import { api, money } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'NEQUI_DAVIPLATA']

function Cobro({ cita, onCobroCompletado }) {
  const [metodo, setMetodo] = useState('EFECTIVO')
  const [promo, setPromo] = useState('')
  const [canje, setCanje] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [recibo, setRecibo] = useState(null)

  const puntosCliente = cita.cliente?.puntos || 0
  const valorPunto = 20

  const subtotal = cita.valorEstimado || 0
  let descuentoEstimado = 0
  if (promo.trim().toUpperCase() === 'BARBA10') descuentoEstimado = Math.round((subtotal * 10) / 100)
  if (promo.trim().toUpperCase() === 'FLOW20') descuentoEstimado = Math.round((subtotal * 20) / 100)
  if (promo.trim().toUpperCase() === 'CLIENTE_VIP') descuentoEstimado = Math.min(5000, subtotal)

  const puntosCanjeablesPesos = Math.min(puntosCliente * valorPunto, Math.max(0, subtotal - descuentoEstimado))
  const descuentoPuntos = canje ? puntosCanjeablesPesos : 0
  const totalACobrar = Math.max(0, subtotal - descuentoEstimado - descuentoPuntos)

  const cobrar = async () => {
    setEnviando(true)
    setError('')
    try {
      const res = await api.registrarPago({
        citaId: cita.id,
        metodo,
        codigoPromo: promo,
        canjearPuntos: canje,
      })
      setRecibo(res)
      if (onCobroCompletado) onCobroCompletado()
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (recibo) {
    return (
      <li className="cobro recibo-exito">
        <div className="recibo-box">
          <div className="recibo-top">
            <span className="check-icon">Pago Registrado Exitosamente</span>
            <small>Comprobante #{recibo.id} · {new Date(recibo.fecha).toLocaleString('es-CO')}</small>
          </div>
          <div className="recibo-cuerpo">
            <p><strong>Cliente:</strong> {recibo.clienteNombre || cita.cliente?.nombre}</p>
            <p><strong>Barbero:</strong> {recibo.profesionalNombre || cita.profesional?.nombre} ({recibo.porcentajeComision}%)</p>
            <p><strong>Medio de Pago:</strong> {recibo.metodo}</p>
            <p><strong>Total Cobrado:</strong> <span className="precio-grande">{money(recibo.valorCobrado)}</span></p>
            <div className="recibo-desglose">
              <small>
                Comisión Barbero: {money(recibo.comisionProfesional)} | Barbería: {money(recibo.utilidadNegocio)} | Puntos acumulados: +{recibo.puntosGanados}
              </small>
            </div>
          </div>
        </div>
      </li>
    )
  }

  const nombreCliente = cita.cliente?.nombre || 'Cliente'
  const telCliente = cita.cliente?.telefono || ''
  const nombreBarbero = cita.profesional?.nombre || 'Barbero'
  const serviciosTexto = cita.servicios?.map((s) => s.servicio?.nombre).join(' + ') || 'Servicios'

  return (
    <li className="cobro tarjeta-cobro">
      <div className="info">
        <div className="info-top">
          <strong>{nombreCliente}</strong>
          {telCliente && <span className="tel-sub">Tel: {telCliente}</span>}
          <span className="badge-atencion">En Atención</span>
        </div>
        <span className="info-servicios">
          {serviciosTexto} con <strong>{nombreBarbero}</strong>
        </span>
      </div>

      <div className="form-cobro-grid">
        <label>
          Método de pago:
          <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            {METODOS_PAGO.map((m) => (
              <option key={m} value={m}>
                {m.replace('_', ' / ')}
              </option>
            ))}
          </select>
        </label>

        <label>
          Cupón / Código Promocional:
          <input
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            placeholder="BARBA10, FLOW20, CLIENTE_VIP"
          />
        </label>

        <div className="check-box-container">
          <label className="check">
            <input
              type="checkbox"
              checked={canje}
              disabled={puntosCliente === 0}
              onChange={(e) => setCanje(e.target.checked)}
            />
            Canjear puntos disponibles ({puntosCliente} pts = {money(puntosCliente * valorPunto)})
          </label>
        </div>

        <div className="resumen-cobro-fila">
          <div className="calculo-desglose">
            <span>Subtotal: {money(subtotal)}</span>
            {(descuentoEstimado > 0 || descuentoPuntos > 0) && (
              <span className="desc-txt">Descuentos: -{money(descuentoEstimado + descuentoPuntos)}</span>
            )}
            <strong className="total-a-cobrar">A Cobrar: {money(totalACobrar)}</strong>
          </div>

          <button
            type="button"
            className="pri btn-cobrar"
            disabled={enviando}
            onClick={cobrar}
          >
            {enviando ? 'Verificando inventario y procesando...' : `Finalizar y Cobrar ${money(totalACobrar)}`}
          </button>
        </div>
      </div>

      {error && (
        <div className="alerta-error-bloqueo" role="alert">
          <strong>Bloqueo de Transacción:</strong> {error}
        </div>
      )}
    </li>
  )
}

export default function Caja({ tick, onChange }) {
  const { esAdmin, esTrabajador, usuario } = useAuth()
  const [pendientes, setPendientes] = useState([])
  const [pagos, setPagos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [tick])

  const cargarDatos = async () => {
    setCargando(true)
    setError('')
    try {
      const [citasData, pagosData] = await Promise.all([
        api.getCitas({ estado: 'EN_ATENCION' }),
        api.getPagos(),
      ])
      setPendientes(citasData)
      setPagos(pagosData)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const totalIngresos = pagos.reduce((acc, p) => acc + (p.valorCobrado || 0), 0)
  const totalComisiones = pagos.reduce((acc, p) => acc + (p.comisionProfesional || 0), 0)
  const totalNegocio = pagos.reduce((acc, p) => acc + (p.utilidadNegocio || 0), 0)

  return (
    <div className="caja-modulo">
      {/* SECCIÓN 1: CITAS EN ATENCIÓN PENDIENTES DE COBRO */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Caja y Facturación</h2>
            <p className="nota">Liquidación transaccional con control estricto de existencias e insumos.</p>
          </div>
          <span className="badge-contador">{pendientes.length} por cobrar</span>
        </div>

        {error && <div className="alerta-error">{error}</div>}

        {cargando ? (
          <p className="nota cargando">Actualizando caja...</p>
        ) : pendientes.length === 0 ? (
          <div className="alerta-vacia">
            <p>No hay citas en atención listas para cobrar.</p>
            <small className="nota">Inicie la atención de un cliente desde la Agenda para registrar su cobro.</small>
          </div>
        ) : (
          <ul className="lista">
            {pendientes.map((c) => (
              <Cobro key={c.id} cita={c} onCobroCompletado={cargarDatos} />
            ))}
          </ul>
        )}
      </section>

      {/* SECCIÓN 2: HISTORIAL DE VENTAS Y LIQUIDACIONES */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2>{esTrabajador ? 'Mis Ventas y Comisiones' : 'Historial de Pagos y Liquidación General'}</h2>
            <p className="nota">
              {esTrabajador
                ? `Registro personal de servicios y liquidaciones para ${usuario?.nombre}.`
                : 'Auditoría financiera consolidada de todos los profesionales y margen del negocio.'}
            </p>
          </div>
        </div>

        {/* RESUMEN FINANCIERO */}
        <div className="kpis-caja">
          <div className="kpi-mini">
            <span>{esTrabajador ? 'Total Ventas Propias' : 'Total Recaudado'}</span>
            <strong>{money(totalIngresos)}</strong>
          </div>
          <div className="kpi-mini">
            <span>{esTrabajador ? 'Mi Comisión Ganada' : 'Total Comisiones Barberos'}</span>
            <strong className="comision-txt">{money(totalComisiones)}</strong>
          </div>
          {esAdmin && (
            <div className="kpi-mini">
              <span>Ingreso Neto Negocio</span>
              <strong className="utilidad-txt">{money(totalNegocio)}</strong>
            </div>
          )}
        </div>

        {pagos.length === 0 ? (
          <p className="nota">No se registran transacciones cobradas en este periodo.</p>
        ) : (
          <div className="tabla-responsive">
            <table className="tabla-pagos tabla-profesional">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  {esAdmin && <th>Barbero</th>}
                  <th>Método</th>
                  <th>Cobrado</th>
                  {esAdmin && <th>Costo Insumos</th>}
                  <th>Comisión</th>
                  {esAdmin && <th>Utilidad Negocio</th>}
                  <th>Fidelización</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <small>
                        {new Date(p.fecha).toLocaleDateString('es-CO')}
                      </small>
                    </td>
                    <td>
                      <strong>{p.cliente?.nombre || 'Cliente'}</strong>
                    </td>
                    {esAdmin && (
                      <td>
                        {p.profesional?.nombre || 'Barbero'} <small>({p.porcentajeComision}%)</small>
                      </td>
                    )}
                    <td>
                      <span className="metodo-tag">{p.metodo.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <strong>{money(p.valorCobrado)}</strong>
                      {p.descuento > 0 && <small className="desc-tag"> -{money(p.descuento)}</small>}
                    </td>
                    {esAdmin && <td>{money(p.costoInsumos || 0)}</td>}
                    <td className="col-profesional">
                      <strong>{money(p.comisionProfesional)}</strong>
                    </td>
                    {esAdmin && <td className="col-barberia">{money(p.utilidadNegocio)}</td>}
                    <td>
                      <span className="puntos-tag">+{p.puntosGanados} pts</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
