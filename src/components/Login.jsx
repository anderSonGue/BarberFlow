import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Por favor complete todos los campos para continuar.')
      return
    }

    setProcesando(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-symbol">BF</span>
          </div>
          <h1 className="login-title">BarberFlow</h1>
          <p className="login-subtitle">Sistema Profesional de Gestión Operativa y Administrativa</p>
        </div>

        {error && (
          <div className="alerta-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="login-email">Correo Electrónico</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@barberflow.com"
              required
              autoFocus
              disabled={procesando}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                id="login-password"
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                required
                disabled={procesando}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                tabIndex="-1"
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {mostrarPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-login-submit" disabled={procesando}>
            {procesando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer-hint">
          <span>Acceso seguro protegido por cifrado y control de acceso por roles (RBAC).</span>
        </div>
      </div>
    </div>
  )
}
