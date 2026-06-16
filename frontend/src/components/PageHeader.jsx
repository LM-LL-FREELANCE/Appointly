import { Group } from '@mantine/core'
import { SidebarBurger } from './SidebarBurger.jsx'

export function PageHeader({ children }) {
  return (
    <Group align="center" mb="md" style={{ minHeight: 52 }}>
      <SidebarBurger />
      {children}
    </Group>
  )
}
