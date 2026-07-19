import { NavLink } from '@mantine/core'
import { Link, useLocation } from 'react-router-dom'
import { navLinkStyles, navLinkClassName } from './navLinkPresentation.js'

export function NavLinks({ links, onNavigate }) {
  const { pathname } = useLocation()
  return links.map(link => (
    <NavLink
      key={link.path}
      label={link.label}
      leftSection={link.icon && <link.icon size={20} stroke={1.5} />}
      component={Link}
      to={link.path}
      active={pathname === link.path}
      onClick={onNavigate}
      className={navLinkClassName}
      styles={navLinkStyles}
    />
  ))
}
