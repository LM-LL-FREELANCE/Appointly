import { getAgendaByProfesional } from "../services/profesionales";
import { useQuery } from "@tanstack/react-query"


export default function useProfesionalDays({ dni_profesional, desde, hasta, estado }) {
  return useQuery({
    queryKey: ['agenda', dni_profesional, desde, hasta, estado],
    queryFn: () => getAgendaByProfesional({ dni_profesional, desde, hasta, estado, rol: "profesional" }),
    enabled: !!dni_profesional && !!desde && !!hasta,
  })
}