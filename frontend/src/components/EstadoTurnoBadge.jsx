import { Badge } from '@mantine/core'
import { ESTADO_COLOR, estadoLabel } from '../utils/estadosTurno.js'

export function EstadoTurnoBadge({ estado, ...badgeProps }) {
  const color = ESTADO_COLOR[estado] ?? 'gray'

  return (
    <Badge
      variant="light"
      color={color}
      radius="xl"
      size="md"
      tt="uppercase"
      {...badgeProps}
    >
      {estadoLabel(estado)}
    </Badge>
  )
}
