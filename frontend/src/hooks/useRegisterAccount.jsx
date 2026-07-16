import { useMutation } from "@tanstack/react-query";
import { createAccount } from "../api/clientes.js";

export default function useCreateAccount() {
  return useMutation({
    mutationFn: createAccount,
  })
}