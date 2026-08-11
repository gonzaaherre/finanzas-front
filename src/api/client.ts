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

// Un solo refresh a la vez: las requests que fallan con 401 mientras se refresca
// quedan encoladas y se reintentan con el token nuevo.
let isRefreshing = false
let pendingQueue: {
  resolve: (token: string) => void
  reject: (err: unknown) => void
}[] = []

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token)
    else reject(error)
  })
  pendingQueue = []
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status
    const isAuthCall = original?.url?.includes('/auth/')

    if (status !== 401 || original._retry || isAuthCall) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      forceLogout()
      return Promise.reject(error)
    }

    // Si ya hay un refresh en curso, esperamos su resultado.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(client(original))
          },
          reject,
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      // axios "pelado" para no re-entrar en este interceptor ni mandar el access vencido.
      const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken })
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)
      flushQueue(null, data.token)
      original.headers.Authorization = `Bearer ${data.token}`
      return client(original)
    } catch (refreshError) {
      flushQueue(refreshError, null)
      forceLogout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
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
