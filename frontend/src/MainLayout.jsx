import { AppShell, Group, Text, Burger } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Outlet } from 'react-router-dom'

/*Hook and some buttons (Con las mismas rutas relativas) */
import { NavbarFooter } from './components/NavbarFooter.jsx'
import { NavLinks } from './components/NavLinks.jsx'
import { SidebarContext } from './hooks/useSidebar.js'
import { AdminRealtimeChannel } from './socket/AdminRealtimeChannel.jsx'
import { AvisoBanner } from './components/AvisoBanner.jsx'

export default function MainLayout({ links }) {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure()
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure()


  //wuachin el que lee

  return (
    <SidebarContext.Provider value={{ mobileOpened, toggleMobile, desktopOpened, toggleDesktop }}>
      <AdminRealtimeChannel />
      <AppShell
        navbar={{
          width: 230,
          breakpoint: 'md',
          collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
        }}
        padding="md">

        <AppShell.Navbar p="sm">
          <AppShell.Section>
            <Group px="xs" py="sm" justify='space-between'>
              <Text fw={700} size="xl">Appointly</Text>
              <Burger opened onClick={closeMobile} hiddenFrom="md" size="md" />
            </Group>
          </AppShell.Section>
          <AppShell.Section grow>
            <NavLinks links={links} onNavigate={closeMobile} />
          </AppShell.Section>
          <AppShell.Section>
            <NavbarFooter onNavigate={closeMobile} />
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main>
          <AvisoBanner />
          <Outlet />
        </AppShell.Main>

      </AppShell>
    </SidebarContext.Provider>
  )
}
