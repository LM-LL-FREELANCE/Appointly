import { useQuery } from "@tanstack/react-query";
import { getProfesionalesSlots } from "../services/turnos";


export default function useSlots({ dni, desde, hasta }) {
  return useQuery({
    queryKey: ['slots', dni, desde, hasta],
    queryFn: () => getProfesionalesSlots({ dni, desde, hasta }),
    enabled: Boolean(dni && desde && hasta),
  })
}