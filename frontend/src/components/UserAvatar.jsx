import { Avatar } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export function UserAvatar({
  size,
  radius = '100%',
  src,
  name,
  withLink = true,
  component,
  to,
  alt,
  color,
  ...props
}) {
  const { user } = useAuth()

  const resolvedName =
    name !== undefined
      ? name
      : user
        ? `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim()
        : ''

  const resolvedSrc =
    src !== undefined ? src : user?.foto_url || undefined

  const resolvedComponent =
    component !== undefined ? component : withLink ? Link : undefined

  const resolvedTo =
    to !== undefined ? to : withLink ? '/miperfil' : undefined

  const resolvedAlt = alt || resolvedName || 'Avatar de usuario'

  const resolvedColor =
    color !== undefined
      ? color
      : resolvedName
        ? 'initials'
        : undefined

  return (
    <Avatar
      size={size}
      radius={radius}
      component={resolvedComponent}
      to={resolvedTo}
      src={resolvedSrc}
      name={resolvedName || undefined}
      color={resolvedColor}
      alt={resolvedAlt}
      {...props}
    />
  )
}
