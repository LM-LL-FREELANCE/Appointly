import { NavLink } from '@mantine/core'
import { Link, useLocation } from 'react-router-dom'

export function NavLinks({ links, onNavigate }) {
  const { pathname } = useLocation()
  return links.map(link => (
    <NavLink
      key={link.path}
      label={link.label}
      component={Link}
      to={link.path}
      active={pathname === link.path}
      onClick={onNavigate}
    />
  ))
}