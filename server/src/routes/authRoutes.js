import { Router } from 'express'
import { login, perfilActual } from '../controllers/authController.js'
import { autenticarToken } from '../middlewares/authMiddleware.js'

const router = Router()

router.post('/login', login)
router.get('/me', autenticarToken, perfilActual)

export default router
