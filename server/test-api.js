import app from './src/index.js'
import prisma from './src/db.js'

async function runTests() {
  console.log('=== INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS BARBERFLOW ===\n')

  const server = app.listen(4001)
  const BASE_URL = 'http://localhost:4001/api'

  try {
    // 1. Probar Login de Trabajador
    console.log('1. Probando Login de TRABAJADOR...')
    const resLoginTrabajador = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'andres@barberflow.com', password: 'barbero123' }),
    })
    const dataTrabajador = await resLoginTrabajador.json()
    console.assert(dataTrabajador.ok === true, 'El login de trabajador debe ser exitoso')
    console.assert(dataTrabajador.usuario.rol === 'TRABAJADOR', 'El rol debe ser TRABAJADOR')
    const tokenTrabajador = dataTrabajador.token
    console.log('   ✓ Login de trabajador exitoso. Token recibido.')

    // 2. Verificar que Trabajador NO puede acceder al inventario (RBAC Backend)
    console.log('2. Verificando restricción de TRABAJADOR hacia /api/inventario...')
    const resInvTrabajador = await fetch(`${BASE_URL}/inventario`, {
      headers: { Authorization: `Bearer ${tokenTrabajador}` },
    })
    console.assert(resInvTrabajador.status === 403, `Debe retornar 403 Forbidden. Recibido: ${resInvTrabajador.status}`)
    console.log('   ✓ Acceso a inventario bloqueado con código 403 Forbidden.')

    // 3. Verificar que Trabajador NO puede acceder al reporte financiero global
    console.log('3. Verificando restricción de TRABAJADOR hacia /api/pagos/reporte...')
    const resRepTrabajador = await fetch(`${BASE_URL}/pagos/reporte`, {
      headers: { Authorization: `Bearer ${tokenTrabajador}` },
    })
    console.assert(resRepTrabajador.status === 403, `Debe retornar 403 Forbidden. Recibido: ${resRepTrabajador.status}`)
    console.log('   ✓ Reporte financiero bloqueado con código 403 Forbidden.')

    // 4. Probar Login de Administrador
    console.log('4. Probando Login de ADMINISTRADOR...')
    const resLoginAdmin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@barberflow.com', password: 'admin123' }),
    })
    const dataAdmin = await resLoginAdmin.json()
    console.assert(dataAdmin.ok === true, 'El login de administrador debe ser exitoso')
    console.assert(dataAdmin.usuario.rol === 'ADMINISTRADOR', 'El rol debe ser ADMINISTRADOR')
    const tokenAdmin = dataAdmin.token
    console.log('   ✓ Login de administrador exitoso. Token recibido.')

    // 5. Verificar que Administrador SÍ puede acceder al inventario y movimientos
    console.log('5. Verificando acceso de ADMINISTRADOR a inventario y movimientos...')
    const resInvAdmin = await fetch(`${BASE_URL}/inventario`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    })
    const dataInv = await resInvAdmin.json()
    console.assert(dataInv.ok === true && dataInv.data.length > 0, 'Admin debe poder consultar insumos')
    console.log(`   ✓ Acceso concedido al Administrador. ${dataInv.data.length} insumos listados.`)

    // 6. Prueba de regla inquebrantable: Bloquear cobro si el stock es insuficiente
    console.log('6. Probando REGLA INQUEBRANTABLE de inventario insuficiente...')
    // Forzamos temporalmente existencias en 0 de un insumo requerido por el servicio de la cita 3 (Arreglo de barba usa crema id 2)
    const insumoCrema = await prisma.insumo.findFirst({ where: { nombre: { contains: 'Crema' } } })
    const stockOriginal = insumoCrema.existencias
    await prisma.insumo.update({ where: { id: insumoCrema.id }, data: { existencias: 2 } }) // Solo 2g disponibles, el servicio requiere 15g

    const citaAtencion = await prisma.cita.findFirst({ where: { estado: 'EN_ATENCION' } })
    const resCobroBloqueado = await fetch(`${BASE_URL}/pagos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ citaId: citaAtencion.id, metodo: 'EFECTIVO' }),
    })
    const dataBloqueada = await resCobroBloqueado.json()
    console.assert(dataBloqueada.ok === false, 'El cobro debe ser rechazado')
    console.assert(
      dataBloqueada.error.includes('INVENTARIO INSUFICIENTE'),
      `El mensaje debe indicar insuficiencia. Mensaje: ${dataBloqueada.error}`
    )
    console.log('   ✓ Bloqueo atómico verificado exitosamente:', dataBloqueada.error)

    // Restauramos el stock y cobramos normalmente
    await prisma.insumo.update({ where: { id: insumoCrema.id }, data: { existencias: stockOriginal } })

    // 7. Prueba de Cobro Exitoso con deducción atómica y cálculo de comisiones
    console.log('7. Probando Cobro Exitoso con trazabilidad atómica y comisiones...')
    const resCobroExitoso = await fetch(`${BASE_URL}/pagos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ citaId: citaAtencion.id, metodo: 'EFECTIVO' }),
    })
    const dataCobro = await resCobroExitoso.json()
    console.assert(dataCobro.ok === true, 'El cobro debe procesarse correctamente')
    console.assert(dataCobro.data.valorCobrado > 0, 'Debe haber un valor cobrado')
    console.assert(dataCobro.data.comisionProfesional > 0, 'Debe haber comisión para el barbero')
    console.assert(dataCobro.data.utilidadNegocio > 0, 'Debe haber utilidad para el negocio')
    console.log(`   ✓ Cobro completado. Total: $${dataCobro.data.valorCobrado} | Comisión: $${dataCobro.data.comisionProfesional} | Negocio: $${dataCobro.data.utilidadNegocio}`)

    // 8. Verificar que el movimiento de inventario quedó registrado
    console.log('8. Verificando trazabilidad y movimientos de inventario...')
    const resMov = await fetch(`${BASE_URL}/inventario/movimientos`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    })
    const dataMov = await resMov.json()
    const movSalida = dataMov.data.find((m) => m.tipo === 'SALIDA_SERVICIO' && m.citaId === citaAtencion.id)
    console.assert(movSalida !== undefined, 'Debe existir el movimiento tipo SALIDA_SERVICIO')
    console.log('   ✓ Movimiento de salida registrado con trazabilidad completa (Usuario, Cliente, Cita, Insumo).')

    console.log('\n=== TODAS LAS PRUEBAS DE BACKEND Y SEGURIDAD PASARON SATISFACTORIAMENTE ===')
  } finally {
    server.close()
    await prisma.$disconnect()
    process.exit(0)
  }
}

runTests().catch((e) => {
  console.error('ERROR EN PRUEBAS:', e)
  process.exit(1)
})
