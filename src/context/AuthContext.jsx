import { createContext, useContext, useState, useEffect } from 'react'
import { api, authStorage } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => authStorage.getUser())
  const [token, setToken] = useState(() => authStorage.getToken())
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function verificarSesion() {
      const storedToken = authStorage.getToken()
      if (!storedToken) {
        setCargando(false)
        return
      }

      try {
        const res = await api.getPerfil()
        if (res.ok && res.usuario) {
          setUsuario(res.usuario)
          authStorage.setUser(res.usuario)
        } else {
          logout()
        }
      } catch (err) {
        logout()
      } finally {
        setCargando(false)
      }
    }

    verificarSesion()

    const handleUnauthorized = () => logout()
    window.addEventListener('barberflow:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('barberflow:unauthorized', handleUnauthorized)
  }, [])

  const login = async (email, password) => {
    const res = await api.login(email, password)
    if (res.ok) {
      setToken(res.token)
      setUsuario(res.usuario)
      return res.usuario
    }
    throw new Error(res.error || 'Fallo en autenticación.')
  }

  const logout = () => {
    api.logout()
    setToken(null)
    setUsuario(null)
  }

  const esAdmin = usuario?.rol === 'ADMINISTRADOR'
  const esTrabajador = usuario?.rol === 'TRABAJADOR'

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        cargando,
        autenticado: !!usuario && !!token,
        esAdmin,
        esTrabajador,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider')
  }
  return context
}
