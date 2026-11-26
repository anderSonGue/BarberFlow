import { useState, useEffect } from 'react'
import { api, money, hoy } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const ACCIONES = {
  PROGRAMADA: [
    ['CONFIRMADA', 'Confirmar Cita', 'btn-confirmar'],
    ['CANCELADA', 'Cancelar', 'btn-cancelar'],
  ],
  CONFIRMADA: [
    ['EN_ATENCION', 'Iniciar Atención', 'btn-atencion'],
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
  const { esAdmin, usuario } = useAuth()
  const [profesionales, setProfesionales] = useState([])
  const [profId, setProfId] = useState(usuario?.rol === 'TRABAJADOR' && usuario?.profesionalId ? String(usuario.profesionalId) : '')
  const [fecha, setFecha] = useState(hoy())
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [busqueda, setBusqueda] = useState('')
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  useEffect(() => {
    cargarProfesionales()
  }, [])

  useEffect(() => {
    cargarCitas()
  }, [fecha, profId, filtroEstado, busqueda, tick])

  const cargarProfesionales = async () => {
    try {
      const data = await api.getProfesionales()
      setProfesionales(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const cargarCitas = async () => {
    setCargando(true)
    setError('')
    try {
      const data = await api.getCitas({
        fecha,
        profesionalId: profId ? Number(profId) : null,
        estado: filtroEstado,
        buscar: busqueda,
      })
      setCitas(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const mover = async (id, estado) => {
    setError('')
    setExito('')
    try {
      await api.cambiarEstadoCita(id, estado)
      setExito(`Cita actualizada a estado ${estado.replace('_', ' ')}.`)
      cargarCitas()
      if (onChange) onChange()
    } catch (e) {
      setError(e.message)
    }
  }

  const eliminar = async (id, clienteNombre) => {
    if (!window.confirm(`¿Está seguro de eliminar el registro de cita para "${clienteNombre}"?`)) return
    setError('')
    setExito('')
    try {
      await api.eliminarCita(id)
      setExito('Registro de cita eliminado con éxito.')
      cargarCitas()
      if (onChange) onChange()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Agenda y Registros Operativos</h2>
          <p className="nota">Control de citas, flujo de atención y seguimiento de clientes.</p>
        </div>
        <div className="badge-contador">
          <strong>{citas.length}</strong> {citas.length === 1 ? 'cita' : 'citas'}
        </div>
      </div>

      {/* FILTROS PRINCIPALES */}
      <div className="filtros-grid">
        {esAdmin ? (
          <label>
            Barbero / Profesional:
            <select value={profId} onChange={(e) => setProfId(e.target.value)}>
              <option value="">Todos los profesionales</option>
              {profesionales.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.especialidad})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Profesional:
            <input
              type="text"
              readOnly
              value={usuario?.nombre || 'Mi Agenda'}
              className="input-readonly"
            />
          </label>
        )}

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
            placeholder="Nombre, teléfono o notas..."
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
        <p className="nota cargando">Cargando registros de agenda...</p>
      ) : citas.length === 0 ? (
        <div className="alerta-vacia">
          <p>No se encontraron citas para los filtros seleccionados.</p>
        </div>
      ) : (
        <ul className="lista">
          {citas.map((c) => {
            const clienteNombre = c.cliente?.nombre || 'Cliente'
            const clienteTelefono = c.cliente?.telefono || ''
            const barberoNombre = c.profesional?.nombre || 'Barbero'
            const listaServicios = c.servicios?.map((cs) => cs.servicio?.nombre).join(' + ') || 'Servicio'

            return (
              <li key={c.id} className={`cita-item estado-borde-${c.estado}`}>
                <div className="hora-bloque">
                  <span className="hora-txt">{c.hora}</span>
                  <small className="duracion-txt">{c.duracionMin} min</small>
                </div>

                <div className="info">
                  <div className="info-top">
                    <strong>{clienteNombre}</strong>
                    {clienteTelefono && (
                      <a className="link-tel" href={`tel:${clienteTelefono}`} title="Llamar al cliente">
                        Tel: {clienteTelefono}
                      </a>
                    )}
                    <Estado e={c.estado} />
                  </div>

                  <span className="info-servicios">
                    Servicios: {listaServicios}
                  </span>

                  <div className="info-meta">
                    <span>Atiende: {barberoNombre}</span>
                    <span>Estimado: {money(c.valorEstimado)}</span>
                    {c.fecha !== hoy() && <span>Fecha: {c.fecha}</span>}
                  </div>

                  {c.notas && (
                    <p className="nota-cliente">
                      <em>Detalle: "{c.notas}"</em>
                    </p>
                  )}

                  {c.estado === 'EN_ATENCION' && (
                    <div className="aviso-caja">
                      <span>Cita en proceso de atención.</span>
                      {onIrACobrar && (
                        <button type="button" className="pri-btn-sm" onClick={() => onIrACobrar(c.id)}>
                          Proceder al Cobro en Caja
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

                  {esAdmin && ['PROGRAMADA', 'CANCELADA', 'NO_ASISTIO'].includes(c.estado) && (
                    <button
                      type="button"
                      className="btn-accion btn-eliminar"
                      title="Eliminar cita (Solo Administrador)"
                      onClick={() => eliminar(c.id, clienteNombre)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
