import { Router } from 'express'
import { registrarPago, getPagos, getReporteFinanciero } from '../controllers/paymentController.js'
import { autenticarToken } from '../middlewares/authMiddleware.js'
import { autorizarRoles } from '../middlewares/roleMiddleware.js'

const router = Router()

router.use(autenticarToken)

// Ambos roles pueden cobrar una cita atendida
router.post('/', registrarPago)

// getPagos filtra automáticamente: el trabajador solo ve sus propias ventas, el admin ve todas
router.get('/', getPagos)

// Reporte financiero completo exclusivo del administrador
router.get('/reporte', autorizarRoles('ADMINISTRADOR'), getReporteFinanciero)

export default router
