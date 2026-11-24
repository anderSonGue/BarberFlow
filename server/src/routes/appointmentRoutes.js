import { Router } from 'express'
import {
  getCitas,
  getDisponibilidad,
  crearCita,
  cambiarEstado,
  eliminarCita,
} from '../controllers/appointmentController.js'
import { autenticarToken } from '../middlewares/authMiddleware.js'
import { autorizarRoles } from '../middlewares/roleMiddleware.js'

const router = Router()

router.use(autenticarToken)

router.get('/disponibilidad', getDisponibilidad)
router.get('/', getCitas)
router.post('/', crearCita)
router.put('/:id/estado', cambiarEstado)
// Solo el administrador puede eliminar citas
router.delete('/:id', autorizarRoles('ADMINISTRADOR'), eliminarCita)

export default router
