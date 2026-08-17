import { useMutation } from "@tanstack/react-query";
import { deleteAccCliente } from "../api/clientes";

export default function useDeleteCliente() {
  return useMutation({
    mutationFn: deleteAccCliente
  })
}