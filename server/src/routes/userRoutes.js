import { Router } from 'express'
import { getProfesionales, getUsuarios, crearUsuario } from '../controllers/userController.js'
import { autenticarToken } from '../middlewares/authMiddleware.js'
import { autorizarRoles } from '../middlewares/roleMiddleware.js'

const router = Router()

router.use(autenticarToken)

// Todos los usuarios pueden consultar la lista de profesionales para agendar citas
router.get('/profesionales', getProfesionales)

// Gestión de usuarios restringida exclusivamente al ADMINISTRADOR
router.get('/', autorizarRoles('ADMINISTRADOR'), getUsuarios)
router.post('/', autorizarRoles('ADMINISTRADOR'), crearUsuario)

export default router
