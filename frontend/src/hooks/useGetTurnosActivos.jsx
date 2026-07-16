import { useQuery } from "@tanstack/react-query";
import { getTurnosClienteByDni } from "../api/clientes";

export default function useGetTurnosActivos({ dni, estado = "" }) {
  return useQuery({
    queryFn: () => getTurnosClienteByDni({ dni, estado }),
    queryKey: ["activos"]
  })
}