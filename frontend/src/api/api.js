const BASE_URL = ""

export async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
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