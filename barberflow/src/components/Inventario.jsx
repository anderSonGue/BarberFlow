import { useState } from 'react'
import { api, money } from '../api/mockApi.js'
import { useData } from '../hooks.js'

export default function Inventario({ tick, onChange }) {
  const [insumos] = useData(api.getInsumos, [tick], [])
  const [cant, setCant] = useState({})
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  // Formulario de nuevo insumo
  const [mostrarNuevo, setMostrarNuevo] = useState(false)
  const [nuevo, setNuevo] = useState({
    nombre: '',
    unidad: 'ml',
    existencias: 100,
    stockMinimo: 20,
    costoUnitario: 50,
  })

  const entrada = async (id, nombre) => {
    setError('')
    setExito('')
    const cantidad = Number(cant[id])
    if (!cantidad || cantidad <= 0) {
      setError(`Ingresa una cantidad válida mayor a 0 para ${nombre}.`)
      return
    }
    try {
      await api.entradaInsumo(id, cantidad)
      setCant((c) => ({ ...c, [id]: '' }))
      setExito(`Se agregaron ${cantidad} unidades a las existencias de ${nombre}.`)
      onChange()
    } catch (e) {
      setError(e.message)
    }
  }

  const crearInsumo = async (e) => {
    e.preventDefault()
    setError('')
    setExito('')
    try {
      await api.agregarInsumo(nuevo)
      setExito(`Insumo "${nuevo.nombre}" registrado exitosamente.`)
      setNuevo({
        nombre: '',
        unidad: 'ml',
        existencias: 100,
        stockMinimo: 20,
        costoUnitario: 50,
      })
      setMostrarNuevo(false)
      onChange()
    } catch (err) {
      setError(err.message)
    }
  }

  const alertas = insumos.filter((i) => i.existencias <= i.stockMinimo)

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Control y Registro de Inventario</h2>
          <p className="nota">
            Gestión de insumos y consumibles. Se descuentan automáticamente según la receta de cada servicio al cobrar.
          </p>
        </div>
        <button
          type="button"
          className="pri-btn-sm"
          onClick={() => setMostrarNuevo(!mostrarNuevo)}
        >
          {mostrarNuevo ? '✕ Cerrar Formulario' : '+ Nuevo Insumo'}
        </button>
      </div>

      {alertas.length > 0 && (
        <div className="alerta-stock-critico">
          <strong>⚠️ Atención: {alertas.length} {alertas.length === 1 ? 'insumo tiene' : 'insumos tienen'} stock bajo o agotado:</strong>
          <span> {alertas.map((a) => `${a.nombre} (${a.existencias} ${a.unidad})`).join(', ')}. Registra una entrada de reabastecimiento.</span>
        </div>
      )}

      {error && <p className="error banner" role="alert">{error}</p>}
      {exito && <p className="ok banner" role="status">{exito}</p>}

      {/* FORMULARIO DE NUEVO INSUMO */}
      {mostrarNuevo && (
        <form className="formulario-nuevo" onSubmit={crearInsumo}>
          <h3>Registrar Nuevo Insumo al Inventario</h3>
          <div className="grid-form">
            <label>
              Nombre del insumo / producto *
              <input
                required
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                placeholder="Ej. Cera fijadora efecto mate"
              />
            </label>

            <label>
              Unidad de medida *
              <select
                value={nuevo.unidad}
                onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })}
              >
                <option value="ml">Mililitros (ml)</option>
                <option value="g">Gramos (g)</option>
                <option value="unidad">Unidad / Pieza</option>
                <option value="frasco">Frasco</option>
                <option value="caja">Caja</option>
              </select>
            </label>

            <label>
              Stock Inicial
              <input
                type="number"
                min="0"
                value={nuevo.existencias}
                onChange={(e) => setNuevo({ ...nuevo, existencias: e.target.value })}
              />
            </label>

            <label>
              Stock Mínimo de Alerta
              <input
                type="number"
                min="1"
                value={nuevo.stockMinimo}
                onChange={(e) => setNuevo({ ...nuevo, stockMinimo: e.target.value })}
              />
            </label>

            <label>
              Costo Unitario ($)
              <input
                type="number"
                min="0"
                value={nuevo.costoUnitario}
                onChange={(e) => setNuevo({ ...nuevo, costoUnitario: e.target.value })}
              />
            </label>
          </div>

          <div className="acciones-form">
            <button type="submit" className="pri">Guardar Insumo</button>
            <button type="button" className="sec" onClick={() => setMostrarNuevo(false)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="scroll">
        <table className="tabla-inventario">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
              <th>Costo Unitario</th>
              <th>Estado</th>
              <th>Registrar Entrada / Reabastecer</th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((i) => {
              const bajo = i.existencias <= i.stockMinimo
              const agotado = i.existencias === 0
              return (
                <tr key={i.id} className={agotado ? 'fila-agotada' : bajo ? 'fila-baja' : ''}>
                  <td>
                    <strong>{i.nombre}</strong>
                  </td>
                  <td>
                    <span className="stock-num">{i.existencias}</span> <small>{i.unidad}</small>
                  </td>
                  <td>
                    {i.stockMinimo} <small>{i.unidad}</small>
                  </td>
                  <td>{money(i.costoUnitario)}</td>
                  <td>
                    <span className={agotado ? 'estado CANCELADA' : bajo ? 'estado EN_ATENCION' : 'estado FINALIZADA'}>
                      {agotado ? 'Agotado' : bajo ? 'Stock Bajo' : 'Normal'}
                    </span>
                  </td>
                  <td>
                    <div className="entrada-grupo">
                      <input
                        type="number"
                        min="1"
                        placeholder="+ Cantidad"
                        value={cant[i.id] ?? ''}
                        onChange={(e) => setCant((c) => ({ ...c, [i.id]: e.target.value }))}
                        aria-label={`Cantidad a agregar a ${i.nombre}`}
                      />
                      <button
                        type="button"
                        className="pri-btn-sm"
                        onClick={() => entrada(i.id, i.nombre)}
                      >
                        + Entrada
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
