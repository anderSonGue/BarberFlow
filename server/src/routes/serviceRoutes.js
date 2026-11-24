import { Router } from 'express'
import { getServicios, crearServicio } from '../controllers/serviceController.js'
import { autenticarToken } from '../middlewares/authMiddleware.js'
import { autorizarRoles } from '../middlewares/roleMiddleware.js'

const router = Router()

// Ambos roles pueden consultar los servicios
router.get('/', autenticarToken, getServicios)
// Solo el administrador puede crear servicios
router.post('/', autenticarToken, autorizarRoles('ADMINISTRADOR'), crearServicio)

export default router
