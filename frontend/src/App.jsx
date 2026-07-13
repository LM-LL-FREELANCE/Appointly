import { Route, Routes } from 'react-router-dom'
import { useState } from 'react'

/*Auth need components */
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'

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
  const [rol, setRol] = useState("profesional") // This is just for testing, in a real app you would get the role from the user context or auth state

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
  const links = (rol === "profesional") ? linksForProfesional : defaultLinks

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registrarse" element={<SignUp />} />
      <Route path="/" element={<MainLayout links={links} rol={rol} />}>
        {links.map(link => (
          <Route key={link.path} path={link.path} element={link.element} />
        ))}
        <Route path="/user" element={<User />} />
        <Route path="/miperfil" element={<MiPerfil />} />
      </Route>
    </Routes>
  )
}