import { useQuery } from "@tanstack/react-query";
import { getProfesionalByDni } from "../api/profesionales";

export default function useGetProfesional({ dni, rol }) {
  return useQuery({
    queryKey: ["perfil", "profesional", dni],
    queryFn: () => getProfesionalByDni({ dni }),
    // Asegúrate de que este string coincide exactamente con lo que tienes en user.rol
    enabled: (rol === "profesional" || rol === "profesionales") && !!dni
  })
}