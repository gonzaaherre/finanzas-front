import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import { logout as logoutApi } from '../api/auth'
import { getCurrentUser } from '../api/users'

interface AuthContextValue {
  user: User | null
  login: (token: string, refreshToken: string, userData: User) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    // Pintado optimista con el caché local para evitar parpadeo.
    const cached = localStorage.getItem('user')
    if (cached) setUser(JSON.parse(cached))

    // Fuente de verdad: el backend. Valida la sesión y trae el usuario fresco.
    // Si el access venció, el interceptor refresca solo; si el refresh también
    // falla, redirige a /login.
    getCurrentUser()
      .then(({ data }) => {
        const fresh = { email: data.email, name: data.name }
        setUser(fresh)
        localStorage.setItem('user', JSON.stringify(fresh))
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = (token: string, refreshToken: string, userData: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken')
    // Revocamos el refresh token en el backend (best-effort).
    if (refreshToken) logoutApi(refreshToken).catch(() => {})
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
