import { IconAlertOctagon, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'

const ICONOS = {
  info: IconInfoCircle,
  advertencia: IconAlertTriangle,
  critico: IconAlertOctagon,
}

export function AvisoIcon({ tipo = 'info', size = 18 }) {
  const Icono = ICONOS[tipo] ?? ICONOS.info
  return <Icono size={size} />
}
