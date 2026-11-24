import { useState, useEffect } from 'react'
import { api, money } from '../api/client.js'

export default function Compras({ tick, onChange }) {
  const [compras, setCompras] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [insumos, setInsumos] = useState([])
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  // Formulario de nueva compra
  const [mostrarNueva, setMostrarNueva] = useState(false)
  const [proveedorId, setProveedorId] = useState('')
  const [numeroFactura, setNumeroFactura] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [items, setItems] = useState([
    { tipoItem: 'INSUMO', itemId: '', cantidad: 1, costoUnitario: 0 },
  ])

  // Formulario nuevo proveedor
  const [mostrarNuevoProveedor, setMostrarNuevoProveedor] = useState(false)
  const [nuevoProv, setNuevoProv] = useState({ nombre: '', nit: '', telefono: '', email: '', direccion: '' })

  useEffect(() => {
    cargarDatos()
  }, [tick])

  const cargarDatos = async () => {
    setCargando(true)
    setError('')
    try {
      const [cData, pData, iData, prodData] = await Promise.all([
        api.getCompras(),
        api.getProveedores(),
        api.getInsumos(),
        api.getProductos(),
      ])
      setCompras(cData)
      setProveedores(pData)
      setInsumos(iData)
      setProductos(prodData)
      if (pData.length > 0 && !proveedorId) setProveedorId(String(pData[0].id))
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const agregarFilaItem = () => {
    setItems([...items, { tipoItem: 'INSUMO', itemId: '', cantidad: 1, costoUnitario: 0 }])
  }

  const eliminarFilaItem = (idx) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx))
    }
  }

  const actualizarItem = (idx, campo, valor) => {
    const copia = [...items]
    copia[idx][campo] = valor

    if (campo === 'itemId') {
      const idNum = Number(valor)
      if (copia[idx].tipoItem === 'INSUMO') {
        const ins = insumos.find((x) => x.id === idNum)
        if (ins) copia[idx].costoUnitario = ins.costoUnitario
      } else {
        const pr = productos.find((x) => x.id === idNum)
        if (pr) copia[idx].costoUnitario = pr.costoUnitario
      }
    }
    setItems(copia)
  }

  const totalCalculado = items.reduce(
    (sum, it) => sum + (Number(it.cantidad) || 0) * (Number(it.costoUnitario) || 0),
    0
  )

  const registrarCompra = async (e) => {
    e.preventDefault()
    setError('')
    setExito('')

    if (!numeroFactura.trim()) {
      setError('El número de factura es obligatorio.')
      return
    }

    const itemsValidos = items.filter((it) => it.itemId && Number(it.cantidad) > 0)
    if (itemsValidos.length === 0) {
      setError('Debe seleccionar al menos un insumo o producto con cantidad mayor a cero.')
      return
    }

    try {
      await api.registrarCompra({
        proveedorId: Number(proveedorId),
        numeroFactura: numeroFactura.trim(),
        observaciones: observaciones.trim(),
        items: itemsValidos.map((it) => ({
          tipoItem: it.tipoItem,
          itemId: Number(it.itemId),
          cantidad: Number(it.cantidad),
          costoUnitario: Number(it.costoUnitario),
        })),
      })
      setExito(`Compra con factura #${numeroFactura} registrada. Stock de insumos y productos actualizado.`)
      setNumeroFactura('')
      setObservaciones('')
      setItems([{ tipoItem: 'INSUMO', itemId: '', cantidad: 1, costoUnitario: 0 }])
      setMostrarNueva(false)
      cargarDatos()
      if (onChange) onChange()
    } catch (err) {
      setError(err.message)
    }
  }

  const crearProveedor = async (e) => {
    e.preventDefault()
    setError('')
    if (!nuevoProv.nombre.trim()) {
      setError('El nombre del proveedor es obligatorio.')
      return
    }
    try {
      const p = await api.crearProveedor(nuevoProv)
      setProveedores([...proveedores, p])
      setProveedorId(String(p.id))
      setNuevoProv({ nombre: '', nit: '', telefono: '', email: '', direccion: '' })
      setMostrarNuevoProveedor(false)
      setExito(`Proveedor "${p.nombre}" creado exitosamente.`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Módulo de Compras y Abastecimiento</h2>
          <p className="nota">
            Registro formal de facturas de proveedores. Incrementa automáticamente las existencias en inventario.
          </p>
        </div>
        <div className="header-acciones">
          <button
            type="button"
            className="sec-btn-sm"
            onClick={() => setMostrarNuevoProveedor(!mostrarNuevoProveedor)}
          >
            {mostrarNuevoProveedor ? 'Cerrar Proveedor' : '+ Nuevo Proveedor'}
          </button>
          <button
            type="button"
            className="pri-btn-sm"
            onClick={() => setMostrarNueva(!mostrarNueva)}
          >
            {mostrarNueva ? 'Cerrar Compra' : '+ Registrar Compra'}
          </button>
        </div>
      </div>

      {error && <div className="alerta-error">{error}</div>}
      {exito && <div className="alerta-exito">{exito}</div>}

      {/* FORMULARIO DE NUEVO PROVEEDOR */}
      {mostrarNuevoProveedor && (
        <form onSubmit={crearProveedor} className="form-nuevo-insumo">
          <h3>Registrar Nuevo Proveedor</h3>
          <div className="grid-campos-insumo">
            <label>
              Nombre o Razón Social:
              <input
                type="text"
                required
                value={nuevoProv.nombre}
                onChange={(e) => setNuevoProv({ ...nuevoProv, nombre: e.target.value })}
              />
            </label>
            <label>
              NIT / Identificación:
              <input
                type="text"
                value={nuevoProv.nit}
                onChange={(e) => setNuevoProv({ ...nuevoProv, nit: e.target.value })}
              />
            </label>
            <label>
              Teléfono:
              <input
                type="text"
                value={nuevoProv.telefono}
                onChange={(e) => setNuevoProv({ ...nuevoProv, telefono: e.target.value })}
              />
            </label>
            <label>
              Correo Electrónico:
              <input
                type="email"
                value={nuevoProv.email}
                onChange={(e) => setNuevoProv({ ...nuevoProv, email: e.target.value })}
              />
            </label>
            <label>
              Dirección:
              <input
                type="text"
                value={nuevoProv.direccion}
                onChange={(e) => setNuevoProv({ ...nuevoProv, direccion: e.target.value })}
              />
            </label>
          </div>
          <div className="form-acciones">
            <button type="submit" className="pri-btn-sm">Guardar Proveedor</button>
            <button type="button" className="sec-btn-sm" onClick={() => setMostrarNuevoProveedor(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {/* FORMULARIO DE NUEVA COMPRA */}
      {mostrarNueva && (
        <form onSubmit={registrarCompra} className="form-nuevo-insumo">
          <h3>Ingresar Factura de Compra</h3>
          <div className="grid-campos-insumo">
            <label>
              Proveedor:
              <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.nit ? `(${p.nit})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Número de Factura:
              <input
                type="text"
                required
                placeholder="Ej. FAC-2026-0089"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
              />
            </label>

            <label>
              Observaciones:
              <input
                type="text"
                placeholder="Detalle o nota de entrega"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </label>
          </div>

          <h4>Artículos Comprados</h4>
          <div className="tabla-responsive">
            <table className="tabla-profesional">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Artículo</th>
                  <th>Cantidad</th>
                  <th>Costo Unitario</th>
                  <th>Subtotal</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        value={it.tipoItem}
                        onChange={(e) => actualizarItem(idx, 'tipoItem', e.target.value)}
                      >
                        <option value="INSUMO">Insumo (Consumo)</option>
                        <option value="PRODUCTO">Producto (Venta)</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={it.itemId}
                        onChange={(e) => actualizarItem(idx, 'itemId', e.target.value)}
                      >
                        <option value="">-- Seleccionar --</option>
                        {it.tipoItem === 'INSUMO'
                          ? insumos.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.codigo} - {i.nombre} ({i.unidad})
                              </option>
                            ))
                          : productos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.codigo} - {p.nombre}
                              </option>
                            ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        style={{ width: '80px' }}
                        value={it.cantidad}
                        onChange={(e) => actualizarItem(idx, 'cantidad', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        style={{ width: '100px' }}
                        value={it.costoUnitario}
                        onChange={(e) => actualizarItem(idx, 'costoUnitario', e.target.value)}
                      />
                    </td>
                    <td>
                      <strong>
                        {money((Number(it.cantidad) || 0) * (Number(it.costoUnitario) || 0))}
                      </strong>
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
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ margin: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" className="sec-btn-sm" onClick={agregarFilaItem}>
              + Agregar otro artículo
            </button>
            <div style={{ fontSize: '1.1rem' }}>
              Total Compra: <strong>{money(totalCalculado)}</strong>
            </div>
          </div>

          <div className="form-acciones">
            <button type="submit" className="pri-btn-sm">Confirmar y Asentar Compra en MySQL</button>
            <button type="button" className="sec-btn-sm" onClick={() => setMostrarNueva(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {/* LISTADO DE COMPRAS */}
      {cargando ? (
        <p className="nota cargando">Consultando historial de compras...</p>
      ) : compras.length === 0 ? (
        <p className="vacio-texto">No se registran facturas de compras en el sistema.</p>
      ) : (
        <div className="tabla-responsive">
          <table className="tabla-profesional">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Factura #</th>
                <th>Proveedor</th>
                <th>Total Facturado</th>
                <th>Registrado Por</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c.id}>
                  <td>{new Date(c.fecha).toLocaleString('es-CO')}</td>
                  <td>
                    <strong>{c.numeroFactura}</strong>
                  </td>
                  <td>{c.proveedor?.nombre}</td>
                  <td>
                    <strong>{money(c.total)}</strong>
                  </td>
                  <td>{c.usuario?.nombre}</td>
                  <td>{c.observaciones || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
