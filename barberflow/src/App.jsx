import { useState } from 'react'
import { api } from './api/mockApi.js'
import { useData } from './hooks.js'
import Reservar from './components/Reservar.jsx'
import Agenda from './components/Agenda.jsx'
import Caja from './components/Caja.jsx'
import Inventario from './components/Inventario.jsx'
import Panel from './components/Panel.jsx'

const VISTAS = [
  ['reservar', 'Reservar cita', 'Cliente / Recepción'],
  ['agenda', 'Agenda y Registros', 'Barberos'],
  ['caja', 'Caja y Comisiones', 'Facturación'],
  ['inventario', 'Inventario', 'Insumos'],
  ['panel', 'Panel y Base de Datos', 'Administración'],
]

export default function App() {
  const [vista, setVista] = useState('reservar')
  const [tick, setTick] = useState(0)

  const refrescar = () => setTick((t) => t + 1)
  const [config] = useData(api.getConfig, [tick], { usarMockApi: false })

  const reiniciar = async () => {
    await api.reiniciarDatos()
    refrescar()
  }

  const irACaja = () => {
    setVista('caja')
  }

  return (
    <div className="app">
      <header className="top">
        <div className="marca-container">
          <div className="marca">
            <span className="tijera" aria-hidden="true">✂</span>
            <div>
              <h1>BarberFlow</h1>
              <span className="marca-sub">Sistema de Registros y Gestión de Barbería</span>
            </div>
          </div>
          <div className="estado-api-badge">
            <span className={`dot-online ${config.usarMockApi ? 'online-mock' : 'online-local'}`}></span>
            <span>{config.usarMockApi ? '🌐 MockAPI Activa' : '🟢 Base de Datos Local (Activa)'}</span>
          </div>
        </div>

        <nav aria-label="Módulos principales">
          {VISTAS.map(([id, nombre, rol]) => (
            <button
              key={id}
              type="button"
              className={vista === id ? 'tab on' : 'tab'}
              onClick={() => setVista(id)}
            >
              <span className="tab-titulo">{nombre}</span>
              <small>{rol}</small>
            </button>
          ))}
        </nav>
      </header>

      <main>
        {vista === 'reservar' && <Reservar onChange={refrescar} />}
        {vista === 'agenda' && <Agenda tick={tick} onChange={refrescar} onIrACobrar={irACaja} />}
        {vista === 'caja' && <Caja tick={tick} onChange={refrescar} />}
        {vista === 'inventario' && <Inventario tick={tick} onChange={refrescar} />}
        {vista === 'panel' && <Panel tick={tick} onReset={reiniciar} onChange={refrescar} />}
      </main>

      <footer className="footer-bar">
        <span>BarberFlow v2.0 · Proyecto de Ingeniería de Software II · Base de Datos Integrada</span>
      </footer>
    </div>
  )
}
