import { useQuery } from "@tanstack/react-query";
import { getTurnosClienteByDni } from "../services/clientes";

export default function useGetHistorial({ dni, rol }) {
  return useQuery({
    queryKey: ["historial"],
    queryFn: () => getTurnosClienteByDni({ dni, rol })
  })
}