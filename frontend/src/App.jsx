import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Center, Loader } from '@mantine/core'
import {
  IconLayoutDashboard,
  IconCalendarWeek,
  IconClipboardList,
  IconClock,
  IconHome2,
  IconSearch,
  IconCalendarPlus,
  IconCalendarEvent,
} from '@tabler/icons-react'
import { useAuth } from './hooks/useAuth.js'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'

/*Auth components (lazy loaded) */
const Login = lazy(() => import('./pages/Login.jsx'))
const SignUp = lazy(() => import('./pages/SignUp.jsx'))
const ProfessionalLogin = lazy(() => import('./pages/ProfessionalLogin.jsx'))
const ProfessionalSignUp = lazy(() => import('./pages/ProfessionalSignUp.jsx'))
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'))

/*Other components (lazy loaded) */
const Dashboard = lazy(() => import('./pages/professional/Dashboard/Dashboard.jsx'))
const Agenda = lazy(() => import('./pages/Agenda.jsx'))
const Turnos = lazy(() => import('./pages/Turnos.jsx'))
const Horarios = lazy(() => import('./pages/Horarios.jsx'))
const Buscar = lazy(() => import('./pages/Buscar.jsx'))
const Reservar = lazy(() => import('./pages/Reservar.jsx'))
const MisTurnos = lazy(() => import('./pages/client/MisTurnos/MisTurnos.jsx'))
const User = lazy(() => import('./pages/User.jsx'))
const MiPerfil = lazy(() => import('./pages/MiPerfil.jsx'))
const Inicio = lazy(() => import('./pages/Inicio.jsx'))

/*Layout & static components */
import MainLayout from './MainLayout.jsx'

export default function App() {
  const { user } = useAuth()

  const linksForProfesional = [
    { label: "Dashboard", path: "/dashboard", element: <Dashboard />, icon: IconLayoutDashboard },
    { label: "Agenda", path: "/agenda", element: <Agenda />, icon: IconCalendarWeek },
    { label: "Turnos", path: "/turnos", element: <Turnos />, icon: IconClipboardList },
    { label: "Horarios de Atención", path: "/horarios", element: <Horarios />, icon: IconClock },
  ]

  const defaultLinks = [
    { label: "Inicio", path: "/", element: <Inicio />, icon: IconHome2 },
    { label: "Buscar Doctores", path: "/buscar", element: <Buscar />, icon: IconSearch },
    { label: "Reservar Turno", path: "/reservar", element: <Reservar />, icon: IconCalendarPlus },
    { label: "Mis Turnos", path: "/misturnos/*", element: <MisTurnos />, icon: IconCalendarEvent },
  ]

  const links = (user?.role === "profesional") ? linksForProfesional : defaultLinks

  return (
    <Suspense fallback={<Center h="100vh"><Loader /></Center>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/professional-login" element={<ProfessionalLogin />} />
        <Route path="/professional-signup" element={<ProfessionalSignUp />} />
        <Route path="/registrarse" element={<SignUp />} />
        <Route path="/resetear-contraseña/:token?" element={<ResetPassword />} />

        <Route path="/" element={<MainLayout links={links} role={user?.role} />}>

          {defaultLinks.map(link => <Route key={link.path} path={link.path} element={link.element} />)}

          <Route element={<ProtectedRoute />}>
            <Route path="/user" element={<User />} />
            <Route path="/miperfil" element={<MiPerfil />} />
          </Route>

          <Route element={<ProtectedRoute roles={['profesional']} />}>
            {linksForProfesional.map(link => <Route key={link.path} path={link.path} element={link.element} />)}
          </Route>

        </Route>
      </Routes>
    </Suspense>
  )
}
