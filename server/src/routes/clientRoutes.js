import { Router } from 'express'
import { getClientes, crearCliente } from '../controllers/clientController.js'
import { autenticarToken } from '../middlewares/authMiddleware.js'

const router = Router()

// Ambos roles pueden consultar y registrar clientes
router.get('/', autenticarToken, getClientes)
router.post('/', autenticarToken, crearCliente)

export default router
