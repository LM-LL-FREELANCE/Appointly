import { useMutation } from "@tanstack/react-query"
import { deleteAccCliente } from "../api/clientes.js"

export default function useDeleteAccCliente() {
  return useMutation({
    mutationFn: deleteAccCliente
  })
}