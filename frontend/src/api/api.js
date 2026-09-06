const BASE_URL = import.meta.env.VITE_API_URL || ''
const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || ''

export async function request(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' }

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const error = new Error(data.message ?? `Error ${res.status}`)
    error.status = res.status
    error.code = data.code
    error.fieldErrors = data.fieldErrors
    throw error
  }

  return res.status === 204 ? null : res.json()
}

export const login = (credentials) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) })
export const logout = () => request('/api/auth/logout', { method: 'POST' })
export const getMe = () => request('/api/auth/me')
export const sentEmailPassword = (data) => request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) })
export const verifyToken = (token) => request(`/api/auth/verify-reset-token/${token}`)
export const resetPassword = (data) => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) })
