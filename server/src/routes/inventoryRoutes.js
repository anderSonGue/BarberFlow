import { Router } from 'express'
import {
  getInsumos,
  crearInsumo,
  registrarEntrada,
  getMovimientos,
  getHistorialPorCliente,
  getHistorialPorProducto,
} from '../controllers/inventoryController.js'
import { autenticarToken } from '../middlewares/authMiddleware.js'
import { autorizarRoles } from '../middlewares/roleMiddleware.js'

const router = Router()

// TRABAJADOR TIENE RESTRICCIÓN TOTAL AL INVENTARIO
// Todas las rutas de inventario requieren rol ADMINISTRADOR
router.use(autenticarToken, autorizarRoles('ADMINISTRADOR'))

router.get('/', getInsumos)
router.post('/', crearInsumo)
router.post('/:id/entrada', registrarEntrada)
router.get('/movimientos', getMovimientos)
router.get('/consumos/cliente/:clienteId', getHistorialPorCliente)
router.get('/consumos/producto/:insumoId', getHistorialPorProducto)

export default router
