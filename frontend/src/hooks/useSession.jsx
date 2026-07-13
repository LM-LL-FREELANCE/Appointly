import { useState, useEffect } from 'react'
import { getMe } from '../api/api.js'

export function useSesion() {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    getMe()
      .then(user => { if (activo) setUsuario(user) })
      .catch(() => { if (activo) setUsuario(null) })
      .finally(() => { if (activo) setCargando(false) })

    return () => { activo = false }
  }, [])

  return { usuario, setUsuario, cargando }
}