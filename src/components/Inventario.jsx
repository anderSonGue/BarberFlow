import { useState, useEffect } from 'react'
import { api, money } from '../api/client.js'

export default function Inventario({ tick, onChange, onVerHistorial }) {
  const [insumos, setInsumos] = useState([])
  const [cantidadesEntrada, setCantidadesEntrada] = useState({})
  const [motivosEntrada, setMotivosEntrada] = useState({})
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  // Formulario nuevo producto
  const [mostrarNuevo, setMostrarNuevo] = useState(false)
  const [nuevo, setNuevo] = useState({
    codigo: '',
    nombre: '',
    categoria: 'Capilar',
    unidad: 'ml',
    existencias: 100,
    stockMinimo: 20,
    costoUnitario: 50,
  })

  useEffect(() => {
    cargarInsumos()
  }, [tick])

  const cargarInsumos = async () => {
    setCargando(true)
    setError('')
    try {
      const data = await api.getInsumos()
      setInsumos(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const registrarEntrada = async (id, nombre) => {
    setError('')
    setExito('')
    const cantidad = Number(cantidadesEntrada[id])
    if (!cantidad || cantidad <= 0) {
      setError(`Ingrese una cantidad válida mayor a cero para ${nombre}.`)
      return
    }

    const motivo = motivosEntrada[id]?.trim() || 'Abastecimiento de stock autorizado'

    try {
      await api.registrarEntradaInsumo(id, cantidad, motivo)
      setCantidadesEntrada((prev) => ({ ...prev, [id]: '' }))
      setMotivosEntrada((prev) => ({ ...prev, [id]: '' }))
      setExito(`Se registraron +${cantidad} unidades ingresadas a las existencias de "${nombre}".`)
      cargarInsumos()
      if (onChange) onChange()
    } catch (e) {
      setError(e.message)
    }
  }

  const crearProducto = async (e) => {
    e.preventDefault()
    setError('')
    setExito('')

    if (!nuevo.nombre.trim()) {
      setError('El nombre del insumo es obligatorio.')
      return
    }

    try {
      await api.crearInsumo(nuevo)
      setExito(`Insumo "${nuevo.nombre}" registrado exitosamente en el catálogo.`)
      setNuevo({
        codigo: '',
        nombre: '',
        categoria: 'Capilar',
        unidad: 'ml',
        existencias: 100,
        stockMinimo: 20,
        costoUnitario: 50,
      })
      setMostrarNuevo(false)
      cargarInsumos()
      if (onChange) onChange()
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
            Gestión de insumos y consumibles. Descuento automático atómico según la receta de cada servicio al cobrar.
          </p>
        </div>
        <div className="header-acciones">
          {onVerHistorial && (
            <button type="button" className="sec-btn-sm" onClick={onVerHistorial}>
              Ver Historial y Trazabilidad
            </button>
          )}
          <button
            type="button"
            className="pri-btn-sm"
            onClick={() => setMostrarNuevo(!mostrarNuevo)}
          >
            {mostrarNuevo ? 'Cerrar Formulario' : '+ Nuevo Insumo'}
          </button>
        </div>
      </div>

      {error && <div className="alerta-error">{error}</div>}
      {exito && <div className="alerta-exito">{exito}</div>}

      {/* ALERTAS DE STOCK BAJO */}
      {alertas.length > 0 && (
        <div className="alerta-stock-critico" role="alert">
          <strong>Atención: {alertas.length} insumos con existencias críticas</strong>
          <ul className="lista-alertas-stock">
            {alertas.map((a) => (
              <li key={a.id}>
                <strong>{a.nombre}:</strong> {a.existencias} {a.unidad} disponibles (Mínimo: {a.stockMinimo} {a.unidad})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* FORMULARIO DE NUEVO INSUMO */}
      {mostrarNuevo && (
        <form onSubmit={crearProducto} className="form-nuevo-insumo">
          <h3>Registrar Nuevo Insumo al Catálogo</h3>
          <div className="grid-campos-insumo">
            <label>
              Código Identificador:
              <input
                type="text"
                placeholder="Ej. INS-007"
                value={nuevo.codigo}
                onChange={(e) => setNuevo({ ...nuevo, codigo: e.target.value })}
              />
            </label>

            <label>
              Nombre del Insumo:
              <input
                type="text"
                required
                placeholder="Ej. Pomada Mate Fijación Media"
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              />
            </label>

            <label>
              Categoría:
              <select
                value={nuevo.categoria}
                onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })}
              >
                <option value="Capilar">Capilar</option>
                <option value="Barbería">Barbería</option>
                <option value="Higiene">Higiene</option>
                <option value="Post-corte">Post-corte</option>
                <option value="General">General</option>
              </select>
            </label>

            <label>
              Unidad de Medida:
              <select
                value={nuevo.unidad}
                onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })}
              >
                <option value="ml">Mililitros (ml)</option>
                <option value="g">Gramos (g)</option>
                <option value="unidad">Unidades (unidad)</option>
              </select>
            </label>

            <label>
              Existencias Iniciales:
              <input
                type="number"
                min="0"
                value={nuevo.existencias}
                onChange={(e) => setNuevo({ ...nuevo, existencias: e.target.value })}
              />
            </label>

            <label>
              Stock Mínimo de Alerta:
              <input
                type="number"
                min="1"
                value={nuevo.stockMinimo}
                onChange={(e) => setNuevo({ ...nuevo, stockMinimo: e.target.value })}
              />
            </label>

            <label>
              Costo Unitario ($ COP):
              <input
                type="number"
                min="0"
                value={nuevo.costoUnitario}
                onChange={(e) => setNuevo({ ...nuevo, costoUnitario: e.target.value })}
              />
            </label>
          </div>

          <div className="form-acciones">
            <button type="submit" className="pri-btn-sm">Guardar Insumo en Base de Datos</button>
            <button type="button" className="sec-btn-sm" onClick={() => setMostrarNuevo(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {/* TABLA PRINCIPAL DE INSUMOS */}
      {cargando ? (
        <p className="nota cargando">Consultando existencias de inventario...</p>
      ) : insumos.length === 0 ? (
        <p className="vacio-texto">No hay insumos registrados en el catálogo.</p>
      ) : (
        <div className="tabla-responsive">
          <table className="tabla-profesional">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre del Producto</th>
                <th>Categoría</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Costo Unitario</th>
                <th>Valor Total Stock</th>
                <th>Reabastecer / Entrada</th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((i) => {
                const esCritico = i.existencias <= i.stockMinimo
                const valorTotal = i.existencias * i.costoUnitario
                return (
                  <tr key={i.id} className={esCritico ? 'fila-alerta' : ''}>
                    <td>
                      <code>{i.codigo}</code>
                    </td>
                    <td>
                      <strong>{i.nombre}</strong>
                    </td>
                    <td>{i.categoria}</td>
                    <td>
                      <span className={esCritico ? 'stock-badge critico' : 'stock-badge normal'}>
                        {i.existencias} {i.unidad}
                      </span>
                    </td>
                    <td>
                      {i.stockMinimo} {i.unidad}
                    </td>
                    <td>{money(i.costoUnitario)}</td>
                    <td>{money(valorTotal)}</td>
                    <td>
                      <div className="reabastecer-box">
                        <input
                          type="number"
                          min="1"
                          placeholder="Cant."
                          className="input-cant-reabastecer"
                          value={cantidadesEntrada[i.id] || ''}
                          onChange={(e) =>
                            setCantidadesEntrada({ ...cantidadesEntrada, [i.id]: e.target.value })
                          }
                        />
                        <button
                          type="button"
                          className="pri-btn-sm"
                          onClick={() => registrarEntrada(i.id, i.nombre)}
                        >
                          + Ingresar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
