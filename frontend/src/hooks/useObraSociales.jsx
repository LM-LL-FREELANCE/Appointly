import { getAllObraSociales } from "../api/profesionales.js";
import { useQuery } from "@tanstack/react-query"

export default function useObrasSociales(options = {}) {
  return useQuery({
    queryKey: ["obrasociales"],
    queryFn: getAllObraSociales,
    ...options,
  })
}