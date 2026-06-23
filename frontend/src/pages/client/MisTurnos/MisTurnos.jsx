import { Routes, Route } from 'react-router-dom'
import MisTurnosPrincipal from './MisTurnosPrincipal'
import { DetalleTurnoMobile } from './DetalleTurnoMobile'

export default function MisTurnos() {
  return (
    <Routes>
      <Route path="*" element={<MisTurnosPrincipal />} />
      <Route path="detalle" element={<DetalleTurnoMobile />} />
    </Routes>
  );
}