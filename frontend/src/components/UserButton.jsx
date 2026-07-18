import { Avatar, Group, Text, UnstyledButton, Menu, useMantineColorScheme } from '@mantine/core'
import { IconChevronRight } from "@tabler/icons-react"
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import classes from './UserButton.module.css'

import { IconSettings, IconLogout, IconMoon, IconSun } from '@tabler/icons-react'

export function UserButton() {
  const { logout } = useAuth()
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()

  return (
    <Menu shadow="md" width={140} position="left" trigger="click-hover" openDelay={100} closeDelay={300}>
      <Menu.Target>

        <UnstyledButton className={classes.user}>
          <Group justify="space-between" wrap="nowrap">
            <Group wrap="nowrap">
              <Avatar radius="xl" alt="" />
              <div>
                <Text size="sm" fw={500}></Text>
                <Text c="dimmed" size="xs"></Text>
              </div>
            </Group>
            <IconChevronRight size={14} stroke={1.5} />
          </Group>
        </UnstyledButton>

      </Menu.Target>

      <Menu.Dropdown>
        {/* <Menu.Label>Application</Menu.Label> */}
        <Menu.Item leftSection={<IconSettings size={14} />} component={Link} to="/miperfil">
          Configuración
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          leftSection={colorScheme === 'light' ? <IconMoon size={14} /> : <IconSun size={14} />}
          onClick={toggleColorScheme}
        >
          {colorScheme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
        </Menu.Item>
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={14} />}
          onClick={logout}
        >
          Cerrar sesión
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
