import { useMutation } from "@tanstack/react-query";
import { updateByDni } from "../api/clientes";

export default function useUpdateCliente() {
  return useMutation({
    mutationFn: updateByDni,
  })
}