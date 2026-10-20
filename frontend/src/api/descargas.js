const BASE_URL = import.meta.env.VITE_API_URL || ''
const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || ''

export async function descargarCSV(path, nombreArchivo) {
  const headers = {
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const error = new Error(data.message ?? `Error ${res.status}`)
    error.status = res.status
    error.code = data.code
    throw error
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
