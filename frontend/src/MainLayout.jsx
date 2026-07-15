import { AppShell, Group, Text, Drawer } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Outlet } from 'react-router-dom'

/*Hook and some buttons (Con las mismas rutas relativas) */
import { UserButton } from './components/UserButton.jsx'
import { NavLinks } from './components/NavLinks.jsx'
import { SidebarContext } from './hooks/useSidebar.js'

export default function MainLayout({ links, role }) {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure()
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true)
  return (
    <SidebarContext.Provider value={{ mobileOpened, toggleMobile, desktopOpened, toggleDesktop }}>
      <AppShell
        navbar={{
          width: 230,
          breakpoint: 'md',
          collapsed: { mobile: true, desktop: !desktopOpened },
        }}
        padding="md">

        <AppShell.Navbar p="sm" visibleFrom="md">
          <AppShell.Section>
            <Group px="xs" py="sm">
              <Text fw={700} size="lg">Appointly</Text>
            </Group>
          </AppShell.Section>
          <AppShell.Section grow>
            <NavLinks links={links} />
          </AppShell.Section>
          <AppShell.Section>
            <UserButton />
          </AppShell.Section>
        </AppShell.Navbar>

        <Drawer
          opened={mobileOpened}
          onClose={closeMobile}
          size={230}
          padding="sm"
          title="Appointly"
          hiddenFrom="md">
          <NavLinks links={links} onNavigate={closeMobile} />
        </Drawer>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>

      </AppShell>
    </SidebarContext.Provider>
  )
}