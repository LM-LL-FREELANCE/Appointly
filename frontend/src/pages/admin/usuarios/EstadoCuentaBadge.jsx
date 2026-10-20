import { Badge } from '@mantine/core'

const ESTADO_CUENTA = {
  activa: { color: 'teal', label: 'Activa' },
  suspendida: { color: 'yellow', label: 'Suspendida' },
  baja: { color: 'red', label: 'Baja' },
}

export function EstadoCuentaBadge({ estado, ...badgeProps }) {
  const { color, label } = ESTADO_CUENTA[estado] ?? { color: 'gray', label: estado ?? '' }

  return (
    <Badge
      variant="light"
      color={color}
      radius="xl"
      size="md"
      tt="uppercase"
      {...badgeProps}
    >
      {label}
    </Badge>
  )
}
