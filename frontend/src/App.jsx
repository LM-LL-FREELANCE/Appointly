import { Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'

/*Auth need components */
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'
import ProfessionalLogin from './pages/ProfessionalLogin.jsx'

/*Other components */
import Dashboard from './pages/professional/Dashboard/Dashboard.jsx'
import Agenda from './pages/Agenda.jsx'
import Turnos from './pages/Turnos.jsx'
import Horarios from './pages/Horarios.jsx'
import Buscar from './pages/Buscar.jsx'
import Reservar from './pages/Reservar.jsx'
import MisTurnos from './pages/client/MisTurnos/MisTurnos.jsx'
import User from './pages/User.jsx'
import MiPerfil from './pages/MiPerfil.jsx'
import MainLayout from './MainLayout.jsx'
import Inicio from './pages/Inicio.jsx'

export default function App() {
  const { user } = useAuth()

  const linksForProfesional = [
    { label: "Dashboard", path: "/dashboard", element: <Dashboard /> },
    { label: "Agenda", path: "/agenda", element: <Agenda /> },
    { label: "Turnos", path: "/turnos", element: <Turnos /> },
    { label: "Horarios de Atencion", path: "/horarios", element: <Horarios /> },
  ]

  const defaultLinks = [
    { label: "Inicio", path: "/inicio", element: <Inicio /> },
    { label: "Buscar Doctores", path: "/buscar", element: <Buscar /> },
    { label: "Reservar Turno", path: "/reservar", element: <Reservar /> },
    { label: "Mis Turnos", path: "/misturnos/*", element: <MisTurnos /> },
  ]

  const links = (user?.role === "profesional") ? linksForProfesional : defaultLinks

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/professional-login" element={<ProfessionalLogin />} />
      <Route path="/registrarse" element={<SignUp />} />

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
  )
}