import { Badge } from '@mantine/core'
import { useIsDesktop } from '../hooks/useIsDesktop.js'

const ESTADO_COLOR = {
  activo: 'teal',
  cancelado: 'red',
  completado: 'gray',
  ausente: 'orange',
  reprogramado: 'yellow',
}

export function EstadoTurnoBadge({ estado, ...badgeProps }) {
  const isDesktop = useIsDesktop()
  const color = ESTADO_COLOR[estado] ?? 'gray'

  return (
    <Badge
      variant="light"
      color={color}
      radius="xl"
      size={isDesktop ? 'md' : 'lg'}
      tt={isDesktop ? 'uppercase' : 'uppercase'}
      {...badgeProps}
    >
      {estado}
    </Badge>
  )
}
