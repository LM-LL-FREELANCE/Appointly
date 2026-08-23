import { Badge } from '@mantine/core'

const ESTADO_COLOR = {
  activo: 'teal',
  cancelado: 'red',
  completado: 'gray',
  ausente: 'orange',
  reprogramado: 'yellow',
}

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
      {estado}
    </Badge>
  )
}
