import { AppShell, Group, NavLink, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Route, Routes } from 'react-router-dom'

import Dashboard from './pages/Dashboard.jsx'
import Agenda from './pages/Agenda.jsx'
import Turnos from './pages/Turnos.jsx'
import Horarios from './pages/Horarios.jsx'
import MiPerfil from './pages/MiPerfil.jsx'

import { UserButton } from './components/UserButton.jsx'
import { SidebarContext } from './hooks/useSidebar.js'

export default function App() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <SidebarContext.Provider value={{ mobileOpened, toggleMobile, desktopOpened, toggleDesktop }}>
      <AppShell
        navbar={{ width: 230, breakpoint: 'md', collapsed: { mobile: !mobileOpened, desktop: !desktopOpened } }}
        padding="md">

        <AppShell.Navbar p="sm">
          <AppShell.Section>
            <Group px="xs" py="sm">
              <Text fw={700} size="lg">Appointly</Text>
            </Group>
          </AppShell.Section>
          <AppShell.Section grow>
            <NavLink label="Dashboard" href="/" />
            <NavLink label="Agenda" href="/agenda" />
            <NavLink label="Turnos" href="/turnos" />
            <NavLink label="Horarios de Atención" href="/horarios" />
            <NavLink label="Mi Perfil" href="/perfil" />
          </AppShell.Section>
          <AppShell.Section>
            <UserButton />
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/turnos" element={<Turnos />} />
            <Route path="/horarios" element={<Horarios />} />
            <Route path="/perfil" element={<MiPerfil />} />
          </Routes>
        </AppShell.Main>

      </AppShell>
    </SidebarContext.Provider>
  );
}