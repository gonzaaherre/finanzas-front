import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({ baseURL })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function forceLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

// Un único refresh compartido: si varias requests fallan con 401 a la vez (p.ej. al
// montar una página que dispara varias llamadas), TODAS esperan el mismo refresh.
// Esto es clave con rotación de refresh tokens: lanzar dos /auth/refresh en paralelo
// haría que el segundo use un token que el primero ya borró y falle.
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('No hay refresh token')
  // axios "pelado" para no re-entrar en este interceptor ni mandar el access vencido.
  const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken })
  localStorage.setItem('token', data.token)
  localStorage.setItem('refreshToken', data.refreshToken)
  return data.token
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const status = error.response?.status
    const isAuthCall = original?.url?.includes('/auth/')

    if (status !== 401 || !original || original._retry || isAuthCall) {
      return Promise.reject(error)
    }

    if (!localStorage.getItem('refreshToken')) {
      forceLogout()
      return Promise.reject(error)
    }

    // Marcar antes de reintentar: si el reintento vuelve a dar 401, no re-entra acá
    // (evita bucles de refresh infinitos).
    original._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null })
      }
      const token = await refreshPromise
      original.headers.Authorization = `Bearer ${token}`
      return client(original)
    } catch (refreshError) {
      forceLogout()
      return Promise.reject(refreshError)
    }
  },
)

export function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    return err.response?.data?.error ?? fallback
  }
  return fallback
}

export default client
