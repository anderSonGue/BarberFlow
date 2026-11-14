import { useState } from 'react'
import { api, money, METODOS_PAGO } from '../api/mockApi.js'
import { useData } from '../hooks.js'

function Cobro({ cita, onChange }) {
  const [metodo, setMetodo] = useState('EFECTIVO')
  const [promo, setPromo] = useState('')
  const [canje, setCanje] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [recibo, setRecibo] = useState(null)

  const [puntos] = useData(() => api.getPuntos(cita.cliente), [cita.cliente], { saldo: 0, valorPunto: 20 })

  const subtotal = cita.valorEstimado || 0
  let descuentoEstimado = 0
  if (promo.trim().toUpperCase() === 'BARBA10') descuentoEstimado = Math.round((subtotal * 10) / 100)
  if (promo.trim().toUpperCase() === 'FLOW20') descuentoEstimado = Math.round((subtotal * 20) / 100)
  if (promo.trim().toUpperCase() === 'CLIENTE_VIP') descuentoEstimado = Math.min(5000, subtotal)

  const puntosCanjeablesPesos = Math.min(puntos.saldo * (puntos.valorPunto || 20), Math.max(0, subtotal - descuentoEstimado))
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
      onChange()
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
            <span className="check-icon">✓ Pago Registrado Exitosamente</span>
            <small>Recibo #{recibo.id} · {recibo.fecha} {recibo.hora}</small>
          </div>
          <div className="recibo-cuerpo">
            <p><strong>Cliente:</strong> {recibo.cliente}</p>
            <p><strong>Barbero:</strong> {recibo.profesional} ({recibo.porcentaje}%)</p>
            <p><strong>Medio de Pago:</strong> {recibo.metodo}</p>
            <p><strong>Total Cobrado:</strong> <span className="precio-grande">{money(recibo.valorCobrado)}</span></p>
            <div className="recibo-desglose">
              <small>Comisión Barbero: {money(recibo.valorProfesional)} | Barbería: {money(recibo.valorEstablecimiento)} | Puntos ganados: +{recibo.puntosGanados}</small>
            </div>
          </div>
        </div>
      </li>
    )
  }

  return (
    <li className="cobro tarjeta-cobro">
      <div className="info">
        <div className="info-top">
          <strong>{cita.cliente}</strong>
          {cita.telefono && <span className="tel-sub">📞 {cita.telefono}</span>}
          <span className="badge-atencion">En Atención</span>
        </div>
        <span className="info-servicios">
          ✂ {Array.isArray(cita.servicios) ? cita.servicios.join(' + ') : 'Servicios'} con <strong>{cita.profesional}</strong>
        </span>
      </div>

      <div className="form-cobro-grid">
        <label>
          Método de pago:
          <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            {METODOS_PAGO.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        <label>
          Cupón / Código Promo:
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
              disabled={puntos.saldo === 0}
              onChange={(e) => setCanje(e.target.checked)}
            />
            Canjear puntos disponibles ({puntos.saldo} pts = {money(puntos.saldo * (puntos.valorPunto || 20))})
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
            {enviando ? 'Procesando cobro…' : `✓ Finalizar y Cobrar ${money(totalACobrar)}`}
          </button>
        </div>
      </div>

      {error && <p className="error banner" role="alert">{error}</p>}
    </li>
  )
}

export default function Caja({ tick, onChange }) {
  const [pendientes] = useData(
    () => api.getCitas().then((l) => l.filter((c) => c.estado === 'EN_ATENCION')),
    [tick],
    []
  )
  const [pagos] = useData(api.getPagos, [tick], [])
  const [config] = useData(api.getConfig, [tick], { descontarInsumos: true })

  const totalIngresos = pagos.reduce((acc, p) => acc + (p.valorCobrado || 0), 0)
  const totalComisiones = pagos.reduce((acc, p) => acc + (p.valorProfesional || 0), 0)
  const totalEstablecimiento = pagos.reduce((acc, p) => acc + (p.valorEstablecimiento || 0), 0)

  return (
    <div className="caja-modulo">
      {/* SECCIÓN 1: CITAS PENDIENTES DE COBRO */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Caja y Facturación</h2>
            <p className="nota">Cobro de citas en atención, cálculo de comisiones y registro de pagos.</p>
          </div>
          <span className="badge-contador">{pendientes.length} por cobrar</span>
        </div>

        {pendientes.length === 0 ? (
          <div className="alerta-vacia">
            <p>No hay citas en atención listas para cobrar.</p>
            <small className="nota">Inicia la atención de un cliente desde el módulo "Agenda" para procesar su cobro aquí.</small>
          </div>
        ) : (
          <ul className="lista">
            {pendientes.map((c) => (
              <Cobro key={c.id} cita={c} onChange={onChange} />
            ))}
          </ul>
        )}
      </section>

      {/* SECCIÓN 2: HISTORIAL DE PAGOS Y COMISIONES */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Historial de Pagos y Liquidación de Comisiones</h2>
            <p className="nota">Registro histórico de transacciones, porcentaje de barberos e ingresos netos.</p>
          </div>
          <label className="check-config">
            <input
              type="checkbox"
              checked={config.descontarInsumos}
              onChange={(e) => api.setConfig({ descontarInsumos: e.target.checked }).then(onChange)}
            />
            Descontar costo de insumos de la base comisionable
          </label>
        </div>

        {/* RESUMEN FINANCIERO */}
        <div className="kpis-caja">
          <div className="kpi-mini">
            <span>Total Recaudado</span>
            <strong>{money(totalIngresos)}</strong>
          </div>
          <div className="kpi-mini">
            <span>Comisiones Barberos</span>
            <strong className="comision-txt">{money(totalComisiones)}</strong>
          </div>
          <div className="kpi-mini">
            <span>Ingreso Neto Barbería</span>
            <strong className="utilidad-txt">{money(totalEstablecimiento)}</strong>
          </div>
        </div>

        {pagos.length === 0 ? (
          <p className="nota">Aún no se han registrado cobros el día de hoy.</p>
        ) : (
          <div className="scroll">
            <table className="tabla-pagos">
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Cliente</th>
                  <th>Barbero</th>
                  <th>Método</th>
                  <th>Cobrado</th>
                  <th>Insumos</th>
                  <th>Base</th>
                  <th>Comisión Barbero</th>
                  <th>Barbería</th>
                  <th>Fidelización</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <small>{p.fecha} {p.hora || ''}</small>
                    </td>
                    <td>
                      <strong>{p.cliente}</strong>
                      {p.telefono && <small className="bloque">{p.telefono}</small>}
                    </td>
                    <td>
                      {p.profesional} <small>({p.porcentaje}%)</small>
                    </td>
                    <td>
                      <span className="metodo-tag">{p.metodo}</span>
                    </td>
                    <td>
                      <strong>{money(p.valorCobrado)}</strong>
                      {p.descuento > 0 && <small className="desc-tag"> -{money(p.descuento)}</small>}
                    </td>
                    <td>{money(p.costoInsumos || 0)}</td>
                    <td>{money(p.base || p.valorCobrado)}</td>
                    <td className="col-profesional">{money(p.valorProfesional)}</td>
                    <td className="col-barberia">{money(p.valorEstablecimiento)}</td>
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
