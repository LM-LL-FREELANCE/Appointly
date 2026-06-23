import { Routes, Route } from 'react-router-dom'
import MisTurnosPrincipal from './MisTurnosPrincipal'
import { DetalleTurnoMobile } from './DetalleTurnoMobile'
import { CancelarTurnoMobile } from './CancelarTurnoMobile'

export default function MisTurnos() {
  return (
    <Routes>
      <Route index element={<MisTurnosPrincipal />} />
      {/* Rutas para mobile */}
      <Route path="detalle" element={<DetalleTurnoMobile />} />
      <Route path="cancelar" element={<CancelarTurnoMobile />} />
    </Routes>
  );
}