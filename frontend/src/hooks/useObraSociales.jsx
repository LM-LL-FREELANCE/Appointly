import { getAllObraSociales } from "../services/profesionales";
import { useQuery } from "@tanstack/react-query"

export default function useObrasSociales() {
  return useQuery({
    queryKey: ["obrasociales"],
    queryFn: getAllObraSociales
  })
}