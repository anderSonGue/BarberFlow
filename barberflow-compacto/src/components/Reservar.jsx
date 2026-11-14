import { useState } from 'react'
import { api, money, hoy } from '../api/mockApi.js'
import { useData } from '../hooks.js'

const PASOS = ['Servicios', 'Barbero', 'Fecha', 'Horario', 'Registro y Confirmación']

export default function Reservar({ onChange }) {
  const [paso, setPaso] = useState(0)
  const [sel, setSel] = useState({
    servicioIds: [],
    profesionalId: null,
    fecha: hoy(),
    hora: '',
    cliente: '',
    telefono: '',
    notas: '',
  })
  const [msg, setMsg] = useState({ tipo: '', texto: '' })
  const [guardando, setGuardando] = useState(false)

  const [servicios] = useData(api.getServicios, [], [])
  const [profesionales] = useData(api.getProfesionales, [], [])
  const [clientesRegistrados] = useData(api.getClientes, [], [])

  const [franjas, cargandoFranjas] = useData(
    () => (sel.profesionalId && sel.servicioIds.length ? api.getDisponibilidad(sel) : Promise.resolve([])),
    [sel.profesionalId, sel.fecha, sel.servicioIds.join(',')],
    []
  )

  const [puntos] = useData(
    () => (sel.cliente.trim() ? api.getPuntos(sel.cliente) : Promise.resolve({ saldo: 0 })),
    [sel.cliente],
    { saldo: 0 }
  )

  const elegidos = servicios.filter((s) => sel.servicioIds.includes(s.id))
  const total = elegidos.reduce((t, s) => t + s.precio, 0)
  const minutos = elegidos.reduce((t, s) => t + s.duracionMin, 0)
  const prof = profesionales.find((p) => p.id === sel.profesionalId)

  const puedeAvanzar = [
    sel.servicioIds.length > 0,
    !!sel.profesionalId,
    !!sel.fecha,
    !!sel.hora,
    sel.cliente.trim().length >= 2,
  ][paso]

  const toggleServicio = (id) =>
    setSel((s) => ({
      ...s,
      hora: '',
      servicioIds: s.servicioIds.includes(id)
        ? s.servicioIds.filter((x) => x !== id)
        : [...s.servicioIds, id],
    }))

  const seleccionarClienteExistente = (c) => {
    setSel((s) => ({
      ...s,
      cliente: c.nombre,
      telefono: c.telefono || s.telefono,
      notas: c.notas || s.notas,
    }))
  }

  const confirmar = async () => {
    setGuardando(true)
    setMsg({ tipo: '', texto: '' })
    try {
      await api.crearCita(sel)
      setMsg({
        tipo: 'ok',
        texto: `¡Cita registrada con éxito! Cliente: ${sel.cliente} para el ${sel.fecha} a las ${sel.hora}. Estado: PROGRAMADA.`,
      })
      setSel({
        servicioIds: [],
        profesionalId: null,
        fecha: hoy(),
        hora: '',
        cliente: '',
        telefono: '',
        notas: '',
      })
      setPaso(0)
      onChange()
    } catch (e) {
      setMsg({ tipo: 'error', texto: e.message })
      setSel((s) => ({ ...s, hora: '' }))
      setPaso(3) // Volver a selección de hora si hubo conflicto
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Registrar Nueva Cita</h2>
          <p className="nota">Agendamiento de servicios, selección de barbero y asignación de turno.</p>
        </div>
        {elegidos.length > 0 && (
          <div className="resumen-mini">
            <span>{minutos} min</span>
            <strong>{money(total)}</strong>
          </div>
        )}
      </div>

      <ol className="pasos" aria-label="Progreso del registro">
        {PASOS.map((p, i) => (
          <li key={p} className={i === paso ? 'on' : i < paso ? 'hecho' : ''}>
            <span className="paso-num">{i + 1}</span> {p}
          </li>
        ))}
      </ol>

      {msg.texto && <p className={msg.tipo === 'ok' ? 'ok banner' : 'error banner'} role="status">{msg.texto}</p>}

      {/* PASO 1: SERVICIOS */}
      {paso === 0 && (
        <div>
          <p className="nota">Elige uno o varios servicios para el cliente:</p>
          <div className="chips">
            {servicios.map((s) => {
              const seleccionado = sel.servicioIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  className={seleccionado ? 'chip on' : 'chip'}
                  onClick={() => toggleServicio(s.id)}
                >
                  <div className="chip-top">
                    <strong>{s.nombre}</strong>
                    {seleccionado && <span className="tag-check">✓</span>}
                  </div>
                  <div className="chip-meta">
                    <span className="categoria-tag">{s.categoria}</span>
                    <span>{s.duracionMin} min</span>
                    <strong className="precio-tag">{money(s.precio)}</strong>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* PASO 2: PROFESIONAL */}
      {paso === 1 && (
        <div>
          <p className="nota">Selecciona el barbero o estilista que atenderá al cliente:</p>
          <div className="chips">
            {profesionales.map((p) => {
              const seleccionado = sel.profesionalId === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  className={seleccionado ? 'chip on' : 'chip'}
                  onClick={() => setSel((s) => ({ ...s, profesionalId: p.id, hora: '' }))}
                >
                  <div className="chip-top">
                    <strong>💈 {p.nombre}</strong>
                    {seleccionado && <span className="tag-check">✓</span>}
                  </div>
                  <span className="chip-desc">{p.especialidad}</span>
                  <div className="chip-meta">
                    <span>★ {p.calificacion}</span>
                    <span>Comisión: {p.porcentaje}%</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* PASO 3: FECHA */}
      {paso === 2 && (
        <div className="fecha-box">
          <label>
            Fecha de atención:
            <input
              type="date"
              min={hoy()}
              value={sel.fecha}
              onChange={(e) => setSel((s) => ({ ...s, fecha: e.target.value, hora: '' }))}
            />
          </label>
          <div className="fechas-rapidas">
            <button
              type="button"
              className={sel.fecha === hoy() ? 'pri' : 'sec'}
              onClick={() => setSel((s) => ({ ...s, fecha: hoy(), hora: '' }))}
            >
              Hoy ({hoy()})
            </button>
            <button
              type="button"
              className={sel.fecha === hoy(1) ? 'pri' : 'sec'}
              onClick={() => setSel((s) => ({ ...s, fecha: hoy(1), hora: '' }))}
            >
              Mañana ({hoy(1)})
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: HORARIOS DISPONIBLES */}
      {paso === 3 && (
        <div>
          <p className="nota">
            Franjas libres de <strong>{prof?.nombre}</strong> el <strong>{sel.fecha}</strong> ({minutos} min requeridos):
          </p>
          {cargandoFranjas && <p className="nota cargando">Consultando disponibilidad en agenda…</p>}
          {!cargandoFranjas && franjas.length === 0 && (
            <div className="alerta-vacia">
              <p>No hay franjas disponibles para esta fecha o duración.</p>
              <button type="button" className="sec" onClick={() => setPaso(2)}>
                Seleccionar otra fecha
              </button>
            </div>
          )}
          <div className="franjas">
            {franjas.map((h) => (
              <button
                key={h}
                type="button"
                className={h === sel.hora ? 'franja on' : 'franja'}
                onClick={() => setSel((s) => ({ ...s, hora: h }))}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PASO 5: DATOS DEL CLIENTE Y CONFIRMACIÓN */}
      {paso === 4 && (
        <div className="registro-cliente">
          <div className="grid-form">
            <label>
              Nombre completo del cliente *
              <input
                value={sel.cliente}
                onChange={(e) => setSel((s) => ({ ...s, cliente: e.target.value }))}
                placeholder="Ej. Juan Díaz"
                autoFocus
              />
            </label>

            <label>
              Teléfono / WhatsApp de contacto
              <input
                type="tel"
                value={sel.telefono}
                onChange={(e) => setSel((s) => ({ ...s, telefono: e.target.value }))}
                placeholder="Ej. 300 123 4567"
              />
            </label>
          </div>

          {clientesRegistrados.length > 0 && !sel.cliente && (
            <div className="clientes-sugeridos">
              <span className="nota">O selecciona un cliente frecuente:</span>
              <div className="chips-mini">
                {clientesRegistrados.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="chip-mini"
                    onClick={() => seleccionarClienteExistente(c)}
                  >
                    {c.nombre} {c.telefono && `(${c.telefono})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label>
            Notas u observaciones del corte
            <input
              value={sel.notas}
              onChange={(e) => setSel((s) => ({ ...s, notas: e.target.value }))}
              placeholder="Ej. Degradado medio en los lados, barba perfilada con navaja"
            />
          </label>

          <div className="resumen-final">
            <h3>Detalles de la Reserva</h3>
            <div className="resumen-grid">
              <div>
                <small>Servicios:</small>
                <strong>{elegidos.map((s) => s.nombre).join(' + ')}</strong>
              </div>
              <div>
                <small>Barbero asignado:</small>
                <strong>{prof?.nombre}</strong>
              </div>
              <div>
                <small>Fecha y Hora:</small>
                <strong>{sel.fecha} a las {sel.hora} ({minutos} min)</strong>
              </div>
              <div>
                <small>Valor total estimado:</small>
                <strong className="precio-destacado">{money(total)}</strong>
              </div>
            </div>
            <div className="puntos-banner">
              <span>🎁 Este servicio acumulará <strong>+{Math.floor(total / 1000)} puntos</strong> de fidelización para el cliente.</span>
              {puntos.saldo > 0 && (
                <span>Saldo acumulado actual: <strong>{puntos.saldo} puntos</strong> (${money(puntos.saldo * 20)} en descuentos).</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACCIONES DEL FORMULARIO */}
      <div className="acciones">
        <button
          type="button"
          className="sec"
          disabled={paso === 0}
          onClick={() => setPaso((p) => Math.max(0, p - 1))}
        >
          ← Atrás
        </button>

        {paso < 4 ? (
          <button
            type="button"
            className="pri"
            disabled={!puedeAvanzar}
            onClick={() => setPaso((p) => p + 1)}
          >
            Continuar →
          </button>
        ) : (
          <button
            type="button"
            className="pri"
            disabled={!puedeAvanzar || guardando}
            onClick={confirmar}
          >
            {guardando ? 'Guardando registro…' : '✓ Registrar y Confirmar Cita'}
          </button>
        )}
      </div>
    </section>
  )
}
