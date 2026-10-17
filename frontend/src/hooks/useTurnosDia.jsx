import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTurnosByProfesional } from '../api/profesionales.js'
import { ahoraEnZona } from '../utils/fechas.utils.js'

// Turnos of one day for the logged-in professional. `initialData` (the snapshot the
// Agenda passes through the router) only paints the first frame; the query is the source
// of truth and polls (S6: no websockets), pausing while the tab is hidden.
export default function useTurnosDia({ dni, fecha, initialData }) {
  return useQuery({
    queryKey: ['turnos-dia', dni, fecha],
    queryFn: () => getTurnosByProfesional({ dni_profesional: dni, desde: fecha, hasta: fecha }),
    enabled: !!dni && !!fecha,
    initialData,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  })
}

// Every cache that shows professional turnos: the day view, the Agenda and the Dashboard.
export function invalidarTurnosProfesional(queryClient, idTurno) {
  queryClient.invalidateQueries({ queryKey: ['turnos-dia'] })
  queryClient.invalidateQueries({ queryKey: ['agenda'] })
  queryClient.invalidateQueries({ queryKey: ['turnos-profesional'] })
  if (idTurno) {
    queryClient.invalidateQueries({ queryKey: ['turno-eventos', idTurno] })
    queryClient.invalidateQueries({ queryKey: ['turno', idTurno] })
  }
}

// "Now" in Buenos Aires, refreshed every `cadaMs`, so time-dependent actions (e.g. "Marcar
// ausente" once the turno started) appear without a refetch or a reload.
export function useAhoraEnZona(cadaMs = 30_000) {
  const [ahora, setAhora] = useState(() => ahoraEnZona())

  useEffect(() => {
    const id = setInterval(() => setAhora(ahoraEnZona()), cadaMs)
    return () => clearInterval(id)
  }, [cadaMs])

  return ahora
}
