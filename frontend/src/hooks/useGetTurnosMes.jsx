import { useQuery } from "@tanstack/react-query";
import { getTurnosMes } from "../api/clientes.js"

export default function useGetTurnosMes({ dni }) {
  return useQuery({
    queryFn: () => getTurnosMes({ dni }),
    queryKey: ["mes"]
  })
}