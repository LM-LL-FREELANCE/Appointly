import { Badge } from '@mantine/core'

const ROL_CUENTA = {
  cliente: { color: 'brand', label: 'Cliente' },
  profesional: { color: 'teal', label: 'Profesional' },
  admin: { color: 'violet', label: 'Admin' },
}

export function RolCuentaBadge({ rol, ...badgeProps }) {
  const { color, label } = ROL_CUENTA[rol] ?? { color: 'gray', label: rol ?? '' }

  return (
    <Badge variant="outline" radius="xl" size="md" {...badgeProps}>
      {label}
    </Badge>
  )
}
