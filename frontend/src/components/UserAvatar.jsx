import { Avatar } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export function UserAvatar({
  size,
  radius = 'xl',
  component = Link,
  to = '/miperfil',
  alt,
  ...props
}) {
  const { user } = useAuth()
  const name = user ? `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() : ''

  return (
    <Avatar
      size={size}
      radius={radius}
      component={component}
      to={to}
      src={user?.foto_url || undefined}
      name={name || undefined}
      color={name ? 'initials' : undefined}
      alt={alt || name || 'Avatar de usuario'}
      {...props}
    />
  )
}
