import { useState } from 'react'
import { api, money, hoy } from '../api/mockApi.js'
import { useData } from '../hooks.js'

const ACCIONES = {
  PROGRAMADA: [
    ['CONFIRMADA', 'Confirmar Cita', 'btn-confirmar'],
    ['CANCELADA', 'Cancelar', 'btn-cancelar'],
  ],
  CONFIRMADA: [
    ['EN_ATENCION', 'Iniciar Atención ✂', 'btn-atencion'],
    ['NO_ASISTIO', 'No Asistió', 'btn-no-asistio'],
    ['CANCELADA', 'Cancelar', 'btn-cancelar'],
  ],
  EN_ATENCION: [
    ['CANCELADA', 'Cancelar Atención', 'btn-cancelar'],
  ],
  CANCELADA: [
    ['PROGRAMADA', 'Reactivar Cita', 'btn-reactivar'],
  ],
  NO_ASISTIO: [
    ['PROGRAMADA', 'Reagendar', 'btn-reactivar'],
  ],
}

export const Estado = ({ e }) => (
  <span className={`estado ${e || 'PROGRAMADA'}`}>
    {String(e || 'PROGRAMADA').replace('_', ' ').toLowerCase()}
  </span>
)

export default function Agenda({ tick, onChange, onIrACobrar }) {
  const [profesionales] = useData(api.getProfesionales, [], [])
  const [profId, setProfId] = useState('') // '' significa todos los barberos
  const [fecha, setFecha] = useState(hoy())
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const [citas, cargando] = useData(
    () =>
      api.getCitas({
        fecha,
        profesionalId: profId ? Number(profId) : null,
        estado: filtroEstado,
        buscar: busqueda,
      }),
    [fecha, profId, filtroEstado, busqueda, tick],
    []
  )

  const mover = async (id, estado) => {
    setError('')
    setExito('')
    try {
      await api.cambiarEstadoCita(id, estado)
      setExito(`Cita actualizada a estado ${estado.replace('_', ' ')}.`)
      onChange()
    } catch (e) {
      setError(e.message)
    }
  }

  const eliminar = async (id, cliente) => {
    if (!window.confirm(`¿Estás seguro de eliminar el registro de cita para "${cliente}"?`)) return
    setError('')
    setExito('')
    try {
      await api.eliminarCita(id)
      setExito('Registro de cita eliminado.')
      onChange()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Agenda y Registros Diarios</h2>
          <p className="nota">Control de citas, flujo de atención y seguimiento de clientes.</p>
        </div>
        <div className="badge-contador">
          <strong>{citas.length}</strong> {citas.length === 1 ? 'cita' : 'citas'}
        </div>
      </div>

      {/* FILTROS PRINCIPALES */}
      <div className="filtros-grid">
        <label>
          Barbero / Estilista:
          <select value={profId} onChange={(e) => setProfId(e.target.value)}>
            <option value="">Todos los profesionales</option>
            {profesionales.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.especialidad})
              </option>
            ))}
          </select>
        </label>

        <label>
          Fecha:
          <div className="input-group-fecha">
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <button
              type="button"
              className={fecha === hoy() ? 'pri-btn-sm on' : 'sec-btn-sm'}
              onClick={() => setFecha(hoy())}
            >
              Hoy
            </button>
          </div>
        </label>

        <label>
          Buscar cliente o servicio:
          <input
            type="search"
            placeholder="Ej. Juan Díaz, teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
      </div>

      {/* TABS DE ESTADOS */}
      <div className="tabs-estados">
        {['TODOS', 'PROGRAMADA', 'CONFIRMADA', 'EN_ATENCION', 'FINALIZADA', 'CANCELADA'].map((st) => (
          <button
            key={st}
            type="button"
            className={filtroEstado === st ? 'tab-estado on' : 'tab-estado'}
            onClick={() => setFiltroEstado(st)}
          >
            {st.replace('_', ' ').toLowerCase()}
          </button>
        ))}
      </div>

      {error && <p className="error banner" role="alert">{error}</p>}
      {exito && <p className="ok banner" role="status">{exito}</p>}

      {cargando ? (
        <p className="nota cargando">Cargando registros de agenda…</p>
      ) : citas.length === 0 ? (
        <div className="alerta-vacia">
          <p>No se encontraron citas para los filtros seleccionados.</p>
          <small className="nota">Puedes registrar una nueva cita desde la pestaña "Reservar cita".</small>
        </div>
      ) : (
        <ul className="lista">
          {citas.map((c) => (
            <li key={c.id} className={`cita-item estado-borde-${c.estado}`}>
              <div className="hora-bloque">
                <span className="hora-txt">{c.hora}</span>
                <small className="duracion-txt">{c.duracionMin} min</small>
              </div>

              <div className="info">
                <div className="info-top">
                  <strong>{c.cliente}</strong>
                  {c.telefono && (
                    <a className="link-tel" href={`tel:${c.telefono}`} title="Llamar al cliente">
                      📞 {c.telefono}
                    </a>
                  )}
                  <Estado e={c.estado} />
                </div>

                <span className="info-servicios">
                  ✂ {Array.isArray(c.servicios) ? c.servicios.join(' + ') : 'Servicio general'}
                </span>

                <div className="info-meta">
                  <span>💈 {c.profesional}</span>
                  <span>💵 {money(c.valorEstimado)}</span>
                  {c.fecha !== hoy() && <span>📅 {c.fecha}</span>}
                </div>

                {c.notas && (
                  <p className="nota-cliente">
                    <em>Nota: "{c.notas}"</em>
                  </p>
                )}

                {c.estado === 'EN_ATENCION' && (
                  <div className="aviso-caja">
                    <span>⚡ En atención actualmente.</span>
                    {onIrACobrar && (
                      <button type="button" className="pri-btn-sm" onClick={() => onIrACobrar(c.id)}>
                        Ir a Caja para Cobrar →
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="btns">
                {(ACCIONES[c.estado] ?? []).map(([est, label, estiloClase]) => (
                  <button
                    key={est}
                    type="button"
                    className={`btn-accion ${estiloClase || 'sec'}`}
                    onClick={() => mover(c.id, est)}
                  >
                    {label}
                  </button>
                ))}

                {['PROGRAMADA', 'CANCELADA', 'NO_ASISTIO'].includes(c.estado) && (
                  <button
                    type="button"
                    className="btn-accion btn-eliminar"
                    title="Eliminar cita del registro"
                    onClick={() => eliminar(c.id, c.cliente)}
                  >
                    🗑
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
