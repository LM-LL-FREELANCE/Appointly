import { getTurnosByProfesional } from "../services/profesionales";
import { useQuery } from "@tanstack/react-query"


export default function useProfesionalDays({ dni_profesional, desde, hasta, estado }) {
  return useQuery({
    queryKey: ['agenda', dni_profesional, desde, hasta, estado],
    queryFn: () => getTurnosByProfesional({ dni_profesional, desde, hasta, estado }),
    enabled: !!dni_profesional && !!desde && !!hasta
  })
}