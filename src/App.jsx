import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login from './components/Login.jsx'
import Reservar from './components/Reservar.jsx'
import Agenda from './components/Agenda.jsx'
import Caja from './components/Caja.jsx'
import Ventas from './components/Ventas.jsx'
import Compras from './components/Compras.jsx'
import Inventario from './components/Inventario.jsx'
import HistorialAuditoria from './components/HistorialAuditoria.jsx'
import Panel from './components/Panel.jsx'

function MainApp() {
  const { usuario, autenticado, cargando, esAdmin, esTrabajador, logout } = useAuth()
  const [vista, setVista] = useState('reservar')
  const [tick, setTick] = useState(0)

  const refrescar = () => setTick((t) => t + 1)

  if (cargando) {
    return (
      <div className="pantalla-cargando">
        <div className="spinner-cargando"></div>
        <p>Iniciando BarberFlow...</p>
      </div>
    )
  }

  if (!autenticado) {
    return <Login />
  }

  // Definición de vistas autorizadas según rol (RBAC Frontend estricto)
  const vistasDisponibles = [
    { id: 'reservar', nombre: 'Reservar Cita', rol: 'Operativo', autorizados: ['ADMINISTRADOR', 'TRABAJADOR'] },
    { id: 'agenda', nombre: 'Agenda Operativa', rol: 'Operativo', autorizados: ['ADMINISTRADOR', 'TRABAJADOR'] },
    { id: 'caja', nombre: esTrabajador ? 'Caja / Mis Comisiones' : 'Caja y Comisiones', rol: 'Facturación', autorizados: ['ADMINISTRADOR', 'TRABAJADOR'] },
    { id: 'ventas', nombre: 'Venta Productos', rol: 'Comercial', autorizados: ['ADMINISTRADOR', 'TRABAJADOR'] },
    { id: 'compras', nombre: 'Compras', rol: 'Abastecimiento', autorizados: ['ADMINISTRADOR'] },
    { id: 'inventario', nombre: 'Inventario', rol: 'Insumos', autorizados: ['ADMINISTRADOR'] },
    { id: 'auditoria', nombre: 'Auditoría', rol: 'Historial', autorizados: ['ADMINISTRADOR'] },
    { id: 'panel', nombre: 'Panel y Reportes', rol: 'Administración', autorizados: ['ADMINISTRADOR'] },
  ].filter((v) => v.autorizados.includes(usuario.rol))

  return (
    <div className="app">
      <header className="top">
        <div className="marca-container">
          <div className="marca">
            <div className="logo-badge-nav">BF</div>
            <div>
              <h1>BarberFlow</h1>
              <span className="marca-sub">Sistema Profesional de Barbería · Spring Boot + MySQL</span>
            </div>
          </div>

          <div className="usuario-sesion-box">
            <div className="usuario-info-txt">
              <strong>{usuario.nombre}</strong>
              <span className={`badge-rol-pill ${usuario.rol.toLowerCase()}`}>
                {usuario.rol}
              </span>
            </div>
            <button type="button" className="btn-cerrar-sesion" onClick={logout}>
              Cerrar Sesión
            </button>
          </div>
        </div>

        <nav aria-label="Navegación principal">
          {vistasDisponibles.map((v) => (
            <button
              key={v.id}
              type="button"
              className={vista === v.id ? 'tab on' : 'tab'}
              onClick={() => setVista(v.id)}
            >
              <span className="tab-titulo">{v.nombre}</span>
              <small>{v.rol}</small>
            </button>
          ))}
        </nav>
      </header>

      <main>
        {vista === 'reservar' && <Reservar onChange={refrescar} />}
        {vista === 'agenda' && <Agenda tick={tick} onChange={refrescar} onIrACobrar={() => setVista('caja')} />}
        {vista === 'caja' && <Caja tick={tick} onChange={refrescar} />}
        {vista === 'ventas' && <Ventas tick={tick} onChange={refrescar} />}
        {vista === 'compras' && esAdmin && <Compras tick={tick} onChange={refrescar} />}
        {vista === 'inventario' && esAdmin && (
          <Inventario tick={tick} onChange={refrescar} onVerHistorial={() => setVista('auditoria')} />
        )}
        {vista === 'auditoria' && esAdmin && <HistorialAuditoria />}
        {vista === 'panel' && esAdmin && <Panel tick={tick} onChange={refrescar} />}
      </main>

      <footer className="footer-bar">
        <span>BarberFlow Enterprise · Spring Boot 3 + MySQL + Spring Data JPA + React 18 · DBeaver Ready</span>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
