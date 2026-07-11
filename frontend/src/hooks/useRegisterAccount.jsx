import { useMutation } from "@tanstack/react-query";
import { createAccount } from "../services/clientes";

export default function useCreateAccount() {
  return useMutation({
    mutationFn: createAccount,
  })
}