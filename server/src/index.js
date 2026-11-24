import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from './middlewares/errorHandler.js'

// Importación de rutas
import authRoutes from './routes/authRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import clientRoutes from './routes/clientRoutes.js'
import inventoryRoutes from './routes/inventoryRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import userRoutes from './routes/userRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middlewares globales
app.use(cors())
app.use(express.json())

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ ok: true, mensaje: 'BarberFlow API en ejecución', timestamp: new Date().toISOString() })
})

// Enrutadores principales
app.use('/api/auth', authRoutes)
app.use('/api/citas', appointmentRoutes)
app.use('/api/servicios', serviceRoutes)
app.use('/api/clientes', clientRoutes)
app.use('/api/inventario', inventoryRoutes)
app.use('/api/pagos', paymentRoutes)
app.use('/api/usuarios', userRoutes)

// Manejador centralizado de errores
app.use(errorHandler)

const server = app.listen(PORT, () => {
  console.log(`[BarberFlow API] Servidor iniciado y escuchando en http://localhost:${PORT}`)
})

export { app, server }
export default app
