import { useEffect, useMemo, useState } from 'react'
import { Alert, Stack, Text } from '@mantine/core'
import { useAvisosActivos } from '../hooks/useAvisos.jsx'
import { avisoTipo } from '../utils/avisos.js'
import { AvisoIcon } from './AvisoIcon.jsx'

const STORAGE_KEY = 'appointly:avisos-descartados'
const MAX_VISIBLES = 2

const leerDescartados = () => {
  try {
    const guardado = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(guardado) ? guardado.map(Number) : []
  } catch {
    return []
  }
}

// Banner global de avisos (DISENO_ADMIN.md §8). Vive dentro de AppShell.Main,
// antes del Outlet, para todos los roles logueados. El backend ya devuelve solo
// activos y vigentes, ordenados por severidad.
export function AvisoBanner() {
  const { data: avisos = [], isError } = useAvisosActivos()
  const [descartados, setDescartados] = useState(leerDescartados)

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(descartados))
    } catch {
      // sessionStorage bloqueado: el dismiss simplemente no persiste.
    }
  }, [descartados])

  const visibles = useMemo(
    () => avisos.filter((aviso) => !descartados.includes(Number(aviso.id))),
    [avisos, descartados],
  )

  if (isError || visibles.length === 0) return null

  const mostrados = visibles.slice(0, MAX_VISIBLES)
  const restantes = visibles.length - mostrados.length

  return (
    <Stack gap="xs" mb="md">
      {mostrados.map((aviso) => {
        const { color } = avisoTipo(aviso.tipo)
        return (
          <Alert
            key={aviso.id}
            color={color}
            variant="light"
            icon={<AvisoIcon tipo={aviso.tipo} />}
            title={aviso.titulo}
            withCloseButton
            closeButtonLabel="Descartar aviso"
            onClose={() => setDescartados((prev) => [...prev, Number(aviso.id)])}
          >
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{aviso.mensaje}</Text>
          </Alert>
        )
      })}
      {restantes > 0 && (
        <Text fz="sm" c="dimmed">y {restantes} {restantes === 1 ? 'aviso más' : 'avisos más'}</Text>
      )}
    </Stack>
  )
}
