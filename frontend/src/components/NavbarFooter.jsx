import { NavLink, Divider, useMantineColorScheme } from '@mantine/core'
import { IconSettings, IconLogout, IconMoon, IconSun } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { navLinkStyles } from './navLinkStyles.js'

export function NavbarFooter({ onNavigate }) {
  const { logout } = useAuth()
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()

  return (
    <>
      <Divider mb="xs" />

      <NavLink
        label="Configuración"
        leftSection={<IconSettings size={20} stroke={1.5} />}
        component={Link}
        to="/miperfil"
        onClick={onNavigate}
        styles={navLinkStyles}
      />

      <NavLink
        label={colorScheme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
        leftSection={colorScheme === 'light'
          ? <IconMoon size={20} stroke={1.5} />
          : <IconSun size={20} stroke={1.5} />}
        component="button"
        onClick={toggleColorScheme}
        styles={navLinkStyles}
      />

      <NavLink
        label="Cerrar sesión"
        leftSection={<IconLogout size={20} stroke={1.5} color="var(--mantine-color-red-6)" />}
        component="button"
        onClick={logout}
        styles={{
          root: navLinkStyles.root,
          label: { ...navLinkStyles.label, color: 'var(--mantine-color-red-6)' },
        }}
      />
    </>
  )
}
