import { useState, useEffect } from 'react'
import { api, money } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Ventas({ tick, onChange }) {
  const { esAdmin, usuario } = useAuth()
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [profesionales, setProfesionales] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  // Formulario nueva venta
  const [mostrarNueva, setMostrarNueva] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [profesionalId, setProfesionalId] = useState(
    usuario?.profesionalId ? String(usuario.profesionalId) : ''
  )
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [descuento, setDescuento] = useState(0)
  const [items, setItems] = useState([{ productoId: '', cantidad: 1 }])

  useEffect(() => {
    cargarDatos()
  }, [tick])

  const cargarDatos = async () => {
    setCargando(true)
    setError('')
    try {
      const [vData, pData, cData, profData] = await Promise.all([
        api.getVentas(),
        api.getProductos(),
        api.getClientes(),
        api.getProfesionales(),
      ])
      setVentas(vData)
      setProductos(pData)
      setClientes(cData)
      setProfesionales(profData)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const agregarFilaItem = () => {
    setItems([...items, { productoId: '', cantidad: 1 }])
  }

  const eliminarFilaItem = (idx) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx))
    }
  }

  const actualizarItem = (idx, campo, valor) => {
    const copia = [...items]
    copia[idx][campo] = valor
    setItems(copia)
  }

  const subtotalCalculado = items.reduce((sum, it) => {
    const p = productos.find((x) => x.id === Number(it.productoId))
    const precio = p ? p.precioVenta : 0
    return sum + (Number(it.cantidad) || 0) * precio
  }, 0)

  const totalCalculado = Math.max(0, subtotalCalculado - (Number(descuento) || 0))

  const registrarVenta = async (e) => {
    e.preventDefault()
    setError('')
    setExito('')

    const itemsValidos = items.filter((it) => it.productoId && Number(it.cantidad) > 0)
    if (itemsValidos.length === 0) {
      setError('Debe seleccionar al menos un producto a vender.')
      return
    }

    try {
      await api.registrarVenta({
        clienteId: clienteId ? Number(clienteId) : null,
        profesionalId: profesionalId ? Number(profesionalId) : null,
        metodoPago,
        descuento: Number(descuento) || 0,
        items: itemsValidos.map((it) => ({
          productoId: Number(it.productoId),
          cantidad: Number(it.cantidad),
        })),
      })
      setExito('Venta registrada con éxito. Existencias de producto actualizadas.')
      setItems([{ productoId: '', cantidad: 1 }])
      setDescuento(0)
      setMostrarNueva(false)
      cargarDatos()
      if (onChange) onChange()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Venta de Productos Minoristas</h2>
          <p className="nota">
            Comercialización de ceras, pomadas, tónicos y productos de barbería para clientes.
          </p>
        </div>
        <button
          type="button"
          className="pri-btn-sm"
          onClick={() => setMostrarNueva(!mostrarNueva)}
        >
          {mostrarNueva ? 'Cerrar Formulario' : '+ Registrar Venta'}
        </button>
      </div>

      {error && <div className="alerta-error">{error}</div>}
      {exito && <div className="alerta-exito">{exito}</div>}

      {/* FORMULARIO DE NUEVA VENTA */}
      {mostrarNueva && (
        <form onSubmit={registrarVenta} className="form-nuevo-insumo">
          <h3>Registrar Venta Directa</h3>
          <div className="grid-campos-insumo">
            <label>
              Cliente (Opcional):
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Cliente Ocasional / Mostrador</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.telefono ? `(${c.telefono})` : ''}
                  </option>
                ))}
              </select>
            </label>

            {esAdmin ? (
              <label>
                Barbero Vendedor:
                <select value={profesionalId} onChange={(e) => setProfesionalId(e.target.value)}>
                  <option value="">Venta General Mostrador</option>
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                Barbero Vendedor:
                <input
                  type="text"
                  readOnly
                  value={usuario?.nombre || 'Mi Perfil'}
                  className="input-readonly"
                />
              </label>
            )}

            <label>
              Método de Pago:
              <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta Débito/Crédito</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="NEQUI / DAVIPLATA">Nequi / Daviplata</option>
              </select>
            </label>
          </div>

          <h4>Productos a Vender</h4>
          <div className="tabla-responsive">
            <table className="tabla-profesional">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock Disponible</th>
                  <th>Precio Venta</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const pSel = productos.find((x) => x.id === Number(it.productoId))
                  const precio = pSel ? pSel.precioVenta : 0
                  const sub = (Number(it.cantidad) || 0) * precio

                  return (
                    <tr key={idx}>
                      <td>
                        <select
                          value={it.productoId}
                          onChange={(e) => actualizarItem(idx, 'productoId', e.target.value)}
                        >
                          <option value="">-- Seleccionar Producto --</option>
                          {productos.map((pr) => (
                            <option key={pr.id} value={pr.id}>
                              {pr.codigo} - {pr.nombre} ({money(pr.precioVenta)})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {pSel ? (
                          <span className={pSel.existencias <= pSel.stockMinimo ? 'stock-badge critico' : 'stock-badge normal'}>
                            {pSel.existencias} unids
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{money(precio)}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          style={{ width: '80px' }}
                          value={it.cantidad}
                          onChange={(e) => actualizarItem(idx, 'cantidad', e.target.value)}
                        />
                      </td>
                      <td>
                        <strong>{money(sub)}</strong>
                      </td>
                      <td>
                        {items.length > 1 && (
                          <button
                            type="button"
                            className="btn-accion btn-cancelar"
                            onClick={() => eliminarFilaItem(idx)}
                          >
                            Quitar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ margin: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" className="sec-btn-sm" onClick={agregarFilaItem}>
              + Agregar otro producto
            </button>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <label>
                Descuento ($):
                <input
                  type="number"
                  min="0"
                  style={{ width: '100px', marginLeft: '8px' }}
                  value={descuento}
                  onChange={(e) => setDescuento(e.target.value)}
                />
              </label>
              <div style={{ fontSize: '1.15rem' }}>
                Total a Cobrar: <strong>{money(totalCalculado)}</strong>
              </div>
            </div>
          </div>

          <div className="form-acciones">
            <button type="submit" className="pri-btn-sm">Confirmar Venta y Descontar Stock</button>
            <button type="button" className="sec-btn-sm" onClick={() => setMostrarNueva(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {/* LISTADO DE VENTAS */}
      {cargando ? (
        <p className="nota cargando">Consultando ventas registradas...</p>
      ) : ventas.length === 0 ? (
        <p className="vacio-texto">No se registran ventas de productos en el sistema.</p>
      ) : (
        <div className="tabla-responsive">
          <table className="tabla-profesional">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Comprobante</th>
                <th>Cliente</th>
                {esAdmin && <th>Vendedor</th>}
                <th>Método</th>
                <th>Subtotal</th>
                <th>Descuento</th>
                <th>Total Cobrado</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id}>
                  <td>{new Date(v.fecha).toLocaleString('es-CO')}</td>
                  <td>
                    <strong>{v.numeroComprobante}</strong>
                  </td>
                  <td>{v.cliente?.nombre || 'Cliente Ocasional'}</td>
                  {esAdmin && <td>{v.profesional?.nombre || v.usuario?.nombre}</td>}
                  <td>
                    <span className="metodo-tag">{v.metodoPago}</span>
                  </td>
                  <td>{money(v.subtotal)}</td>
                  <td>{v.descuento > 0 ? `-${money(v.descuento)}` : '$0'}</td>
                  <td>
                    <strong>{money(v.total)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
