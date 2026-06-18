import { AppShell, Group, Text, Drawer } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Route, Routes } from 'react-router-dom'
import { useState } from 'react'

/*Auth need components */
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'

/*Other components */
import Dashboard from './pages/Dashboard.jsx'
import Agenda from './pages/Agenda.jsx'
import Turnos from './pages/Turnos.jsx'
import Horarios from './pages/Horarios.jsx'
import Buscar from './pages/Buscar.jsx'
import Reservar from './pages/Reservar.jsx'
import MisTurnos from './pages/MisTurnos.jsx'
import User from './pages/User.jsx'

/*Hook and some buttons */
import { UserButton } from './components/UserButton.jsx'
import { NavLinks } from './components/NavLinks.jsx'
import { SidebarContext } from './hooks/useSidebar.js'

export default function App() {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure()
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true)
  const [rol, setRol] = useState("profesional")

  const linksForProfesional = [
    { label: "Dashboard", path: "/", element: <Dashboard /> },
    { label: "Agenda", path: "/agenda", element: <Agenda /> },
    { label: "Turnos", path: "/turnos", element: <Turnos /> },
    { label: "Horarios de Atencion", path: "/horarios", element: <Horarios /> },
  ]
  const defaultLinks = [
    { label: "Buscar Doctores", path: "/buscar", element: <Buscar /> },
    { label: "Reservar Turno", path: "/reservar", element: <Reservar /> },
    { label: "Mis Turnos", path: "/misturnos", element: <MisTurnos /> },
  ]
  const links = (rol === "profesional") ? linksForProfesional : defaultLinks

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
          <Routes>
            {links.map(link => (
              <Route key={link.path} path={link.path} element={link.element} />
            ))}
            <Route path="/signup" element={<Login />} />
            <Route path="/login" element={<SignUp />} />
            <Route path="/user" element={<User />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </SidebarContext.Provider>
  )
}