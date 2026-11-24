import bcrypt from 'bcryptjs'
import prisma from '../db.js'

async function seed() {
  console.log('[Seed] Iniciando población de datos iniciales en BarberFlow...')

  // Limpiar base de datos si fuera necesario (en orden para respetar claves foráneas)
  await prisma.consumoServicio.deleteMany()
  await prisma.movimientoInventario.deleteMany()
  await prisma.pago.deleteMany()
  await prisma.citaServicio.deleteMany()
  await prisma.cita.deleteMany()
  await prisma.servicioInsumo.deleteMany()
  await prisma.servicio.deleteMany()
  await prisma.insumo.deleteMany()
  await prisma.user.deleteMany()
  await prisma.profesional.deleteMany()
  await prisma.cliente.deleteMany()

  // 1. Crear Profesionales
  console.log('-> Creando profesionales...')
  const profAndres = await prisma.profesional.create({
    data: {
      nombre: 'Andrés Rojas',
      especialidad: 'Cortes clásicos y fade',
      calificacion: 4.8,
      porcentaje: 50.0,
      telefono: '3104567890',
    },
  })

  const profCamilo = await prisma.profesional.create({
    data: {
      nombre: 'Camilo Pérez',
      especialidad: 'Barba y afeitado tradicional',
      calificacion: 4.9,
      porcentaje: 50.0,
      telefono: '3119876543',
    },
  })

  const profSara = await prisma.profesional.create({
    data: {
      nombre: 'Sara Molina',
      especialidad: 'Diseños y estilos modernos',
      calificacion: 4.7,
      porcentaje: 60.0,
      telefono: '3201122334',
    },
  })

  // 2. Crear Usuarios con Contraseñas Hasheadas
  console.log('-> Creando usuarios administradores y trabajadores...')
  const salt = await bcrypt.genSalt(10)
  const passAdmin = await bcrypt.hash('admin123', salt)
  const passBarbero = await bcrypt.hash('barbero123', salt)

  const userAdmin = await prisma.user.create({
    data: {
      nombre: 'Administrador Principal',
      email: 'admin@barberflow.com',
      passwordHash: passAdmin,
      rol: 'ADMINISTRADOR',
    },
  })

  await prisma.user.create({
    data: {
      nombre: 'Andrés Rojas',
      email: 'andres@barberflow.com',
      passwordHash: passBarbero,
      rol: 'TRABAJADOR',
      profesionalId: profAndres.id,
    },
  })

  await prisma.user.create({
    data: {
      nombre: 'Camilo Pérez',
      email: 'camilo@barberflow.com',
      passwordHash: passBarbero,
      rol: 'TRABAJADOR',
      profesionalId: profCamilo.id,
    },
  })

  await prisma.user.create({
    data: {
      nombre: 'Sara Molina',
      email: 'sara@barberflow.com',
      passwordHash: passBarbero,
      rol: 'TRABAJADOR',
      profesionalId: profSara.id,
    },
  })

  // 3. Crear Insumos / Productos de Inventario
  console.log('-> Creando catálogo de insumos...')
  const gel = await prisma.insumo.create({
    data: {
      codigo: 'INS-001',
      nombre: 'Gel fijador premium',
      categoria: 'Capilar',
      unidad: 'ml',
      existencias: 500,
      stockMinimo: 100,
      costoUnitario: 40,
    },
  })

  const crema = await prisma.insumo.create({
    data: {
      codigo: 'INS-002',
      nombre: 'Crema de afeitar hidratante',
      categoria: 'Barbería',
      unidad: 'g',
      existencias: 350,
      stockMinimo: 80,
      costoUnitario: 50,
    },
  })

  const talco = await prisma.insumo.create({
    data: {
      codigo: 'INS-003',
      nombre: 'Talco mentolado',
      categoria: 'General',
      unidad: 'g',
      existencias: 200,
      stockMinimo: 50,
      costoUnitario: 20,
    },
  })

  const cuchillas = await prisma.insumo.create({
    data: {
      codigo: 'INS-004',
      nombre: 'Cuchillas desechables',
      categoria: 'Higiene',
      unidad: 'unidad',
      existencias: 40,
      stockMinimo: 15,
      costoUnitario: 800,
    },
  })

  const aceite = await prisma.insumo.create({
    data: {
      codigo: 'INS-005',
      nombre: 'Aceite para barba',
      categoria: 'Barbería',
      unidad: 'ml',
      existencias: 120,
      stockMinimo: 30,
      costoUnitario: 120,
    },
  })

  const locion = await prisma.insumo.create({
    data: {
      codigo: 'INS-006',
      nombre: 'Loción after shave',
      categoria: 'Post-corte',
      unidad: 'ml',
      existencias: 250,
      stockMinimo: 60,
      costoUnitario: 45,
    },
  })

  // Registrar movimientos iniciales de inventario
  const insumos = [gel, crema, talco, cuchillas, aceite, locion]
  for (const ins of insumos) {
    await prisma.movimientoInventario.create({
      data: {
        insumoId: ins.id,
        tipo: 'ENTRADA',
        cantidadAnterior: 0,
        cantidadMovimiento: ins.existencias,
        cantidadResultante: ins.existencias,
        motivo: 'Inventario inicial del establecimiento',
        usuarioId: userAdmin.id,
      },
    })
  }

  // 4. Crear Servicios con sus Recetas (BOM)
  console.log('-> Creando servicios con recetas de insumos...')
  const serv1 = await prisma.servicio.create({
    data: {
      nombre: 'Corte clásico',
      categoria: 'Cabello',
      duracionMin: 30,
      precio: 25000,
      receta: {
        create: [
          { insumoId: gel.id, cantidadRequerida: 10 },
          { insumoId: cuchillas.id, cantidadRequerida: 1 },
        ],
      },
    },
  })

  const serv2 = await prisma.servicio.create({
    data: {
      nombre: 'Corte y barba',
      categoria: 'Combo',
      duracionMin: 60,
      precio: 40000,
      receta: {
        create: [
          { insumoId: gel.id, cantidadRequerida: 10 },
          { insumoId: crema.id, cantidadRequerida: 15 },
          { insumoId: cuchillas.id, cantidadRequerida: 1 },
          { insumoId: locion.id, cantidadRequerida: 5 },
        ],
      },
    },
  })

  const serv3 = await prisma.servicio.create({
    data: {
      nombre: 'Arreglo de barba',
      categoria: 'Barba',
      duracionMin: 30,
      precio: 18000,
      receta: {
        create: [
          { insumoId: crema.id, cantidadRequerida: 15 },
          { insumoId: talco.id, cantidadRequerida: 5 },
          { insumoId: aceite.id, cantidadRequerida: 2 },
        ],
      },
    },
  })

  const serv4 = await prisma.servicio.create({
    data: {
      nombre: 'Afeitado toalla caliente',
      categoria: 'Barba',
      duracionMin: 30,
      precio: 30000,
      receta: {
        create: [
          { insumoId: crema.id, cantidadRequerida: 25 },
          { insumoId: talco.id, cantidadRequerida: 5 },
          { insumoId: cuchillas.id, cantidadRequerida: 1 },
          { insumoId: locion.id, cantidadRequerida: 10 },
        ],
      },
    },
  })

  const serv5 = await prisma.servicio.create({
    data: {
      nombre: 'Perfilado de cejas y corte',
      categoria: 'Combo',
      duracionMin: 45,
      precio: 32000,
      receta: {
        create: [
          { insumoId: gel.id, cantidadRequerida: 5 },
          { insumoId: cuchillas.id, cantidadRequerida: 1 },
        ],
      },
    },
  })

  // 5. Crear Clientes
  console.log('-> Creando clientes y puntos de fidelización...')
  const cliJuan = await prisma.cliente.create({
    data: {
      nombre: 'Juan Díaz',
      telefono: '3001234567',
      email: 'juan.diaz@email.com',
      visitas: 5,
      notas: 'Prefiere degradado bajo',
      puntos: 120,
    },
  })

  const cliLuis = await prisma.cliente.create({
    data: {
      nombre: 'Luis Gómez',
      telefono: '3109876543',
      email: 'luis.gomez@email.com',
      visitas: 3,
      notas: 'Corte a tijera arriba',
      puntos: 80,
    },
  })

  const cliMateo = await prisma.cliente.create({
    data: {
      nombre: 'Mateo Ruiz',
      telefono: '3205556677',
      email: 'mateo.ruiz@email.com',
      visitas: 2,
      notas: 'Barba cuadrada',
      puntos: 40,
    },
  })

  const cliCarlos = await prisma.cliente.create({
    data: {
      nombre: 'Carlos Ortiz',
      telefono: '3158889900',
      email: 'carlos.o@email.com',
      visitas: 1,
      notas: 'Cliente nuevo',
      puntos: 0,
    },
  })

  // 6. Crear Citas de Prueba
  console.log('-> Creando citas en agenda...')
  const pad = (n) => String(n).padStart(2, '0')
  const d = new Date()
  const hoy = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  const cita1 = await prisma.cita.create({
    data: {
      clienteId: cliJuan.id,
      profesionalId: profAndres.id,
      fecha: hoy,
      hora: '09:30',
      duracionMin: 30,
      estado: 'CONFIRMADA',
      valorEstimado: 25000,
      notas: 'Corte habitual degradado',
      servicios: {
        create: [{ servicioId: serv1.id, precio: 25000 }],
      },
    },
  })

  const cita2 = await prisma.cita.create({
    data: {
      clienteId: cliLuis.id,
      profesionalId: profAndres.id,
      fecha: hoy,
      hora: '14:30',
      duracionMin: 60,
      estado: 'PROGRAMADA',
      valorEstimado: 40000,
      notas: 'Combo corte + barba',
      servicios: {
        create: [{ servicioId: serv2.id, precio: 40000 }],
      },
    },
  })

  const cita3 = await prisma.cita.create({
    data: {
      clienteId: cliMateo.id,
      profesionalId: profCamilo.id,
      fecha: hoy,
      hora: '11:00',
      duracionMin: 30,
      estado: 'EN_ATENCION',
      valorEstimado: 18000,
      notas: 'Arreglo de barba con navaja y toalla',
      servicios: {
        create: [{ servicioId: serv3.id, precio: 18000 }],
      },
    },
  })

  console.log('¡Población de datos iniciales finalizada con éxito!')
}

seed()
  .catch((e) => {
    console.error('Error durante la ejecución del seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
